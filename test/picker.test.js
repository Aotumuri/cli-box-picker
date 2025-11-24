const { test, beforeEach, afterEach } = require('node:test');
const assert = require('assert');
const chalk = require('chalk');

const keyHandler = require('../lib/keyHandler');
const path = require('path');

let originalColumns;
let originalListen;
let originalConsoleLog;
let originalConsoleClear;

beforeEach(() => {
  originalColumns = process.stdout.columns;
  Object.defineProperty(process.stdout, 'columns', { value: 60, configurable: true });
  chalk.level = 0;
  originalListen = keyHandler.listenForKeys;
  originalConsoleLog = console.log;
  originalConsoleClear = console.clear;
});

afterEach(() => {
  if (originalColumns !== undefined) {
    Object.defineProperty(process.stdout, 'columns', { value: originalColumns, configurable: true });
  }
  keyHandler.listenForKeys = originalListen;
  console.log = originalConsoleLog;
  console.clear = originalConsoleClear;
  // clear module cache for picker to ensure fresh requires
  delete require.cache[path.join(__dirname, '..', 'lib', 'picker.js')];
});

test('hides footer hint when showFooterHint is false', async () => {
  const outputs = [];
  console.log = (str) => outputs.push(str);
  console.clear = () => {};

  keyHandler.listenForKeys = (onChange, onSubmit) => {
    setImmediate(onSubmit);
    return () => {};
  };

  const { pickBox } = require('../lib/picker');
  await pickBox({
    question: 'Q',
    choices: { a: 'Alpha' },
    confirm: false,
    descriptionPlacement: 'footer',
    showFooterHint: false
  });

  const rendered = outputs.join('\n');
  assert(!rendered.includes('Use arrows or hotkeys'), 'footer hint should not be rendered');
});

test('rejects when question is not a string', async () => {
  const { pickBox } = require('../lib/picker');
  await assert.rejects(
    () => pickBox({ question: 123, choices: ['a'] }),
    /question must be a string/
  );
});

test('rejects when choices are empty', async () => {
  const { pickBox } = require('../lib/picker');
  await assert.rejects(
    () => pickBox({ question: 'Q', choices: [] }),
    /choices must be a non-empty array or object/
  );
});

test('multiPickBox toggles selections via hotkeys', async () => {
  const outputs = [];
  console.log = (str) => outputs.push(str);
  console.clear = () => {};

  keyHandler.listenForKeys = (onChange, onSubmit, onHotkey) => {
    onHotkey('b');
    onHotkey('t');
    setImmediate(onSubmit);
    return () => {};
  };

  const { multiPickBox } = require('../lib/multiPicker');
  const res = await multiPickBox({
    question: 'Q',
    choices: { b: 'Build', t: 'Test', l: 'Lint' },
    confirm: false,
    showFooterHint: false
  });

  assert.deepStrictEqual(res.values, ['Build', 'Test']);
});
