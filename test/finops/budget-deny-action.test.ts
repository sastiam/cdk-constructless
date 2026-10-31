import type { Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as iam from 'aws-cdk-lib/aws-iam';
import { describe, expect, it } from 'vitest';
import { BudgetDenyAction, type BudgetDenyActionProps } from '../../src/finops/budget-deny-action';
import { CostBudget } from '../../src/finops/cost-budget';
import { expectNoNagErrors, normalizedTemplate, synth } from '../helpers';

const ALERT_EMAIL = 'alerts@example.com';

const DEFAULT_DENIED_ACTIONS = [
  'ec2:RunInstances',
  'ec2:StartInstances',
  'lambda:CreateFunction',
  'ecs:CreateService',
  'ecs:RunTask',
  'rds:CreateDBInstance',
  'rds:StartDBInstance',
];

const ATTACH_DETACH_ACTIONS = [
  'iam:AttachRolePolicy',
  'iam:DetachRolePolicy',
  'iam:AttachUserPolicy',
  'iam:DetachUserPolicy',
  'iam:AttachGroupPolicy',
  'iam:DetachGroupPolicy',
];

interface Built {
  readonly stack: Stack;
  readonly budget: CostBudget;
  readonly action: BudgetDenyAction;
}

/**
 * Builds a stack with a `CostBudget` and a `BudgetDenyAction` that targets the role `LabRole` by default.
 *
 * @param overrides the action props that replace the defaults of this helper
 * @returns the stack, the budget and the action
 */
function buildDeny(overrides: Partial<BudgetDenyActionProps> = {}): Built {
  let budget: CostBudget | undefined;
  let action: BudgetDenyAction | undefined;
  const stack = synth((s) => {
    budget = new CostBudget(s, 'Budget', { limitUsd: 5, emails: [ALERT_EMAIL] });
    action = new BudgetDenyAction(s, 'DenyCompute', {
      budget,
      threshold: 80,
      roles: [iam.Role.fromRoleName(s, 'Lab', 'LabRole')],
      subscribers: [{ email: ALERT_EMAIL }],
      ...overrides,
    });
  });
  return { stack, budget: budget as CostBudget, action: action as BudgetDenyAction };
}

/**
 * Returns the logical id of the deny policy of an action, which the Budget Action and the execution role refer to with `Ref`.
 *
 * @param stack the stack that contains the action
 * @param action the action whose deny policy is looked up
 * @returns the logical id of the `AWS::IAM::ManagedPolicy`
 */
function denyPolicyId(stack: Stack, action: BudgetDenyAction): string {
  return stack.getLogicalId(action.denyPolicy.node.defaultChild as iam.CfnManagedPolicy);
}

/**
 * Returns the logical id of the execution role that the action uses, so tests can look up its `Arn`.
 *
 * @param stack the stack that contains the action
 * @param action the action whose execution role is looked up
 * @returns the logical id of the `AWS::IAM::Role`
 */
function executionRoleId(stack: Stack, action: BudgetDenyAction): string {
  return stack.getLogicalId(action.executionRole.role.node.defaultChild as iam.CfnRole);
}

describe('BudgetDenyAction', () => {
  describe('default deny action', () => {
    it('denies the default compute actions on every resource in one Deny statement', () => {
      const { stack } = buildDeny();

      Template.fromStack(stack).resourceCountIs('AWS::IAM::ManagedPolicy', 1);
      Template.fromStack(stack).hasResourceProperties('AWS::IAM::ManagedPolicy', {
        PolicyDocument: Match.exact({
          Statement: [
            {
              Action: DEFAULT_DENIED_ACTIONS,
              Effect: 'Deny',
              Resource: '*',
            },
          ],
          Version: '2012-10-17',
        }),
      });
    });

    it('creates one APPLY_IAM_POLICY action that attaches the deny policy to LabRole at 80 percent', () => {
      const { stack, budget, action } = buildDeny();

      Template.fromStack(stack).resourceCountIs('AWS::Budgets::BudgetsAction', 1);
      Template.fromStack(stack).hasResourceProperties(
        'AWS::Budgets::BudgetsAction',
        Match.exact({
          ActionType: 'APPLY_IAM_POLICY',
          ActionThreshold: { Type: 'PERCENTAGE', Value: 80 },
          ApprovalModel: 'AUTOMATIC',
          BudgetName: budget.budgetName,
          Definition: {
            IamActionDefinition: {
              PolicyArn: { Ref: denyPolicyId(stack, action) },
              Roles: ['LabRole'],
            },
          },
          ExecutionRoleArn: { 'Fn::GetAtt': [executionRoleId(stack, action), 'Arn'] },
          NotificationType: 'ACTUAL',
          Subscribers: [{ Type: 'EMAIL', Address: ALERT_EMAIL }],
        }),
      );
    });

    it('makes the action DependsOn the budget resource', () => {
      const { stack, budget } = buildDeny();
      const [action] = Object.values(Template.fromStack(stack).findResources('AWS::Budgets::BudgetsAction'));

      expect(action.DependsOn).toEqual([stack.getLogicalId(budget.budget)]);
    });
  });

  describe('execution role scoped to the policy', () => {
    it('allows only the six attach and detach actions, limited to the deny policy ARN', () => {
      const { stack, action } = buildDeny();

      Template.fromStack(stack).resourceCountIs('AWS::IAM::Policy', 1);
      Template.fromStack(stack).hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.exact({
          Statement: [
            {
              Action: ATTACH_DETACH_ACTIONS,
              Condition: { ArnEquals: { 'iam:PolicyARN': { Ref: denyPolicyId(stack, action) } } },
              Effect: 'Allow',
              Resource: '*',
            },
          ],
          Version: '2012-10-17',
        }),
      });
    });
  });

  describe('users and groups', () => {
    it('maps users and groups to their names and omits the Roles list', () => {
      let action: BudgetDenyAction | undefined;
      const stack = synth((s) => {
        const budget = new CostBudget(s, 'Budget', { limitUsd: 5, emails: [ALERT_EMAIL] });
        action = new BudgetDenyAction(s, 'DenyCompute', {
          budget,
          threshold: 80,
          users: [iam.User.fromUserName(s, 'Analyst', 'lab-analyst')],
          groups: [iam.Group.fromGroupName(s, 'Students', 'lab-students')],
          subscribers: [{ email: ALERT_EMAIL }],
        });
      });
      const denyAction = action as BudgetDenyAction;

      Template.fromStack(stack).hasResourceProperties('AWS::Budgets::BudgetsAction', {
        Definition: Match.exact({
          IamActionDefinition: {
            PolicyArn: { Ref: denyPolicyId(stack, denyAction) },
            Users: ['lab-analyst'],
            Groups: ['lab-students'],
          },
        }),
      });
    });
  });

  describe('extra denied actions', () => {
    it('denies exactly the given list instead of the defaults', () => {
      const { stack } = buildDeny({ deniedActions: ['sagemaker:CreateEndpoint'] });

      Template.fromStack(stack).hasResourceProperties('AWS::IAM::ManagedPolicy', {
        PolicyDocument: Match.exact({
          Statement: [
            {
              Action: 'sagemaker:CreateEndpoint',
              Effect: 'Deny',
              Resource: '*',
            },
          ],
          Version: '2012-10-17',
        }),
      });
    });
  });

  describe('validation', () => {
    it('throws when no role, user or group is given', () => {
      expect(() => buildDeny({ roles: [] })).toThrow('BudgetDenyAction needs at least one role, user or group');
    });

    it('throws for a denied action that is not service:Action', () => {
      expect(() => buildDeny({ deniedActions: ['CreateEndpoint'] })).toThrow(
        'deniedActions entries must look like service:Action, got "CreateEndpoint"',
      );
    });
  });

  describe('synthesized template', () => {
    it('matches the snapshot and reports no cdk-nag errors', () => {
      const { stack } = buildDeny();

      expect(normalizedTemplate(stack)).toMatchSnapshot();
      expectNoNagErrors(stack);
    });
  });
});
