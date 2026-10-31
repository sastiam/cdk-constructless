import type { Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as iam from 'aws-cdk-lib/aws-iam';
import type * as sns from 'aws-cdk-lib/aws-sns';
import { describe, expect, it } from 'vitest';
import { StopInstancesTarget } from '../../src/finops/budget-action-execution-role';
import { FinOpsGuardrail, type FinOpsGuardrailProps } from '../../src/finops/finops-guardrail';
import { expectNoNagErrors, normalizedTemplate, synth } from '../helpers';

const ALERT_EMAIL = 'alerts@example.com';
const FINOPS_EMAIL = 'finops@example.com';
const EC2_INSTANCE = 'i-0123456789abcdef0';

interface Built {
  readonly stack: Stack;
  readonly guardrail: FinOpsGuardrail;
}

/**
 * Builds a stack with one `FinOpsGuardrail` that uses `limitUsd: 5` and `emails: [ALERT_EMAIL]` unless the overrides replace them.
 *
 * @param overrides returns the props that are merged over the defaults, and receives the stack so that roles can be looked up
 * @returns the stack and the guardrail
 */
function buildGuardrail(overrides: (stack: Stack) => Partial<FinOpsGuardrailProps> = () => ({})): Built {
  let guardrail: FinOpsGuardrail | undefined;
  const stack = synth((s) => {
    guardrail = new FinOpsGuardrail(s, 'Guardrail', {
      limitUsd: 5,
      emails: [ALERT_EMAIL],
      ...overrides(s),
    });
  });
  return { stack, guardrail: guardrail as FinOpsGuardrail };
}

/**
 * Returns the logical id of the alerts topic, which the budget and the billing alarm refer to with `Ref`.
 *
 * @param stack the stack that contains the guardrail
 * @param guardrail the guardrail whose topic is looked up
 * @returns the logical id of the `AWS::SNS::Topic`
 */
function topicId(stack: Stack, guardrail: FinOpsGuardrail): string {
  return stack.getLogicalId(guardrail.alerts.topic.node.defaultChild as sns.CfnTopic);
}

/**
 * Returns every `AWS::Budgets::BudgetsAction` of a stack with its properties.
 *
 * @param stack the stack to read
 * @returns the budget action resources
 */
function budgetsActions(stack: Stack): Array<{ Properties: Record<string, unknown> }> {
  return Object.values(Template.fromStack(stack).findResources('AWS::Budgets::BudgetsAction')) as Array<{
    Properties: Record<string, unknown>;
  }>;
}

describe('FinOpsGuardrail', () => {
  describe('minimal guardrail', () => {
    it('creates exactly one topic and one budget, and no billing alarm or budget action', () => {
      const { stack } = buildGuardrail();

      Template.fromStack(stack).resourceCountIs('AWS::SNS::Topic', 1);
      Template.fromStack(stack).resourceCountIs('AWS::Budgets::Budget', 1);
      Template.fromStack(stack).resourceCountIs('AWS::CloudWatch::Alarm', 0);
      Template.fromStack(stack).resourceCountIs('AWS::Budgets::BudgetsAction', 0);
    });

    it('notifies the alerts topic from every default threshold as its only SNS subscriber', () => {
      const { stack, guardrail } = buildGuardrail();
      const topic = { Ref: topicId(stack, guardrail) };
      const snsSubscriber = [{ SubscriptionType: 'SNS', Address: topic }];

      Template.fromStack(stack).hasResourceProperties('AWS::Budgets::Budget', {
        Budget: Match.objectLike({
          BudgetLimit: { Amount: 5, Unit: 'USD' },
          BudgetType: 'COST',
          TimeUnit: 'MONTHLY',
        }),
        NotificationsWithSubscribers: [
          {
            Notification: {
              ComparisonOperator: 'GREATER_THAN',
              NotificationType: 'ACTUAL',
              Threshold: 60,
              ThresholdType: 'PERCENTAGE',
            },
            Subscribers: snsSubscriber,
          },
          {
            Notification: {
              ComparisonOperator: 'GREATER_THAN',
              NotificationType: 'ACTUAL',
              Threshold: 80,
              ThresholdType: 'PERCENTAGE',
            },
            Subscribers: snsSubscriber,
          },
          {
            Notification: {
              ComparisonOperator: 'GREATER_THAN',
              NotificationType: 'ACTUAL',
              Threshold: 100,
              ThresholdType: 'PERCENTAGE',
            },
            Subscribers: snsSubscriber,
          },
          {
            Notification: {
              ComparisonOperator: 'GREATER_THAN',
              NotificationType: 'FORECASTED',
              Threshold: 100,
              ThresholdType: 'PERCENTAGE',
            },
            Subscribers: snsSubscriber,
          },
        ],
      });
    });

    it('subscribes the e-mail address to the alerts topic', () => {
      const { stack, guardrail } = buildGuardrail();

      Template.fromStack(stack).resourceCountIs('AWS::SNS::Subscription', 1);
      Template.fromStack(stack).hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: ALERT_EMAIL,
        TopicArn: { Ref: topicId(stack, guardrail) },
      });
    });
  });

  describe('billing alarm', () => {
    it('creates one alarm that enters ALARM above 4 USD and notifies the alerts topic', () => {
      const { stack, guardrail } = buildGuardrail(() => ({ billingAlarmThresholdUsd: 4 }));

      Template.fromStack(stack).resourceCountIs('AWS::CloudWatch::Alarm', 1);
      Template.fromStack(stack).hasResourceProperties(
        'AWS::CloudWatch::Alarm',
        Match.exact({
          AlarmActions: [{ Ref: topicId(stack, guardrail) }],
          ComparisonOperator: 'GreaterThanThreshold',
          Dimensions: [{ Name: 'Currency', Value: 'USD' }],
          EvaluationPeriods: 1,
          MetricName: 'EstimatedCharges',
          Namespace: 'AWS/Billing',
          Period: 21600,
          Statistic: 'Maximum',
          Threshold: 4,
          TreatMissingData: 'notBreaching',
        }),
      );
      expect(guardrail.billingAlarm).toBeDefined();
    });
  });

  describe('actions never use the alerts topic', () => {
    it('gives both budget actions only EMAIL subscribers from emails and never the alerts topic', () => {
      const { stack, guardrail } = buildGuardrail((s) => ({
        emails: [ALERT_EMAIL, FINOPS_EMAIL],
        stopInstances: { target: StopInstancesTarget.EC2, instanceIds: [EC2_INSTANCE], threshold: 80 },
        denyCompute: { roles: [labRole(s)], threshold: 100 },
      }));
      const emailSubscribers = [
        { Type: 'EMAIL', Address: ALERT_EMAIL },
        { Type: 'EMAIL', Address: FINOPS_EMAIL },
      ];

      Template.fromStack(stack).resourceCountIs('AWS::Budgets::BudgetsAction', 2);
      Template.fromStack(stack).hasResourceProperties('AWS::Budgets::BudgetsAction', {
        ActionType: 'RUN_SSM_DOCUMENTS',
        Subscribers: emailSubscribers,
      });
      Template.fromStack(stack).hasResourceProperties('AWS::Budgets::BudgetsAction', {
        ActionType: 'APPLY_IAM_POLICY',
        Subscribers: emailSubscribers,
      });
      const topic = { Ref: topicId(stack, guardrail) };
      for (const action of budgetsActions(stack)) {
        const subscribers = action.Properties.Subscribers as Array<{ Address: unknown }>;
        expect(subscribers.map((subscriber) => subscriber.Address)).not.toContainEqual(topic);
      }
    });
  });

  describe('shared execution role', () => {
    it('creates one AWS::IAM::Role trusted by budgets.amazonaws.com that both budget actions use', () => {
      const { stack, guardrail } = buildGuardrail((s) => ({
        stopInstances: { target: StopInstancesTarget.EC2, instanceIds: [EC2_INSTANCE], threshold: 80 },
        denyCompute: { roles: [labRole(s)], threshold: 100 },
      }));
      const roleId = stack.getLogicalId(guardrail.stopAction?.executionRole.role.node.defaultChild as iam.CfnRole);

      expect(guardrail.denyAction?.executionRole).toBe(guardrail.stopAction?.executionRole);
      Template.fromStack(stack).resourceCountIs('AWS::IAM::Role', 1);
      Template.fromStack(stack).hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [Match.objectLike({ Principal: { Service: 'budgets.amazonaws.com' } })],
        },
      });
      for (const action of budgetsActions(stack)) {
        expect(action.Properties.ExecutionRoleArn).toEqual({ 'Fn::GetAtt': [roleId, 'Arn'] });
      }
    });
  });

  describe('full guardrail', () => {
    it('creates one topic, one budget, one alarm, two budget actions and one shared role', () => {
      const { stack } = fullGuardrail();

      Template.fromStack(stack).resourceCountIs('AWS::SNS::Topic', 1);
      Template.fromStack(stack).resourceCountIs('AWS::Budgets::Budget', 1);
      Template.fromStack(stack).resourceCountIs('AWS::CloudWatch::Alarm', 1);
      Template.fromStack(stack).resourceCountIs('AWS::Budgets::BudgetsAction', 2);
      Template.fromStack(stack).resourceCountIs('AWS::IAM::Role', 1);
    });

    it('matches the snapshot and reports no cdk-nag errors', () => {
      const { stack } = fullGuardrail();

      expect(normalizedTemplate(stack)).toMatchSnapshot();
      expectNoNagErrors(stack);
    });
  });
});

/**
 * Builds the full guardrail: a billing alarm at 4 USD, a stop action for one EC2 instance at 80 percent and a deny action at 100 percent,
 * with two e-mail subscribers.
 *
 * @returns the stack and the guardrail
 */
function fullGuardrail(): Built {
  return buildGuardrail((s) => ({
    emails: [ALERT_EMAIL, FINOPS_EMAIL],
    billingAlarmThresholdUsd: 4,
    stopInstances: { target: StopInstancesTarget.EC2, instanceIds: [EC2_INSTANCE], threshold: 80 },
    denyCompute: { roles: [labRole(s)], threshold: 100 },
  }));
}

/**
 * Imports the existing role `LabRole` that the deny action attaches its policy to, so the tests do not create a role for it.
 *
 * @param stack the stack that imports the role
 * @returns the imported role
 */
function labRole(stack: Stack): iam.IRole {
  return iam.Role.fromRoleName(stack, 'Lab', 'LabRole');
}
