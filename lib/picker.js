const chalk = require('chalk');
const { renderPickerBox } = require('./renderBox');
const { listenForKeys } = require('./keyHandler');

function toEntryFromValue(raw, keyFallback) {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const value = raw.value !== undefined ? String(raw.value) : String(raw.label ?? raw.toString());
    const label = raw.label !== undefined ? String(raw.label) : value;
    const description = raw.description !== undefined ? String(raw.description) : undefined;
    return { key: keyFallback, label, value, description };
  }
  const value = String(raw);
  return { key: keyFallback, label: value, value, description: undefined };
}

function normalizeChoices(choices) {
  if (Array.isArray(choices)) {
    if (choices.length === 0) throw new Error('choices must be a non-empty array or object');
    return choices.map((choice, idx) => toEntryFromValue(choice, String(idx + 1)));
  }

  if (choices && typeof choices === 'object') {
    const entries = Object.entries(choices).map(([key, value]) => toEntryFromValue(value, String(key)));
    if (entries.length === 0) {
      throw new Error('choices must be a non-empty array or object');
    }
    return entries;
  }

  throw new Error('choices must be a non-empty array or object');
}

/**
 * Displays a boxed interactive selection UI in the terminal.
 * Users can navigate with arrow keys or hotkeys and confirm with Enter.
 *
 * @param {Object} options
 * @param {string} options.question - The question text shown at the top.
 *
 * @param {Array<string|{value:any,label?:string,description?:string}>|
 *        Object<string,{value:any,label?:string,description?:string}>} options.choices
 *   List of choices.
 *   - Object form: keys become hotkeys (e.g. { c:{value:"Coding"} } → hotkey "c").
 *
 * @param {number} [options.defaultIndex=0] - Initial selected index.
 * @param {'single'|'round'|'double'} [options.borderStyle='round'] - Box border style.
 * @param {string|function} [options.selectedColor=null] - Chalk color name or custom highlighter for the selected line.
 * @param {boolean} [options.confirm=true] - Whether to show a confirmation step.
 *
 * @param {'always'|'selected'|'none'} [options.descriptionDisplay='selected']
 *   When to show descriptions.
 *
 * @param {'inline'|'footer'} [options.descriptionPlacement='inline']
 *   Where descriptions are displayed.
 *
 * @param {boolean} [options.showFooterHint=true]
 *   Show usage hints (e.g., “Use arrows or hotkeys, Enter to choose.”).
 *
 * @param {number|null} [options.boxWidth=null]
 *   Fixed inner content width (min 15). If null, auto-sizes to content capped by terminal width.
 *   If specified, clamps to available terminal width; throws if below 15, and shows a narrow warning box if the terminal itself is too small.
 *
 * @returns {Promise<{ index: number, value: any }>}
 *   Resolves with the selected index and value.
 *
 * @example
 * const { pickBox } = require('cli-box-picker');
 * const result = await pickBox({
 *   question: "What are you doing now?",
 *   choices: { c: { value: "Coding" }, s: { value: "Sleeping" } },
 *   borderStyle: "round"
 * });
 * console.log(result.value);
 */
async function pickBox(options = {}) {
  const {
    question,
    choices,
    defaultIndex = 0,
    borderStyle = 'round',
    selectedColor = null,
    confirm = true,
    descriptionDisplay = 'selected', // 'always' | 'selected' | 'none'
    descriptionPlacement = 'inline', // 'inline' | 'footer'
    showFooterHint = true,
    boxWidth = null
  } = options;

  if (typeof question !== 'string') {
    throw new Error('question must be a string');
  }

  const choiceEntries = normalizeChoices(choices);
  const hotkeyToIndex = choiceEntries.reduce((acc, entry, idx) => {
    acc[entry.key.toLowerCase()] = idx;
    return acc;
  }, {});

  const allowedStyles = new Set(['round', 'single', 'double']);
  const style = allowedStyles.has(borderStyle) ? borderStyle : 'round';

  const makeHighlight = () => {
    if (typeof selectedColor === 'function') return selectedColor;
    if (typeof selectedColor === 'string' && chalk[selectedColor]) return chalk[selectedColor];
    return (s) => chalk.cyan(s);
  };
  const highlightFn = makeHighlight();
  const length = choiceEntries.length;
  let currentIndex = Number.isInteger(defaultIndex)
    ? ((defaultIndex % length) + length) % length
    : 0;
  let confirming = false;
  let narrowInterval = null;
  let finished = false;
  let stopListening = () => {};
  let resolveFn = null;
  let resizeHandlerAttached = false;

  const cleanupInterval = () => {
    if (narrowInterval) {
      clearInterval(narrowInterval);
      narrowInterval = null;
    }
  };

  const submit = () => {
    if (finished) return;
    finished = true;
    cleanupInterval();
    if (resizeHandlerAttached && process.stdout && process.stdout.off) {
      process.stdout.off('resize', render);
      resizeHandlerAttached = false;
    }
    stopListening();
    const { value } = choiceEntries[currentIndex];
    if (resolveFn) {
      resolveFn({ index: currentIndex, value });
    }
  };

  const render = () => {
    console.clear();
    const { text, isNarrow } = renderPickerBox({
      question,
      choiceEntries,
      currentIndex,
      borderStyle: style,
      boxWidth,
      descriptionDisplay,
      descriptionPlacement,
      showFooterHint,
      confirming,
      highlightFn
    });

    if (isNarrow) {
      if (!narrowInterval) {
        narrowInterval = setInterval(() => {
          if (!finished) {
            render();
          }
        }, 500);
      }
    } else {
      cleanupInterval();
    }

    console.log(text);
  };

  return new Promise((resolve) => {
    resolveFn = resolve;

    render();

    if (process.stdout && process.stdout.isTTY && process.stdout.on && !resizeHandlerAttached) {
      process.stdout.on('resize', render);
      resizeHandlerAttached = true;
    }

    stopListening = listenForKeys(
      (delta) => {
        if (finished || confirming) return;
        currentIndex = (currentIndex + delta + length) % length;
        render();
      },
      () => {
        if (finished) return;
        if (confirming) {
          submit();
        } else if (!confirm) {
          submit();
        } else {
          confirming = true;
          render();
        }
      },
      (key) => {
        if (finished) return;
        if (confirming) {
          if (key === 'y' || key === 'Y' || key === '\r' || key === '\n') {
            submit();
          } else if (key === 'n' || key === 'N') {
            confirming = false;
            render();
          }
          return;
        }
        const idx = hotkeyToIndex[key.toLowerCase()];
        if (idx !== undefined) {
          currentIndex = idx;
          render();
          if (!confirm) {
            submit();
          } else {
            confirming = true;
            render();
          }
        }
      }
    );
  });
}

module.exports = { pickBox, normalizeChoices };
