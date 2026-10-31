import type { Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as kms from 'aws-cdk-lib/aws-kms';
import { describe, expect, it } from 'vitest';
import { AlertsTopic, type AlertsTopicProps } from '../../src/finops/alerts-topic';
import { expectNoNagErrors, normalizedTemplate, synth } from '../helpers';

function topicStack(props?: AlertsTopicProps): Stack {
  return synth((stack) => {
    new AlertsTopic(stack, 'AlertsTopic', props);
  });
}

function topicLogicalId(stack: Stack): string {
  const [topicId] = Object.keys(Template.fromStack(stack).findResources('AWS::SNS::Topic'));
  return topicId;
}

function tlsDenyStatement(topicId: string): Record<string, unknown> {
  return {
    Sid: 'AllowPublishThroughSSLOnly',
    Action: 'sns:Publish',
    Condition: { Bool: { 'aws:SecureTransport': 'false' } },
    Effect: 'Deny',
    Principal: '*',
    Resource: { Ref: topicId },
  };
}

function budgetsStatement(topicId: string): Record<string, unknown> {
  return {
    Sid: 'AWSBudgetsSNSPublishingPermissions',
    Action: 'SNS:Publish',
    Condition: {
      ArnLike: {
        'aws:SourceArn': {
          'Fn::Join': ['', ['arn:', Match.anyValue(), ':budgets::123456789012:*']],
        },
      },
      StringEquals: { 'aws:SourceAccount': '123456789012' },
    },
    Effect: 'Allow',
    Principal: { Service: 'budgets.amazonaws.com' },
    Resource: { Ref: topicId },
  };
}

function costAnomalyStatement(topicId: string): Record<string, unknown> {
  return {
    Sid: 'AWSAnomalyDetectionSNSPublishingPermissions',
    Action: 'SNS:Publish',
    Effect: 'Allow',
    Principal: { Service: 'costalerts.amazonaws.com' },
    Resource: { Ref: topicId },
  };
}

describe('AlertsTopic', () => {
  describe('topic policy', () => {
    it('allows Budgets to publish, restricted to the account, and denies non-TLS access by default', () => {
      const stack = topicStack();
      const topicId = topicLogicalId(stack);

      Template.fromStack(stack).resourceCountIs('AWS::SNS::TopicPolicy', 1);
      Template.fromStack(stack).hasResourceProperties('AWS::SNS::TopicPolicy', {
        PolicyDocument: {
          Statement: [tlsDenyStatement(topicId), budgetsStatement(topicId)],
        },
        Topics: [{ Ref: topicId }],
      });
    });

    it('creates no Budgets statement when allowBudgets is false, and keeps the TLS deny statement', () => {
      const stack = topicStack({ allowBudgets: false });
      const topicId = topicLogicalId(stack);

      Template.fromStack(stack).hasResourceProperties('AWS::SNS::TopicPolicy', {
        PolicyDocument: {
          Statement: [tlsDenyStatement(topicId)],
        },
      });
    });

    it('allows Cost Anomaly Detection to publish when allowCostAnomalyDetection is true', () => {
      const stack = topicStack({ allowCostAnomalyDetection: true });
      const topicId = topicLogicalId(stack);

      Template.fromStack(stack).hasResourceProperties('AWS::SNS::TopicPolicy', {
        PolicyDocument: {
          Statement: [tlsDenyStatement(topicId), budgetsStatement(topicId), costAnomalyStatement(topicId)],
        },
      });
    });

    it('creates no Cost Anomaly Detection statement by default', () => {
      const stack = topicStack();
      const topicId = topicLogicalId(stack);

      Template.fromStack(stack).hasResourceProperties('AWS::SNS::TopicPolicy', {
        PolicyDocument: {
          Statement: [tlsDenyStatement(topicId), budgetsStatement(topicId)],
        },
      });
    });
  });

  describe('e-mail subscriptions', () => {
    it('creates one email subscription for each address', () => {
      const stack = topicStack({ emails: ['alerts@example.com'] });
      const topicId = topicLogicalId(stack);

      Template.fromStack(stack).resourceCountIs('AWS::SNS::Subscription', 1);
      Template.fromStack(stack).hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'alerts@example.com',
        TopicArn: { Ref: topicId },
      });
    });

    it('creates no subscription when emails is absent', () => {
      const stack = topicStack();

      Template.fromStack(stack).resourceCountIs('AWS::SNS::Subscription', 0);
    });

    it('throws for an e-mail address without @', () => {
      expect(() => topicStack({ emails: ['alerts.example.com'] })).toThrow(
        'emails contains an invalid email "alerts.example.com"',
      );
    });

    it('throws for eleven e-mail addresses', () => {
      const emails = Array.from({ length: 11 }, (_, index) => `alerts${index}@example.com`);

      expect(() => topicStack({ emails })).toThrow('emails must contain between 0 and 10 items, got 11');
    });
  });

  describe('customer managed key', () => {
    it('grants Budgets the KMS publish permissions on the key and encrypts the topic with it', () => {
      // The customer managed key is created here only to test the grant; cdk-nag reports KMS5 (rotation) on it,
      // and that finding belongs to the consumer that owns the key, so nag is not registered for this stack.
      const stack = synth(
        (root) => {
          const key = new kms.Key(root, 'Key');
          new AlertsTopic(root, 'AlertsTopic', { masterKey: key });
        },
        { nag: false },
      );
      const [keyId] = Object.keys(Template.fromStack(stack).findResources('AWS::KMS::Key'));
      const topicId = topicLogicalId(stack);

      Template.fromStack(stack).hasResourceProperties('AWS::KMS::Key', {
        KeyPolicy: {
          Statement: Match.arrayWith([
            {
              Action: ['kms:GenerateDataKey*', 'kms:Decrypt'],
              Effect: 'Allow',
              Principal: { Service: 'budgets.amazonaws.com' },
              Resource: '*',
            },
          ]),
        },
      });
      Template.fromStack(stack).hasResourceProperties('AWS::SNS::Topic', {
        KmsMasterKeyId: { 'Fn::GetAtt': [keyId, 'Arn'] },
      });
      Template.fromStack(stack).hasResourceProperties('AWS::SNS::TopicPolicy', {
        PolicyDocument: {
          Statement: [tlsDenyStatement(topicId), budgetsStatement(topicId)],
        },
      });
    });
  });

  describe('default stack', () => {
    it('matches the snapshot and reports no cdk-nag errors', () => {
      const stack = topicStack();

      expect(normalizedTemplate(stack)).toMatchSnapshot();
      expectNoNagErrors(stack);
    });
  });
});
