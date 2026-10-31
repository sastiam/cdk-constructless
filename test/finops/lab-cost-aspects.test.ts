import { Duration, type Stack } from 'aws-cdk-lib';
import { Annotations, Match, Template } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { describe, expect, it } from 'vitest';
import { LabCostAspects } from '../../src/finops/lab-cost-aspects';
import { normalizedTemplate, synth } from '../helpers';

// The fixtures deliberately keep a NAT gateway and buckets without access logs, which AwsSolutionsChecks reports.
// This file tests the lab cost aspects, so cdk-nag is not registered.
const NAG_DISABLED = { nag: false } as const;

/**
 * Returns the lifecycle rules of the only `AWS::S3::Bucket` of a stack.
 *
 * @param stack the stack that contains exactly one bucket
 * @returns the rules in the order they appear in the template
 */
function bucketRules(stack: Stack): unknown[] {
  const buckets = Object.values(Template.fromStack(stack).findResources('AWS::S3::Bucket'));
  expect(buckets).toHaveLength(1);
  return buckets[0].Properties.LifecycleConfiguration.Rules;
}

describe('LabCostAspects', () => {
  describe('bounded log retention', () => {
    it('sets RetentionInDays 3 on a log group created with infinite retention', () => {
      const stack = synth((s) => {
        LabCostAspects.applyTo(s);
        new logs.LogGroup(s, 'Forever', { retention: logs.RetentionDays.INFINITE });
      }, NAG_DISABLED);

      Template.fromStack(stack).hasResourceProperties('AWS::Logs::LogGroup', { RetentionInDays: 3 });
      expect(Annotations.fromStack(stack).findWarning('*', Match.anyValue())).toHaveLength(0);
    });

    it('keeps RetentionInDays 30 and warns with cdk-constructless:log-retention when the retention is longer', () => {
      const stack = synth((s) => {
        LabCostAspects.applyTo(s);
        new logs.LogGroup(s, 'Long', { retention: logs.RetentionDays.ONE_MONTH });
      }, NAG_DISABLED);

      Template.fromStack(stack).hasResourceProperties('AWS::Logs::LogGroup', { RetentionInDays: 30 });

      const warnings = Annotations.fromStack(stack).findWarning('*', Match.anyValue());
      expect(warnings).toHaveLength(1);
      expect(warnings[0].entry.data).toContain('cdk-constructless:log-retention');
      expect(warnings[0].entry.data).toContain('Log group keeps logs for 30 days; lab default is 3');
    });
  });

  describe('S3 cleanup rules', () => {
    it('adds only the abort rule to a plain bucket', () => {
      const stack = synth((s) => {
        LabCostAspects.applyTo(s);
        new s3.Bucket(s, 'Plain');
      }, NAG_DISABLED);

      Template.fromStack(stack).hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            {
              Id: 'LabAbortIncompleteMultipartUpload',
              Status: 'Enabled',
              AbortIncompleteMultipartUpload: { DaysAfterInitiation: 1 },
            },
          ]),
        },
      });
      expect(bucketRules(stack)).toEqual([
        {
          Id: 'LabAbortIncompleteMultipartUpload',
          Status: 'Enabled',
          AbortIncompleteMultipartUpload: { DaysAfterInitiation: 1 },
        },
      ]);
    });

    it('adds a NoncurrentVersionExpiration rule of 7 days to a versioned bucket and keeps the existing user rule', () => {
      const stack = synth((s) => {
        LabCostAspects.applyTo(s);
        new s3.Bucket(s, 'Versioned', {
          versioned: true,
          lifecycleRules: [{ id: 'UserExpire', expiration: Duration.days(30) }],
        });
      }, NAG_DISABLED);

      Template.fromStack(stack).hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: { Status: 'Enabled' },
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            { Id: 'UserExpire', Status: 'Enabled', ExpirationInDays: 30 },
            {
              Id: 'LabAbortIncompleteMultipartUpload',
              Status: 'Enabled',
              AbortIncompleteMultipartUpload: { DaysAfterInitiation: 1 },
            },
            {
              Id: 'LabNoncurrentVersionExpiration',
              Status: 'Enabled',
              NoncurrentVersionExpiration: { NoncurrentDays: 7 },
            },
          ]),
        },
      });
      expect(bucketRules(stack)).toEqual([
        { Id: 'UserExpire', Status: 'Enabled', ExpirationInDays: 30 },
        {
          Id: 'LabAbortIncompleteMultipartUpload',
          Status: 'Enabled',
          AbortIncompleteMultipartUpload: { DaysAfterInitiation: 1 },
        },
        {
          Id: 'LabNoncurrentVersionExpiration',
          Status: 'Enabled',
          NoncurrentVersionExpiration: { NoncurrentDays: 7 },
        },
      ]);
    });
  });

  describe('fixed-cost warnings', () => {
    it('warns with cdk-constructless:fixed-cost on a NAT gateway', () => {
      const stack = synth((s) => {
        LabCostAspects.applyTo(s);
        new ec2.CfnNatGateway(s, 'Nat', { subnetId: 'subnet-12345678', connectivityType: 'private' });
      }, NAG_DISABLED);

      const warnings = Annotations.fromStack(stack).findWarning('/TestStack/Nat', Match.anyValue());
      expect(warnings).toHaveLength(1);
      expect(warnings[0].entry.data).toContain('cdk-constructless:fixed-cost');
      expect(warnings[0].entry.data).toContain(
        'AWS::EC2::NatGateway has a fixed hourly or monthly price; remove it from lab stacks when idle',
      );
    });
  });

  it('matches the snapshot of a stack with every lab cost control', () => {
    const stack = synth((s) => {
      LabCostAspects.applyTo(s);
      new logs.LogGroup(s, 'Forever', { retention: logs.RetentionDays.INFINITE });
      new logs.LogGroup(s, 'Long', { retention: logs.RetentionDays.ONE_MONTH });
      new s3.Bucket(s, 'Plain');
      new s3.Bucket(s, 'Versioned', {
        versioned: true,
        lifecycleRules: [{ id: 'UserExpire', expiration: Duration.days(30) }],
      });
      new ec2.CfnNatGateway(s, 'Nat', { subnetId: 'subnet-12345678', connectivityType: 'private' });
    }, NAG_DISABLED);

    expect(normalizedTemplate(stack)).toMatchSnapshot();
  });
});
