import { Validations } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { describe, expect, it } from 'vitest';
import { suppressNag } from '../../src/core/nag';
import { expectNoNagErrors, synth } from '../helpers';

describe('suppressNag', () => {
  it('lets cdk-nag report a bucket without server access logs', () => {
    const stack = synth(() => {});
    new s3.Bucket(stack, 'Bucket', { enforceSSL: true });
    expect(() => Template.fromStack(stack)).toThrow('ERROR The S3 Bucket has server access logs disabled');
  });

  it('acknowledges the finding so that no cdk-nag errors remain', () => {
    const stack = synth(() => {});
    const bucket = new s3.Bucket(stack, 'Bucket', { enforceSSL: true });
    suppressNag(bucket, [{ id: 'AwsSolutions-S1', reason: 'Access logs are disabled in this test on purpose' }]);
    expectNoNagErrors(stack);
    expect(bucket.node.metadata).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: Validations.ACKNOWLEDGED_RULES_METADATA_KEY })]),
    );
  });

  it('throws when a reason is shorter than 20 characters and records nothing', () => {
    const stack = synth(() => {});
    const bucket = new s3.Bucket(stack, 'Bucket', { enforceSSL: true });
    const metadataBefore = bucket.node.metadata.length;
    expect(() => suppressNag(bucket, [{ id: 'AwsSolutions-S1', reason: 'too short' }])).toThrow(
      '[TestStack/Bucket] cdk-nag suppression AwsSolutions-S1 needs a reason of at least 20 characters',
    );
    expect(bucket.node.metadata).toHaveLength(metadataBefore);
  });
});
