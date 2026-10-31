import type { Stack } from 'aws-cdk-lib';
import { Annotations, Match, Template } from 'aws-cdk-lib/assertions';
import * as sns from 'aws-cdk-lib/aws-sns';
import { describe, expect, it } from 'vitest';
import { BudgetNotificationType, CostBudget, type CostBudgetProps } from '../../src/finops/cost-budget';
import { expectNoNagErrors, normalizedTemplate, synth } from '../helpers';

function budgetStack(props: CostBudgetProps): Stack {
  return synth((stack) => {
    new CostBudget(stack, 'CostBudget', props);
  });
}

function budgetProperties(stack: Stack): Record<string, unknown> {
  const resources = Template.fromStack(stack).findResources('AWS::Budgets::Budget');
  const [budget] = Object.values(resources) as Array<{ Properties: Record<string, unknown> }>;
  return budget.Properties;
}

describe('CostBudget', () => {
  describe('monthly cost budget', () => {
    it('creates one COST budget with a MONTHLY limit in USD', () => {
      const stack = budgetStack({ limitUsd: 5, emails: ['alerts@example.com'] });

      Template.fromStack(stack).resourceCountIs('AWS::Budgets::Budget', 1);
      Template.fromStack(stack).hasResourceProperties('AWS::Budgets::Budget', {
        Budget: {
          BudgetType: 'COST',
          TimeUnit: 'MONTHLY',
          BudgetLimit: { Amount: 5, Unit: 'USD' },
        },
      });
    });

    it('throws for a limit of 0', () => {
      expect(() => budgetStack({ limitUsd: 0 })).toThrow('limitUsd must be greater than 0, got 0');
    });

    it('throws for a negative limit', () => {
      expect(() => budgetStack({ limitUsd: -1 })).toThrow('limitUsd must be greater than 0, got -1');
    });
  });

  describe('threshold notifications', () => {
    it('creates ACTUAL 60, ACTUAL 80, ACTUAL 100 and FORECASTED 100 notifications by default', () => {
      const stack = budgetStack({ limitUsd: 5, emails: ['alerts@example.com'] });

      Template.fromStack(stack).hasResourceProperties('AWS::Budgets::Budget', {
        NotificationsWithSubscribers: [
          {
            Notification: {
              ComparisonOperator: 'GREATER_THAN',
              NotificationType: 'ACTUAL',
              Threshold: 60,
              ThresholdType: 'PERCENTAGE',
            },
            Subscribers: [{ SubscriptionType: 'EMAIL', Address: 'alerts@example.com' }],
          },
          {
            Notification: {
              ComparisonOperator: 'GREATER_THAN',
              NotificationType: 'ACTUAL',
              Threshold: 80,
              ThresholdType: 'PERCENTAGE',
            },
            Subscribers: [{ SubscriptionType: 'EMAIL', Address: 'alerts@example.com' }],
          },
          {
            Notification: {
              ComparisonOperator: 'GREATER_THAN',
              NotificationType: 'ACTUAL',
              Threshold: 100,
              ThresholdType: 'PERCENTAGE',
            },
            Subscribers: [{ SubscriptionType: 'EMAIL', Address: 'alerts@example.com' }],
          },
          {
            Notification: {
              ComparisonOperator: 'GREATER_THAN',
              NotificationType: 'FORECASTED',
              Threshold: 100,
              ThresholdType: 'PERCENTAGE',
            },
            Subscribers: [{ SubscriptionType: 'EMAIL', Address: 'alerts@example.com' }],
          },
        ],
      });
    });

    it('creates only the given thresholds when thresholds is set', () => {
      const stack = budgetStack({
        limitUsd: 5,
        emails: ['alerts@example.com'],
        thresholds: [{ percent: 50, type: BudgetNotificationType.FORECASTED }],
      });

      Template.fromStack(stack).hasResourceProperties('AWS::Budgets::Budget', {
        NotificationsWithSubscribers: [
          {
            Notification: {
              ComparisonOperator: 'GREATER_THAN',
              NotificationType: 'FORECASTED',
              Threshold: 50,
              ThresholdType: 'PERCENTAGE',
            },
            Subscribers: [{ SubscriptionType: 'EMAIL', Address: 'alerts@example.com' }],
          },
        ],
      });
    });

    it('creates no NotificationsWithSubscribers and one warning when there are no subscribers', () => {
      const stack = budgetStack({ limitUsd: 5 });

      expect(budgetProperties(stack)).not.toHaveProperty('NotificationsWithSubscribers');
      Template.fromStack(stack).hasResourceProperties('AWS::Budgets::Budget', {
        NotificationsWithSubscribers: Match.absent(),
      });

      const warnings = Annotations.fromStack(stack).findWarning('*', Match.anyValue());
      expect(warnings).toHaveLength(1);
      expect(warnings[0].entry.data).toContain('cdk-constructless:budget-without-subscribers');
    });

    it('throws for six thresholds', () => {
      expect(() =>
        budgetStack({
          limitUsd: 5,
          emails: ['alerts@example.com'],
          thresholds: [
            { percent: 10 },
            { percent: 20 },
            { percent: 30 },
            { percent: 40 },
            { percent: 50 },
            { percent: 60 },
          ],
        }),
      ).toThrow('thresholds must contain between 1 and 5 items, got 6');
    });

    it('throws for a threshold percent below 0.01', () => {
      expect(() => budgetStack({ limitUsd: 5, emails: ['alerts@example.com'], thresholds: [{ percent: 0 }] })).toThrow(
        'thresholds[0].percent must be between 0.01 and 1000, got 0',
      );
    });

    it('throws for eleven e-mail addresses', () => {
      const emails = Array.from({ length: 11 }, (_, index) => `alerts${index}@example.com`);

      expect(() => budgetStack({ limitUsd: 5, emails })).toThrow('emails must contain between 0 and 10 items, got 11');
    });

    it('adds an SNS subscriber with the topic ARN to every notification', () => {
      let topic: sns.Topic | undefined;
      // The test topic does not enforce SSL publishing (AwsSolutions-SNS3); that choice belongs to the consumer, not to CostBudget.
      const stack = synth(
        (root) => {
          topic = new sns.Topic(root, 'AlertTopic');
          new CostBudget(root, 'CostBudget', { limitUsd: 5, topic });
        },
        { nag: false },
      );
      const topicLogicalId = stack.getLogicalId((topic as sns.Topic).node.defaultChild as sns.CfnTopic);
      const snsSubscriber = { SubscriptionType: 'SNS', Address: { Ref: topicLogicalId } };

      Template.fromStack(stack).hasResourceProperties('AWS::Budgets::Budget', {
        NotificationsWithSubscribers: [
          { Notification: { Threshold: 60, NotificationType: 'ACTUAL' }, Subscribers: [snsSubscriber] },
          { Notification: { Threshold: 80, NotificationType: 'ACTUAL' }, Subscribers: [snsSubscriber] },
          { Notification: { Threshold: 100, NotificationType: 'ACTUAL' }, Subscribers: [snsSubscriber] },
          { Notification: { Threshold: 100, NotificationType: 'FORECASTED' }, Subscribers: [snsSubscriber] },
        ],
      });
    });
  });

  describe('budget name', () => {
    it('uses the given budgetName', () => {
      const stack = budgetStack({ limitUsd: 5, budgetName: 'lab' });

      Template.fromStack(stack).hasResourceProperties('AWS::Budgets::Budget', {
        Budget: { BudgetName: 'lab' },
      });
    });
  });

  describe('linked account filter', () => {
    it('creates no CostFilters by default', () => {
      const stack = budgetStack({ limitUsd: 5, emails: ['alerts@example.com'] });

      Template.fromStack(stack).hasResourceProperties('AWS::Budgets::Budget', {
        Budget: Match.objectLike({ BudgetType: 'COST' }),
      });
      expect(budgetProperties(stack).Budget).not.toHaveProperty('CostFilters');
    });

    it('filters the budget to the given linked account', () => {
      const stack = budgetStack({ limitUsd: 5, linkedAccountIds: ['123456789012'] });

      Template.fromStack(stack).hasResourceProperties('AWS::Budgets::Budget', {
        Budget: {
          CostFilters: { LinkedAccount: ['123456789012'] },
        },
      });
    });

    it('throws for an account ID that is not 12 digits', () => {
      expect(() => budgetStack({ limitUsd: 5, linkedAccountIds: ['12345'] })).toThrow(
        'linkedAccountIds must be 12-digit account IDs, got "12345"',
      );
    });

    it('throws for an empty linkedAccountIds array', () => {
      expect(() => budgetStack({ limitUsd: 5, linkedAccountIds: [] })).toThrow(
        'linkedAccountIds must contain between 1 and 100 items, got 0',
      );
    });
  });

  describe('default stack', () => {
    it('matches the snapshot and reports no cdk-nag errors', () => {
      const stack = budgetStack({ limitUsd: 5, emails: ['alerts@example.com'] });

      expect(normalizedTemplate(stack)).toMatchSnapshot();
      expectNoNagErrors(stack);
    });
  });
});
