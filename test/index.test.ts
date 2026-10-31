import { describe, expect, it } from 'vitest';
import * as lib from '../src';

describe('cdk-constructless', () => {
  it('loads the public entry point', () => {
    expect(lib).toBeDefined();
  });
});
