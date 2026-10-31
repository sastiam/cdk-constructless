import type { Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import type * as iam from 'aws-cdk-lib/aws-iam';
import { describe, expect, it } from 'vitest';
import { BudgetScpAction, type BudgetScpActionProps } from '../../src/finops/budget-scp-action';
import { CostBudget } from '../../src/finops/cost-budget';
import { expectNoNagErrors, normalizedTemplate, synth } from '../helpers';

const ALERT_EMAIL = 'alerts@example.com';
const ACCOUNT_ID = '123456789012';

const DEFAULT_DENIED_ACTIONS = [
  'ec2:RunInstances',
  'ec2:StartInstances',
  'lambda:CreateFunction',
  'ecs:CreateService',
  'ecs:RunTask',
  'rds:CreateDBInstance',
  'rds:StartDBInstance',
];

const ORGANIZATIONS_ACTIONS = [
  'organizations:AttachPolicy',
  'organizations:DetachPolicy',
  'organizations:DescribePolicy',
];

interface Built {
  readonly stack: Stack;
  readonly budget: CostBudget;
  readonly action: BudgetScpAction;
}

/**
 * Builds a stack with a `CostBudget` and a `BudgetScpAction` that targets the account `123456789012` by default.
 *
 * @param overrides the action props that replace the defaults of this helper
 * @returns the stack, the budget and the action
 */
function buildScp(overrides: Partial<BudgetScpActionProps> = {}): Built {
  let budget: CostBudget | undefined;
  let action: BudgetScpAction | undefined;
  const stack = synth((s) => {
    budget = new CostBudget(s, 'Budget', { limitUsd: 5, emails: [ALERT_EMAIL] });
    action = new BudgetScpAction(s, 'DenyScp', {
      budget,
      targetIds: [ACCOUNT_ID],
      subscribers: [{ email: ALERT_EMAIL }],
      ...overrides,
    });
  });
  return { stack, budget: budget as CostBudget, action: action as BudgetScpAction };
}

/**
 * Returns the logical id of the SCP policy, which the Budget Action refers to with `Fn::GetAtt` `Id`.
 *
 * @param stack the stack that contains the action
 * @param action the action whose SCP policy is looked up
 * @returns the logical id of the `AWS::Organizations::Policy`
 */
function scpPolicyId(stack: Stack, action: BudgetScpAction): string {
  return stack.getLogicalId(action.policy);
}

/**
 * Returns the logical id of the execution role that the action uses, so tests can look up its `Arn`.
 *
 * @param stack the stack that contains the action
 * @param action the action whose execution role is looked up
 * @returns the logical id of the `AWS::IAM::Role`
 */
function executionRoleId(stack: Stack, action: BudgetScpAction): string {
  return stack.getLogicalId(action.executionRole.role.node.defaultChild as iam.CfnRole);
}

describe('BudgetScpAction', () => {
  describe('default deny SCP', () => {
    it('creates one unattached SERVICE_CONTROL_POLICY without TargetIds', () => {
      const { stack } = buildScp();

      Template.fromStack(stack).resourceCountIs('AWS::Organizations::Policy', 1);
      Template.fromStack(stack).hasResourceProperties('AWS::Organizations::Policy', {
        Type: 'SERVICE_CONTROL_POLICY',
        TargetIds: Match.absent(),
      });
    });

    it('denies the default compute actions in one Deny statement on every resource', () => {
      const { stack } = buildScp();

      Template.fromStack(stack).hasResourceProperties('AWS::Organizations::Policy', {
        Content: Match.exact({
          Version: '2012-10-17',
          Statement: [
            Match.exact({
              Sid: 'BudgetDenyCompute',
              Effect: 'Deny',
              Action: DEFAULT_DENIED_ACTIONS,
              Resource: '*',
            }),
          ],
        }),
      });
    });

    it('retains the policy on stack deletion', () => {
      const { stack } = buildScp();

      Template.fromStack(stack).hasResource('AWS::Organizations::Policy', {
        DeletionPolicy: 'Retain',
      });
    });

    it('creates one APPLY_SCP_POLICY action at 80 percent that attaches the policy to account 123456789012', () => {
      const { stack, budget, action } = buildScp();

      Template.fromStack(stack).resourceCountIs('AWS::Budgets::BudgetsAction', 1);
      Template.fromStack(stack).hasResourceProperties(
        'AWS::Budgets::BudgetsAction',
        Match.exact({
          ActionType: 'APPLY_SCP_POLICY',
          ActionThreshold: { Type: 'PERCENTAGE', Value: 80 },
          ApprovalModel: 'AUTOMATIC',
          BudgetName: budget.budgetName,
          Definition: {
            ScpActionDefinition: {
              PolicyId: { 'Fn::GetAtt': [scpPolicyId(stack, action), 'Id'] },
              TargetIds: [ACCOUNT_ID],
            },
          },
          ExecutionRoleArn: { 'Fn::GetAtt': [executionRoleId(stack, action), 'Arn'] },
          NotificationType: 'ACTUAL',
          Subscribers: [{ Type: 'EMAIL', Address: ALERT_EMAIL }],
        }),
      );
    });

    it('makes the action DependsOn the budget resource', () => {
      const { stack, budget } = buildScp();
      const [action] = Object.values(Template.fromStack(stack).findResources('AWS::Budgets::BudgetsAction'));

      expect(action.DependsOn).toEqual([stack.getLogicalId(budget.budget)]);
    });
  });

  describe('target IDs', () => {
    it('accepts an organizational unit ID as the target', () => {
      const { stack } = buildScp({ targetIds: ['ou-ab12-cdef3456'] });

      Template.fromStack(stack).hasResourceProperties('AWS::Budgets::BudgetsAction', {
        Definition: {
          ScpActionDefinition: {
            TargetIds: ['ou-ab12-cdef3456'],
          },
        },
      });
    });

    it('accepts a root ID as the target', () => {
      const { stack } = buildScp({ targetIds: ['r-ab12'] });

      Template.fromStack(stack).hasResourceProperties('AWS::Budgets::BudgetsAction', {
        Definition: {
          ScpActionDefinition: {
            TargetIds: ['r-ab12'],
          },
        },
      });
    });
  });

  describe('execution role', () => {
    it('grants exactly the three organizations actions on all resources', () => {
      const { stack } = buildScp();

      Template.fromStack(stack).resourceCountIs('AWS::IAM::Policy', 1);
      Template.fromStack(stack).hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.exact({
          Statement: [
            {
              Action: ORGANIZATIONS_ACTIONS,
              Effect: 'Allow',
              Resource: '*',
            },
          ],
          Version: '2012-10-17',
        }),
      });
    });
  });

  describe('validation', () => {
    it('throws for a target that is neither an account, OU nor root ID', () => {
      expect(() => buildScp({ targetIds: ['abc'] })).toThrow(
        'targetIds entries must be account, OU or root IDs, got "abc"',
      );
    });

    it('throws when targetIds is empty', () => {
      expect(() => buildScp({ targetIds: [] })).toThrow('targetIds must contain between 1 and 100 items, got 0');
    });

    it('throws for a denied action that is not service:Action', () => {
      expect(() => buildScp({ deniedActions: ['CreateEndpoint'] })).toThrow(
        'deniedActions entries must look like service:Action, got "CreateEndpoint"',
      );
    });

    it('throws when the SCP document exceeds 5120 characters', () => {
      const deniedActions = Array.from({ length: 400 }, (_, index) => `ec2:${'A'.repeat(20)}${index}`);

      expect(() => buildScp({ deniedActions })).toThrow('SCP document is 11998 characters; the limit is 5120');
    });
  });

  describe('synthesized template', () => {
    it('matches the snapshot and reports no cdk-nag errors', () => {
      const { stack } = buildScp();

      expect(normalizedTemplate(stack)).toMatchSnapshot();
      expectNoNagErrors(stack);
    });
  });
});
