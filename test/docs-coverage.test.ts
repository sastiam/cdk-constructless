import fs from 'node:fs';
import path from 'node:path';
import { Construct } from 'constructs';
import { describe, expect, it } from 'vitest';
import * as lib from '../src';
import { MANDATORY_HEADINGS } from './helpers/docs';

const constructsDir = path.join(__dirname, '../docs/constructs');
const awsFactsPath = path.join(__dirname, '../docs/aws-facts.md');

function exportedConstructNames(): string[] {
  return Object.entries(lib)
    .filter(([, value]) => typeof value === 'function' && value.prototype instanceof Construct)
    .map(([name]) => name);
}

function awsFactRows(): string[][] {
  const lines = fs.readFileSync(awsFactsPath, 'utf8').split('\n');
  const separatorIndex = lines.findIndex((line) => /^\|\s*-{3,}/.test(line.trim()));
  expect(separatorIndex, 'docs/aws-facts.md has no table header separator').toBeGreaterThan(-1);
  return lines
    .slice(separatorIndex + 1)
    .filter((line) => line.startsWith('|'))
    .map((line) =>
      line
        .split('|')
        .slice(1, -1)
        .map((cell) => cell.trim()),
    );
}

describe('construct documentation', () => {
  it('has a page with every mandatory heading for each exported construct', () => {
    for (const name of exportedConstructNames()) {
      const pagePath = path.join(constructsDir, `${name}.md`);
      expect(fs.existsSync(pagePath), `missing docs/constructs/${name}.md`).toBe(true);
      const lines = fs
        .readFileSync(pagePath, 'utf8')
        .split('\n')
        .map((line) => line.trimEnd());
      for (const heading of MANDATORY_HEADINGS) {
        expect(lines.includes(heading), `docs/constructs/${name}.md is missing "${heading}"`).toBe(true);
      }
    }
  });

  it('records every AWS fact row with four cells, an https source and a YYYY-MM-DD read date', () => {
    for (const cells of awsFactRows()) {
      expect(cells, `docs/aws-facts.md row must have 4 cells: ${cells.join(' | ')}`).toHaveLength(4);
      const [fact, source, readDate] = cells;
      expect(source, `docs/aws-facts.md source of "${fact}" must start with https://`).toMatch(/^https:\/\//);
      expect(readDate, `docs/aws-facts.md read date of "${fact}" must be YYYY-MM-DD`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
