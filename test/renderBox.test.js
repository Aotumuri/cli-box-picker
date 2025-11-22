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

test('renders inline descriptions with wrapping and indentation', () => {
  const { text } = renderBox(
    'Q:',
    [{ key: 'a', label: 'Alpha' }],
    0,
    'round',
    [],
    [['This description is long enough to wrap to the next line']]
  );

  const lines = text.split('\n');
  const descLines = lines.filter((line) => line.includes('description') || line.includes('wrap'));

  assert(descLines.length >= 2, 'description should wrap to multiple lines');
  descLines.forEach((line) => {
    assert(/^│ {9}/.test(line), 'description lines should keep indent within the box');
  });
});

test('shows boxed message when terminal is too narrow (<19 columns total)', () => {
  Object.defineProperty(process.stdout, 'columns', { value: 18, configurable: true });
  const { text, isNarrow } = renderBox(
    'Q',
    [{ key: 'a', label: 'Alpha' }],
    0,
    'round',
    [],
    [[]]
  );
  assert.strictEqual(isNarrow, true);
  const lines = text.split('\n');
  assert(lines[0].startsWith('╭'), 'has top border');
  assert(lines[lines.length - 1].startsWith('╰'), 'has bottom border');
  assert(lines.some((l) => l.includes('Too narrow')), 'contains english narrow message');
});

test('throws if boxWidth is below 15', () => {
  Object.defineProperty(process.stdout, 'columns', { value: 80, configurable: true });
  assert.throws(
    () =>
      renderBox(
        'Q',
        [{ key: 'a', label: 'Alpha' }],
        0,
        'round',
        [],
        [[]],
        10
      ),
    /boxWidth must be at least 15/
  );
});

test('supports double border style', () => {
  Object.defineProperty(process.stdout, 'columns', { value: 40, configurable: true });
  const { text } = renderBox('Q', [{ key: 'a', label: 'Alpha' }], 0, 'double', [], [[]]);
  const lines = text.split('\n');
  assert(lines[0].startsWith('╔'), 'double top border');
  assert(lines[lines.length - 1].startsWith('╚'), 'double bottom border');
});

test('applies custom highlight function for selected line', () => {
  const highlighter = (s) => `[H]${s}[H]`;
  const { text } = renderBox(
    'Q',
    [{ key: 'a', label: 'Alpha' }, { key: 'b', label: 'Beta' }],
    0,
    'round',
    [],
    [[]],
    null,
    highlighter
  );
  const lines = text.split('\n');
  const selectedLine = lines.find((l) => l.includes('[H]'));
  assert(selectedLine, 'selected line should be highlighted by custom function');
});
