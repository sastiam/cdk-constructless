import { App, RemovalPolicy } from 'aws-cdk-lib';
import { Annotations, Match, Template } from 'aws-cdk-lib/assertions';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { describe, expect, it } from 'vitest';
import { LabStack, type LabStackProps } from '../../src/finops/lab-stack';
import { normalizedTemplate } from '../helpers';

// The lab stack is built directly with `new LabStack`: the `synth` helper builds a plain Stack with a fixed id, not a LabStack.
// cdk-nag is not registered, so no policy validation plugin runs in this file.

/**
 * Builds a `LabStack` with the required props of the specification, plus the overrides.
 *
 * @param overrides the optional props to add or replace
 * @returns the lab stack, which is the only stack of a new app
 */
function labStack(overrides: Partial<LabStackProps> = {}): LabStack {
  return new LabStack(new App(), 'Lab', {
    env: { account: '123456789012', region: 'us-east-1' },
    project: 'demo',
    owner: 'alerts@example.com',
    ...overrides,
  });
}

describe('LabStack', () => {
  it('adds the Project, Env and Owner tags to every resource', () => {
    const stack = labStack();
    new sqs.Queue(stack, 'Queue');

    Template.fromStack(stack).hasResourceProperties('AWS::SQS::Queue', {
      // CloudFormation renders the tags sorted by key, and Match.arrayWith requires that order.
      Tags: Match.arrayWith([
        { Key: 'Env', Value: 'lab' },
        { Key: 'Owner', Value: 'alerts@example.com' },
        { Key: 'Project', Value: 'demo' },
      ]),
    });
  });

  it('sets DeletionPolicy Delete on a resource that is not retained', () => {
    const stack = labStack();
    new sqs.Queue(stack, 'Queue');

    Template.fromStack(stack).hasResource('AWS::SQS::Queue', { DeletionPolicy: 'Delete' });
  });

  it('leaves the removal policy of a resource listed in retainedConstructPaths unchanged', () => {
    const stack = labStack({ retainedConstructPaths: ['Lab/Queue'] });
    new sqs.Queue(stack, 'Queue', { removalPolicy: RemovalPolicy.RETAIN });

    Template.fromStack(stack).hasResource('AWS::SQS::Queue', { DeletionPolicy: 'Retain' });
  });

  it('reports cdk-constructless:lab-bucket-auto-delete on an s3.Bucket without autoDeleteObjects', () => {
    const stack = labStack();
    new s3.Bucket(stack, 'Bucket');

    Annotations.fromStack(stack).hasError(
      '/Lab/Bucket',
      Match.stringLikeRegexp(
        '^cdk-constructless:lab-bucket-auto-delete: set autoDeleteObjects: true on lab buckets; an aspect cannot add it after construction$',
      ),
    );
  });

  it('reports no error on an s3.Bucket with autoDeleteObjects and RemovalPolicy DESTROY', () => {
    const stack = labStack();
    new s3.Bucket(stack, 'Bucket', { autoDeleteObjects: true, removalPolicy: RemovalPolicy.DESTROY });

    expect(Annotations.fromStack(stack).findError('*', Match.anyValue())).toHaveLength(0);
  });

  it('sets DeletionProtection false on an AWS::RDS::DBInstance', () => {
    const stack = labStack();
    new rds.CfnDBInstance(stack, 'Db', {
      dbInstanceClass: 'db.t3.micro',
      engine: 'postgres',
      deletionProtection: true,
    });

    Template.fromStack(stack).hasResourceProperties('AWS::RDS::DBInstance', { DeletionProtection: false });
  });

  it('adds the ExpiresAt tag with the expiresAt value to every resource', () => {
    const stack = labStack({ expiresAt: '2026-12-31' });
    new sqs.Queue(stack, 'Queue');

    Template.fromStack(stack).hasResourceProperties('AWS::SQS::Queue', {
      Tags: Match.arrayWith([{ Key: 'ExpiresAt', Value: '2026-12-31' }]),
    });
  });

  it('throws when expiresAt is not a YYYY-MM-DD date', () => {
    expect(() => labStack({ expiresAt: '2026/12/31' })).toThrow(
      'expiresAt must be a YYYY-MM-DD date, got "2026/12/31"',
    );
  });

  it('matches the snapshot of a stack with one queue', () => {
    const stack = labStack();
    new sqs.Queue(stack, 'Queue');

    expect(normalizedTemplate(stack)).toMatchSnapshot();
  });
});
