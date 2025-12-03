const { test, beforeEach, afterEach } = require('node:test');
const assert = require('assert');
const chalk = require('chalk');

const { renderBox } = require('../lib/renderBox');

let originalColumns;

beforeEach(() => {
  originalColumns = process.stdout.columns;
  Object.defineProperty(process.stdout, 'columns', { value: 30, configurable: true });
  chalk.level = 0;
});

afterEach(() => {
  if (originalColumns !== undefined) {
    Object.defineProperty(process.stdout, 'columns', { value: originalColumns, configurable: true });
  }
});

test('wraps long content across lines', () => {
  const { text } = renderBox('This description is long enough to wrap to the next line', {
    borderStyle: 'round',
    boxWidth: 30
  });
  const lines = text.split('\n').filter((l) => l.startsWith('│'));
  const contentLines = lines.map((l) => l.slice(2, -2).trimEnd());
  assert(contentLines.length >= 2, 'description should wrap to multiple lines');
});

test('shows boxed message when terminal is too narrow (<19 columns total)', () => {
  Object.defineProperty(process.stdout, 'columns', { value: 18, configurable: true });
  const { text, isNarrow } = renderBox('Q', { borderStyle: 'round' });
  assert.strictEqual(isNarrow, true);
  const lines = text.split('\n');
  assert(lines[0].startsWith('╭'), 'has top border');
  assert(lines[lines.length - 1].startsWith('╰'), 'has bottom border');
  assert(lines.some((l) => l.includes('Too narrow')), 'contains english narrow message');
});

test('throws if boxWidth is below 15', () => {
  Object.defineProperty(process.stdout, 'columns', { value: 80, configurable: true });
  assert.throws(() => renderBox('Q', { boxWidth: 10 }), /boxWidth must be at least 15/);
});

test('supports double border style', () => {
  Object.defineProperty(process.stdout, 'columns', { value: 40, configurable: true });
  const { text } = renderBox('Q', { borderStyle: 'double' });
  const lines = text.split('\n');
  assert(lines[0].startsWith('╔'), 'double top border');
  assert(lines[lines.length - 1].startsWith('╚'), 'double bottom border');
});
