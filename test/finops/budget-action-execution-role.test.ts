import type { Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { describe, expect, it } from 'vitest';
import { BudgetActionExecutionRole, StopInstancesTarget } from '../../src/finops/budget-action-execution-role';
import { expectNoNagErrors, normalizedTemplate, synth } from '../helpers';

const ACCOUNT = '123456789012';

function roleStack(targets: StopInstancesTarget[]): Stack {
  return synth((stack) => {
    const executionRole = new BudgetActionExecutionRole(stack, 'BudgetActionExecutionRole');
    for (const target of targets) {
      executionRole.allowStopInstances(target);
    }
  });
}

function expectPolicyStatements(stack: Stack, statements: unknown[]): void {
  Template.fromStack(stack).hasResourceProperties('AWS::IAM::Policy', {
    PolicyDocument: Match.exact({ Statement: statements, Version: '2012-10-17' }),
  });
}

/**
 * The statement that grants the SSM automation permissions for one stop document.
 *
 * Each ARN is built from the partition token, which is the only slot matched with `Match.anyValue()`.
 * The trust policy test pins that slot to `{ Ref: 'AWS::Partition' }`.
 */
function ssmStatement(document: string): Record<string, unknown> {
  return {
    Action: 'ssm:StartAutomationExecution',
    Effect: 'Allow',
    Resource: [
      { 'Fn::Join': ['', ['arn:', Match.anyValue(), `:ssm:*:*:document/${document}`]] },
      { 'Fn::Join': ['', ['arn:', Match.anyValue(), ':ssm:*:*:automation-execution/*']] },
      { 'Fn::Join': ['', ['arn:', Match.anyValue(), `:ssm:*:*:automation-definition/${document}:*`]] },
    ],
  };
}

const EC2_STATEMENT = {
  Action: ['ec2:DescribeInstanceStatus', 'ec2:StopInstances'],
  Condition: { 'ForAnyValue:StringEquals': { 'aws:CalledVia': ['ssm.amazonaws.com'] } },
  Effect: 'Allow',
  Resource: '*',
};

const RDS_STATEMENT = {
  Action: ['rds:DescribeDBInstances', 'rds:StopDBInstance'],
  Condition: { 'ForAnyValue:StringEquals': { 'aws:CalledVia': ['ssm.amazonaws.com'] } },
  Effect: 'Allow',
  Resource: '*',
};

describe('BudgetActionExecutionRole', () => {
  describe('execution role trust', () => {
    it('trusts only budgets.amazonaws.com of the same account and budgets ARN', () => {
      const stack = roleStack([]);

      Template.fromStack(stack).hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.exact({
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Condition: {
                StringEquals: { 'aws:SourceAccount': ACCOUNT },
                ArnLike: {
                  'aws:SourceArn': {
                    'Fn::Join': ['', ['arn:', Match.anyValue(), `:budgets::${ACCOUNT}:budget/*`]],
                  },
                },
              },
              Effect: 'Allow',
              Principal: { Service: 'budgets.amazonaws.com' },
            },
          ],
          Version: '2012-10-17',
        }),
      });
    });

    it('fills the partition slot of the SourceArn with the AWS::Partition pseudo parameter', () => {
      const stack = roleStack([]);
      const role = Object.values(Template.fromStack(stack).findResources('AWS::IAM::Role'))[0] as {
        Properties: {
          AssumeRolePolicyDocument: {
            Statement: Array<{ Condition: { ArnLike: { 'aws:SourceArn': { 'Fn::Join': [string, unknown[]] } } } }>;
          };
        };
      };
      const [, sourceArnParts] =
        role.Properties.AssumeRolePolicyDocument.Statement[0].Condition.ArnLike['aws:SourceArn']['Fn::Join'];

      expect(sourceArnParts).toEqual(['arn:', { Ref: 'AWS::Partition' }, `:budgets::${ACCOUNT}:budget/*`]);
    });
  });

  describe('EC2 stop permissions', () => {
    it('grants exactly the two EC2 statements when EC2 is allowed', () => {
      const stack = roleStack([StopInstancesTarget.EC2]);

      expectPolicyStatements(stack, [EC2_STATEMENT, ssmStatement('AWS-StopEC2Instance')]);
    });

    it('adds the EC2 statement pair once when EC2 is allowed twice', () => {
      const stack = roleStack([StopInstancesTarget.EC2, StopInstancesTarget.EC2]);

      expectPolicyStatements(stack, [EC2_STATEMENT, ssmStatement('AWS-StopEC2Instance')]);
    });
  });

  describe('RDS stop permissions', () => {
    it('grants exactly the two RDS statements when RDS is allowed', () => {
      const stack = roleStack([StopInstancesTarget.RDS]);

      expectPolicyStatements(stack, [RDS_STATEMENT, ssmStatement('AWS-StopRdsInstance')]);
    });
  });

  describe('no start permissions', () => {
    it('never grants ec2:StartInstances or rds:StartDBInstance for EC2 and RDS', () => {
      const stack = roleStack([StopInstancesTarget.EC2, StopInstancesTarget.RDS]);
      const json = JSON.stringify(Template.fromStack(stack).toJSON());

      expect(json).not.toContain('ec2:StartInstances');
      expect(json).not.toContain('rds:StartDBInstance');
    });
  });

  describe('EC2 and RDS stop permissions', () => {
    it('matches the snapshot and reports no cdk-nag errors', () => {
      const stack = roleStack([StopInstancesTarget.EC2, StopInstancesTarget.RDS]);

      expect(normalizedTemplate(stack)).toMatchSnapshot();
      expectNoNagErrors(stack);
    });
  });
});
