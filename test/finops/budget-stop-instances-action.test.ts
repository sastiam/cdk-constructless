import type { Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import type * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import { describe, expect, it } from 'vitest';
import { BudgetActionExecutionRole, StopInstancesTarget } from '../../src/finops/budget-action-execution-role';
import {
  BudgetActionThresholdType,
  BudgetStopInstancesAction,
  type BudgetStopInstancesActionProps,
} from '../../src/finops/budget-stop-instances-action';
import { CostBudget } from '../../src/finops/cost-budget';
import { expectNoNagErrors, normalizedTemplate, synth } from '../helpers';

const EC2_INSTANCE = 'i-0123456789abcdef0';
const ALERT_EMAIL = 'alerts@example.com';

interface Built {
  readonly stack: Stack;
  readonly budget: CostBudget;
  readonly action: BudgetStopInstancesAction;
}

/**
 * Builds a stack with a `CostBudget` and a `BudgetStopInstancesAction` that targets the budget.
 *
 * @param overrides the action props that replace the defaults of this helper
 * @param options the stack configuration passed to `synth`
 * @returns the stack, the budget and the action
 */
function buildAction(
  overrides: Partial<BudgetStopInstancesActionProps> = {},
  options?: { region?: string; envAgnostic?: boolean },
): Built {
  let budget: CostBudget | undefined;
  let action: BudgetStopInstancesAction | undefined;
  const stack = synth((s) => {
    budget = new CostBudget(s, 'Budget', { limitUsd: 5, emails: [ALERT_EMAIL] });
    action = new BudgetStopInstancesAction(s, 'StopInstances', {
      budget,
      target: StopInstancesTarget.EC2,
      instanceIds: [EC2_INSTANCE],
      threshold: 80,
      subscribers: [{ email: ALERT_EMAIL }],
      ...overrides,
    });
  }, options);
  return { stack, budget: budget as CostBudget, action: action as BudgetStopInstancesAction };
}

function budgetsActions(stack: Stack): Array<{ DependsOn?: string[]; Properties: Record<string, unknown> }> {
  return Object.values(Template.fromStack(stack).findResources('AWS::Budgets::BudgetsAction')) as Array<{
    DependsOn?: string[];
    Properties: Record<string, unknown>;
  }>;
}

describe('BudgetStopInstancesAction', () => {
  describe('EC2 stop action', () => {
    it('creates one RUN_SSM_DOCUMENTS action with the EC2 stop subtype, 80 percent threshold and AUTOMATIC approval', () => {
      const { stack, budget, action } = buildAction();

      Template.fromStack(stack).resourceCountIs('AWS::Budgets::BudgetsAction', 1);
      Template.fromStack(stack).hasResourceProperties(
        'AWS::Budgets::BudgetsAction',
        Match.exact({
          BudgetName: budget.budgetName,
          ActionType: 'RUN_SSM_DOCUMENTS',
          ActionThreshold: { Type: 'PERCENTAGE', Value: 80 },
          Definition: {
            SsmActionDefinition: {
              Subtype: 'STOP_EC2_INSTANCES',
              Region: 'us-east-1',
              InstanceIds: [EC2_INSTANCE],
            },
          },
          ExecutionRoleArn: { 'Fn::GetAtt': [stack.getLogicalId(actionRole(action)), 'Arn'] },
          NotificationType: 'ACTUAL',
          ApprovalModel: 'AUTOMATIC',
          Subscribers: [{ Type: 'EMAIL', Address: ALERT_EMAIL }],
        }),
      );
    });
  });

  describe('dependency on the budget', () => {
    it('makes the action DependsOn the budget resource and sets BudgetName to the budget name', () => {
      const { stack, budget } = buildAction();
      const [action] = budgetsActions(stack);

      expect(action.DependsOn).toContain(stack.getLogicalId(budget.budget));
      expect(action.Properties.BudgetName).toBe(budget.budgetName);
    });
  });

  describe('default execution role', () => {
    it('creates one role trusted by budgets.amazonaws.com and uses its ARN as ExecutionRoleArn', () => {
      const { stack, action } = buildAction();

      Template.fromStack(stack).resourceCountIs('AWS::IAM::Role', 1);
      Template.fromStack(stack).hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [Match.objectLike({ Principal: { Service: 'budgets.amazonaws.com' } })],
        },
      });
      const [budgetAction] = budgetsActions(stack);
      expect(budgetAction.Properties.ExecutionRoleArn).toEqual({
        'Fn::GetAtt': [stack.getLogicalId(actionRole(action)), 'Arn'],
      });
    });
  });

  describe('instance count limits', () => {
    it('throws for zero instance IDs', () => {
      expect(() => buildAction({ instanceIds: [] })).toThrow('instanceIds must contain between 1 and 100 items, got 0');
    });

    it('throws for 101 instance IDs', () => {
      const instanceIds = Array.from({ length: 101 }, () => EC2_INSTANCE);

      expect(() => buildAction({ instanceIds })).toThrow('instanceIds must contain between 1 and 100 items, got 101');
    });
  });

  describe('subscriber limits', () => {
    it('throws for zero subscribers', () => {
      expect(() => buildAction({ subscribers: [] })).toThrow('subscribers must contain between 1 and 11 items, got 0');
    });

    it('throws for 12 subscribers', () => {
      const subscribers = Array.from({ length: 12 }, () => ({ email: ALERT_EMAIL }));

      expect(() => buildAction({ subscribers })).toThrow('subscribers must contain between 1 and 11 items, got 12');
    });

    it('throws when a subscriber sets both email and topic', () => {
      expect(() =>
        synth((stack) => {
          const budget = new CostBudget(stack, 'Budget', { limitUsd: 5, emails: [ALERT_EMAIL] });
          new BudgetStopInstancesAction(stack, 'StopInstances', {
            budget,
            target: StopInstancesTarget.EC2,
            instanceIds: [EC2_INSTANCE],
            threshold: 80,
            subscribers: [{ email: ALERT_EMAIL, topic: new sns.Topic(stack, 'Topic') }],
          });
        }),
      ).toThrow('each subscriber needs exactly one of email or topic');
    });
  });

  describe('threshold limits', () => {
    it('throws for an ABSOLUTE_VALUE threshold of 0', () => {
      expect(() => buildAction({ thresholdType: BudgetActionThresholdType.ABSOLUTE_VALUE, threshold: 0 })).toThrow(
        'threshold must be greater than 0, got 0',
      );
    });
  });

  describe('RDS stop action', () => {
    it('produces the STOP_RDS_INSTANCES subtype for an RDS target', () => {
      const { stack } = buildAction({ target: StopInstancesTarget.RDS, instanceIds: ['db-instance-1'] });

      Template.fromStack(stack).hasResourceProperties('AWS::Budgets::BudgetsAction', {
        Definition: {
          SsmActionDefinition: {
            Subtype: 'STOP_RDS_INSTANCES',
            InstanceIds: ['db-instance-1'],
          },
        },
      });
    });
  });

  describe('region', () => {
    it('throws when the stack is environment-agnostic and no region is given', () => {
      expect(() => buildAction({}, { envAgnostic: true })).toThrow(
        'region must be set when the stack region is unresolved',
      );
    });

    it('uses the region prop as SSM region when the stack is environment-agnostic', () => {
      const { stack } = buildAction({ region: 'eu-west-1' }, { envAgnostic: true });

      Template.fromStack(stack).hasResourceProperties('AWS::Budgets::BudgetsAction', {
        Definition: {
          SsmActionDefinition: {
            Region: 'eu-west-1',
          },
        },
      });
    });
  });

  describe('passed execution role', () => {
    it('uses the passed role and creates no second AWS::IAM::Role', () => {
      let budget: CostBudget | undefined;
      let executionRole: BudgetActionExecutionRole | undefined;
      const stack = synth((s) => {
        budget = new CostBudget(s, 'Budget', { limitUsd: 5, emails: [ALERT_EMAIL] });
        executionRole = new BudgetActionExecutionRole(s, 'Role');
        new BudgetStopInstancesAction(s, 'StopInstances', {
          budget,
          target: StopInstancesTarget.EC2,
          instanceIds: [EC2_INSTANCE],
          threshold: 80,
          subscribers: [{ email: ALERT_EMAIL }],
          executionRole,
        });
      });
      const passedRole = executionRole as BudgetActionExecutionRole;

      Template.fromStack(stack).resourceCountIs('AWS::IAM::Role', 1);
      const [action] = budgetsActions(stack);
      expect(action.Properties.ExecutionRoleArn).toEqual({
        'Fn::GetAtt': [stack.getLogicalId(passedRole.role.node.defaultChild as iam.CfnRole), 'Arn'],
      });
    });
  });

  describe('EC2 default case', () => {
    it('matches the snapshot and reports no cdk-nag errors', () => {
      const { stack } = buildAction();

      expect(normalizedTemplate(stack)).toMatchSnapshot();
      expectNoNagErrors(stack);
    });
  });
});

/**
 * Returns the role that the action uses, so tests can look up its logical id.
 *
 * @param action the action whose execution role is returned
 * @returns the execution role's wrapped `AWS::IAM::Role` resource
 */
function actionRole(action: BudgetStopInstancesAction): iam.CfnRole {
  return action.executionRole.role.node.defaultChild as iam.CfnRole;
}
