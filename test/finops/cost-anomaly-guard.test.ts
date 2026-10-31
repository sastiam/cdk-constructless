import type { Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { describe, expect, it } from 'vitest';
import { AlertsTopic } from '../../src/finops/alerts-topic';
import { AnomalyFrequency, CostAnomalyGuard, type CostAnomalyGuardProps } from '../../src/finops/cost-anomaly-guard';
import { expectNoNagErrors, normalizedTemplate, synth } from '../helpers';

const EXISTING_MONITOR_ARN = 'arn:aws:ce::123456789012:anomalymonitor/abc';

/**
 * Builds a stack with one CostAnomalyGuard. `props` runs inside the stack, so it may create an SNS topic.
 */
function guardStack(props: (stack: Stack) => CostAnomalyGuardProps): { stack: Stack; guard: CostAnomalyGuard } {
  const guards: CostAnomalyGuard[] = [];
  const stack = synth((root) => {
    guards.push(new CostAnomalyGuard(root, 'Guard', props(root)));
  });
  return { stack, guard: guards[0] };
}

function topicProps(stack: Stack, extra?: Omit<CostAnomalyGuardProps, 'topic'>): CostAnomalyGuardProps {
  const alerts = new AlertsTopic(stack, 'Alerts', { allowCostAnomalyDetection: true });
  return { ...extra, topic: alerts.topic };
}

function logicalIds(stack: Stack, type: string): string[] {
  return Object.keys(Template.fromStack(stack).findResources(type));
}

/**
 * Returns the properties of the only resource of `type`, after asserting that exactly one exists.
 */
function onlyResourceProperties(stack: Stack, type: string): Record<string, unknown> {
  const resources = Object.values(Template.fromStack(stack).findResources(type));
  expect(resources).toHaveLength(1);
  return resources[0].Properties as Record<string, unknown>;
}

describe('CostAnomalyGuard', () => {
  describe('services monitor with e-mail', () => {
    it('creates one DIMENSIONAL SERVICE monitor without a linked-account specification', () => {
      const { stack } = guardStack(() => ({ emails: ['alerts@example.com'] }));

      Template.fromStack(stack).resourceCountIs('AWS::CE::AnomalyMonitor', 1);
      Template.fromStack(stack).hasResourceProperties('AWS::CE::AnomalyMonitor', {
        MonitorName: Match.anyValue(),
        MonitorType: 'DIMENSIONAL',
        MonitorDimension: 'SERVICE',
        MonitorSpecification: Match.absent(),
      });
    });

    it('creates a DAILY subscription with one EMAIL subscriber and no Threshold', () => {
      const { stack } = guardStack(() => ({ emails: ['alerts@example.com'] }));
      const [monitorId] = logicalIds(stack, 'AWS::CE::AnomalyMonitor');

      Template.fromStack(stack).resourceCountIs('AWS::CE::AnomalySubscription', 1);
      Template.fromStack(stack).hasResourceProperties('AWS::CE::AnomalySubscription', {
        SubscriptionName: Match.anyValue(),
        MonitorArnList: [{ 'Fn::GetAtt': [monitorId, 'MonitorArn'] }],
        Frequency: 'DAILY',
        Subscribers: [{ Type: 'EMAIL', Address: 'alerts@example.com' }],
        Threshold: Match.absent(),
      });
    });

    it('writes the default threshold of 1 USD into ThresholdExpression', () => {
      const { stack } = guardStack(() => ({ emails: ['alerts@example.com'] }));
      const subscription = onlyResourceProperties(stack, 'AWS::CE::AnomalySubscription');

      expect(JSON.parse(String(subscription.ThresholdExpression))).toEqual({
        Dimensions: {
          Key: 'ANOMALY_TOTAL_IMPACT_ABSOLUTE',
          MatchOptions: ['GREATER_THAN_OR_EQUAL'],
          Values: ['1'],
        },
      });
    });

    it('uses WEEKLY frequency when asked for it', () => {
      const { stack } = guardStack(() => ({
        emails: ['alerts@example.com'],
        frequency: AnomalyFrequency.WEEKLY,
      }));

      Template.fromStack(stack).hasResourceProperties('AWS::CE::AnomalySubscription', {
        Frequency: 'WEEKLY',
        Subscribers: [{ Type: 'EMAIL', Address: 'alerts@example.com' }],
      });
    });

    it('writes thresholdUsd into ThresholdExpression', () => {
      const { stack } = guardStack(() => ({ emails: ['alerts@example.com'], thresholdUsd: 250 }));
      const subscription = onlyResourceProperties(stack, 'AWS::CE::AnomalySubscription');

      expect(JSON.parse(String(subscription.ThresholdExpression))).toEqual({
        Dimensions: {
          Key: 'ANOMALY_TOTAL_IMPACT_ABSOLUTE',
          MatchOptions: ['GREATER_THAN_OR_EQUAL'],
          Values: ['250'],
        },
      });
    });

    it('uses the monitorName and subscriptionName props when they are given', () => {
      const { stack } = guardStack(() => ({
        emails: ['alerts@example.com'],
        monitorName: 'cost-services',
        subscriptionName: 'cost-alerts',
      }));

      Template.fromStack(stack).hasResourceProperties('AWS::CE::AnomalyMonitor', {
        MonitorName: 'cost-services',
      });
      Template.fromStack(stack).hasResourceProperties('AWS::CE::AnomalySubscription', {
        SubscriptionName: 'cost-alerts',
      });
    });
  });

  describe('linked accounts monitor', () => {
    it('creates a CUSTOM monitor with no MonitorDimension and a LINKED_ACCOUNT specification', () => {
      const { stack } = guardStack(() => ({
        emails: ['alerts@example.com'],
        monitor: { kind: 'linkedAccounts', accountIds: ['123456789012'] },
      }));
      const monitor = onlyResourceProperties(stack, 'AWS::CE::AnomalyMonitor');

      Template.fromStack(stack).hasResourceProperties('AWS::CE::AnomalyMonitor', {
        MonitorType: 'CUSTOM',
        MonitorDimension: Match.absent(),
      });
      expect(JSON.parse(String(monitor.MonitorSpecification))).toEqual({
        Dimensions: { Key: 'LINKED_ACCOUNT', Values: ['123456789012'] },
      });
    });
  });

  describe('existing monitor', () => {
    it('creates no anomaly monitor and subscribes to the given monitor ARN', () => {
      const { stack, guard } = guardStack(() => ({
        emails: ['alerts@example.com'],
        monitor: { kind: 'existing', monitorArn: EXISTING_MONITOR_ARN },
      }));

      Template.fromStack(stack).resourceCountIs('AWS::CE::AnomalyMonitor', 0);
      Template.fromStack(stack).hasResourceProperties('AWS::CE::AnomalySubscription', {
        MonitorArnList: [EXISTING_MONITOR_ARN],
      });
      expect(guard.monitor).toBeUndefined();
      expect(guard.monitorArn).toBe(EXISTING_MONITOR_ARN);
    });
  });

  describe('SNS topic', () => {
    it('subscribes the topic with IMMEDIATE frequency and one SNS subscriber', () => {
      const { stack } = guardStack((root) => topicProps(root));
      const [topicId] = logicalIds(stack, 'AWS::SNS::Topic');
      const [monitorId] = logicalIds(stack, 'AWS::CE::AnomalyMonitor');

      Template.fromStack(stack).resourceCountIs('AWS::CE::AnomalySubscription', 1);
      Template.fromStack(stack).hasResourceProperties('AWS::CE::AnomalySubscription', {
        MonitorArnList: [{ 'Fn::GetAtt': [monitorId, 'MonitorArn'] }],
        Frequency: 'IMMEDIATE',
        Subscribers: [{ Type: 'SNS', Address: { Ref: topicId } }],
        Threshold: Match.absent(),
      });
    });

    it('allows Cost Anomaly Detection to publish to the topic when the topic is created with allowCostAnomalyDetection', () => {
      const { stack } = guardStack((root) => topicProps(root));
      const [topicId] = logicalIds(stack, 'AWS::SNS::Topic');

      Template.fromStack(stack).hasResourceProperties('AWS::SNS::TopicPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Sid: 'AWSAnomalyDetectionSNSPublishingPermissions',
              Action: 'SNS:Publish',
              Effect: 'Allow',
              Principal: { Service: 'costalerts.amazonaws.com' },
              Resource: { Ref: topicId },
            },
          ]),
        },
      });
    });
  });

  describe('validation', () => {
    it('throws when both emails and a topic are given', () => {
      expect(() => guardStack((root) => topicProps(root, { emails: ['alerts@example.com'] }))).toThrow(
        'provide emails or a topic, not both',
      );
    });

    it('throws when neither emails nor a topic is given', () => {
      expect(() => guardStack(() => ({}))).toThrow('provide emails or a topic, not both');
    });

    it('throws when emails is an empty array and no topic is given', () => {
      expect(() => guardStack(() => ({ emails: [] }))).toThrow('provide emails or a topic, not both');
    });

    it('throws for eleven e-mail addresses', () => {
      const emails = Array.from({ length: 11 }, (_, index) => `alerts${index}@example.com`);

      expect(() => guardStack(() => ({ emails }))).toThrow('emails must contain between 1 and 10 items, got 11');
    });

    it('throws for an e-mail address without @', () => {
      expect(() => guardStack(() => ({ emails: ['alerts.example.com'] }))).toThrow(
        'emails contains an invalid email "alerts.example.com"',
      );
    });

    it('throws when e-mail subscribers use IMMEDIATE frequency', () => {
      expect(() =>
        guardStack(() => ({ emails: ['alerts@example.com'], frequency: AnomalyFrequency.IMMEDIATE })),
      ).toThrow('email subscribers require DAILY or WEEKLY frequency');
    });

    it('throws when an SNS topic uses DAILY frequency', () => {
      expect(() => guardStack((root) => topicProps(root, { frequency: AnomalyFrequency.DAILY }))).toThrow(
        'SNS subscribers require IMMEDIATE frequency',
      );
    });

    it('throws when thresholdUsd is 0', () => {
      expect(() => guardStack(() => ({ emails: ['alerts@example.com'], thresholdUsd: 0 }))).toThrow(
        'thresholdUsd must be greater than 0, got 0',
      );
    });

    it('throws when linkedAccounts has no account IDs', () => {
      expect(() =>
        guardStack(() => ({
          emails: ['alerts@example.com'],
          monitor: { kind: 'linkedAccounts', accountIds: [] },
        })),
      ).toThrow('monitor.accountIds must contain between 1 and 10 items, got 0');
    });

    it('throws when linkedAccounts has eleven account IDs', () => {
      const accountIds = Array.from({ length: 11 }, () => '123456789012');

      expect(() =>
        guardStack(() => ({
          emails: ['alerts@example.com'],
          monitor: { kind: 'linkedAccounts', accountIds },
        })),
      ).toThrow('monitor.accountIds must contain between 1 and 10 items, got 11');
    });

    it('throws when a linkedAccounts ID is not 12 digits', () => {
      expect(() =>
        guardStack(() => ({
          emails: ['alerts@example.com'],
          monitor: { kind: 'linkedAccounts', accountIds: ['12345'] },
        })),
      ).toThrow('monitor.accountIds must be 12-digit account IDs, got "12345"');
    });
  });

  describe('default stack', () => {
    it('matches the snapshot and reports no cdk-nag errors', () => {
      const { stack } = guardStack(() => ({ emails: ['alerts@example.com'] }));

      expect(normalizedTemplate(stack)).toMatchSnapshot();
      expectNoNagErrors(stack);
    });
  });
});
