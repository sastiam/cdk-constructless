import { Token } from 'aws-cdk-lib';
import { Annotations, Match } from 'aws-cdk-lib/assertions';
import { Construct } from 'constructs';
import { describe, expect, it } from 'vitest';
import { assertEmails, assertItemCount, assertPositive, assertRange, assertRegion } from '../../src/core/validation';
import { synth } from '../helpers';

describe('assertEmails', () => {
  it('does not throw when every entry is a valid e-mail address', () => {
    const probe = new Construct(
      synth(() => {}),
      'Probe',
    );
    expect(() => assertEmails(probe, 'emails', ['alerts@example.com', 'ops.team@example.co.uk'])).not.toThrow();
  });

  it('throws with the construct path for an entry without an @ sign', () => {
    const probe = new Construct(
      synth(() => {}),
      'Probe',
    );
    expect(() => assertEmails(probe, 'emails', ['alerts.example.com'])).toThrow(
      '[TestStack/Probe] emails contains an invalid email "alerts.example.com"',
    );
  });
});

describe('assertPositive', () => {
  it('does not throw for a value greater than 0', () => {
    const probe = new Construct(
      synth(() => {}),
      'Probe',
    );
    expect(() => assertPositive(probe, 'amount', 5)).not.toThrow();
  });

  it('throws with the construct path for a value that is not greater than 0', () => {
    const probe = new Construct(
      synth(() => {}),
      'Probe',
    );
    expect(() => assertPositive(probe, 'amount', 0)).toThrow('[TestStack/Probe] amount must be greater than 0, got 0');
  });

  it('does not throw for an unresolved token', () => {
    const probe = new Construct(
      synth(() => {}),
      'Probe',
    );
    expect(() => assertPositive(probe, 'amount', Token.asNumber({ Ref: 'P' }))).not.toThrow();
  });
});

describe('assertRange', () => {
  it('does not throw for a value inside the range', () => {
    const probe = new Construct(
      synth(() => {}),
      'Probe',
    );
    expect(() => assertRange(probe, 'rate', 5, 1, 10)).not.toThrow();
  });

  it('throws with the construct path for a value outside the range', () => {
    const probe = new Construct(
      synth(() => {}),
      'Probe',
    );
    expect(() => assertRange(probe, 'rate', 11, 1, 10)).toThrow(
      '[TestStack/Probe] rate must be between 1 and 10, got 11',
    );
  });
});

describe('assertItemCount', () => {
  it('does not throw for an item count inside the range', () => {
    const probe = new Construct(
      synth(() => {}),
      'Probe',
    );
    expect(() => assertItemCount(probe, 'targets', ['a', 'b'], 1, 3)).not.toThrow();
  });

  it('throws with the construct path for an item count outside the range', () => {
    const probe = new Construct(
      synth(() => {}),
      'Probe',
    );
    expect(() => assertItemCount(probe, 'targets', [], 1, 3)).toThrow(
      '[TestStack/Probe] targets must contain between 1 and 3 items, got 0',
    );
  });
});

describe('assertRegion', () => {
  it('does not throw when the stack region matches the expected region', () => {
    const probe = new Construct(
      synth(() => {}),
      'Probe',
    );
    expect(() => assertRegion(probe, 'us-east-1', 'X')).not.toThrow();
  });

  it('throws with the construct path when the stack region differs from the expected region', () => {
    const probe = new Construct(
      synth(() => {}, { region: 'eu-west-1' }),
      'Probe',
    );
    expect(() => assertRegion(probe, 'us-east-1', 'X')).toThrow(
      '[TestStack/Probe] X requires region us-east-1, got eu-west-1',
    );
  });

  it('adds exactly one unresolved-region warning when the stack region is a token', () => {
    const stack = synth(() => {}, { envAgnostic: true });
    const probe = new Construct(stack, 'Probe');
    expect(() => assertRegion(probe, 'us-east-1', 'X')).not.toThrow();
    const warnings = Annotations.fromStack(stack).findWarning('*', Match.anyValue());
    expect(warnings).toHaveLength(1);
    expect(warnings[0].entry.data).toContain('cdk-constructless:unresolved-region');
  });
});
