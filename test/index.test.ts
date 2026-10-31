import { describe, expect, it } from 'vitest';
import * as lib from '../src';
import { ConstructValidationError } from '../src/core/errors';

describe('package entry point', () => {
  it('exports ConstructValidationError', () => {
    expect(lib.ConstructValidationError).toBe(ConstructValidationError);
  });
});
