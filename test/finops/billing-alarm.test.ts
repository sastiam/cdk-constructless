import type { Stack } from 'aws-cdk-lib';
import { Annotations, Match, Template } from 'aws-cdk-lib/assertions';
import { describe, expect, it } from 'vitest';
import { AlertsTopic } from '../../src/finops/alerts-topic';
import { BillingAlarm, type BillingAlarmProps } from '../../src/finops/billing-alarm';
import { expectNoNagErrors, normalizedTemplate, synth } from '../helpers';

function billingAlarmStack(
  props: Omit<BillingAlarmProps, 'topic'>,
  options?: { region?: string; envAgnostic?: boolean },
): Stack {
  return synth((stack) => {
    const alerts = new AlertsTopic(stack, 'AlertsTopic');
    new BillingAlarm(stack, 'BillingAlarm', { ...props, topic: alerts.topic });
  }, options);
}

function topicLogicalId(stack: Stack): string {
  const [topicId] = Object.keys(Template.fromStack(stack).findResources('AWS::SNS::Topic'));
  return topicId;
}

describe('BillingAlarm', () => {
  describe('alarm on estimated charges', () => {
    it('creates one alarm on the AWS/Billing EstimatedCharges metric with the default properties', () => {
      const stack = billingAlarmStack({ thresholdUsd: 5 });
      const topicId = topicLogicalId(stack);

      Template.fromStack(stack).resourceCountIs('AWS::CloudWatch::Alarm', 1);
      Template.fromStack(stack).hasResourceProperties('AWS::CloudWatch::Alarm', {
        Namespace: 'AWS/Billing',
        MetricName: 'EstimatedCharges',
        Dimensions: [{ Name: 'Currency', Value: 'USD' }],
        Statistic: 'Maximum',
        Period: 21600,
        EvaluationPeriods: 1,
        Threshold: 5,
        ComparisonOperator: 'GreaterThanThreshold',
        TreatMissingData: 'notBreaching',
        AlarmName: Match.absent(),
        AlarmActions: [{ Ref: topicId }],
      });
    });
  });

  describe('region', () => {
    it('throws when the stack region is not us-east-1', () => {
      expect(() => billingAlarmStack({ thresholdUsd: 5 }, { region: 'eu-west-1' })).toThrow(
        'BillingAlarm requires region us-east-1, got eu-west-1',
      );
    });

    it('creates the alarm and warns with cdk-constructless:unresolved-region when the stack is environment-agnostic', () => {
      const stack = billingAlarmStack({ thresholdUsd: 5 }, { envAgnostic: true });

      Template.fromStack(stack).resourceCountIs('AWS::CloudWatch::Alarm', 1);

      const warnings = Annotations.fromStack(stack).findWarning('*', Match.anyValue());
      expect(warnings).toHaveLength(1);
      expect(warnings[0].entry.data).toContain('cdk-constructless:unresolved-region');
    });
  });

  describe('linked account', () => {
    it('adds the LinkedAccount dimension when linkedAccountId is a 12-digit account ID', () => {
      const stack = billingAlarmStack({ thresholdUsd: 5, linkedAccountId: '123456789012' });

      Template.fromStack(stack).hasResourceProperties('AWS::CloudWatch::Alarm', {
        Dimensions: [
          { Name: 'Currency', Value: 'USD' },
          { Name: 'LinkedAccount', Value: '123456789012' },
        ],
      });
    });

    it('throws for a linkedAccountId that is not 12 digits', () => {
      expect(() => billingAlarmStack({ thresholdUsd: 5, linkedAccountId: '12345' })).toThrow(
        'linkedAccountId must be a 12-digit account ID, got "12345"',
      );
    });
  });

  describe('validation', () => {
    it('throws for a thresholdUsd of 0', () => {
      expect(() => billingAlarmStack({ thresholdUsd: 0 })).toThrow('thresholdUsd must be greater than 0, got 0');
    });
  });

  describe('default stack', () => {
    it('matches the snapshot and reports no cdk-nag errors', () => {
      const stack = billingAlarmStack({ thresholdUsd: 5 });

      expect(normalizedTemplate(stack)).toMatchSnapshot();
      expectNoNagErrors(stack);
    });
  });
});
