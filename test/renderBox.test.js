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
  const box = renderBox(
    'Q:',
    [{ key: 'a', label: 'Alpha' }],
    0,
    'round',
    [],
    [['This description is long enough to wrap to the next line']]
  );

  const lines = box.split('\n');
  const descLines = lines.filter((line) => line.includes('description') || line.includes('wrap'));

  assert(descLines.length >= 2, 'description should wrap to multiple lines');
  descLines.forEach((line) => {
    assert(/^│ {9}/.test(line), 'description lines should keep indent within the box');
  });
});
