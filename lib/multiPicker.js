const chalk = require('chalk');
const { renderBox } = require('./renderBox');
const { listenForKeys } = require('./keyHandler');
const { normalizeChoices } = require('./picker');

/**
 * @typedef {import('../index').MultiPickBoxOption} MultiPickBoxOption
 * @typedef {import('../index').PickBoxResult} PickBoxResult
 */

/**
 * Displays a boxed interactive multi-selection UI in the terminal.
 * Users can navigate with arrow keys or hotkeys, toggle with Space/hotkeys, and confirm with Enter.
 *
 * @param {Object} options
 * @param {string} options.question - The question text shown at the top.
 *
 * @param {Array<string|{value:any,label?:string,description?:string}>|
 *        Object<string,{value:any,label?:string,description?:string}>} options.choices
 *   List of choices (object keys become hotkeys).
 *
 * @param {number} [options.defaultIndex=0] - Initial cursor position.
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
 *   Show usage hints (e.g., “Space to toggle, Enter to confirm.”).
 *
 * @param {number|null} [options.boxWidth=null]
 *   Fixed inner content width (min 15). If null, auto-sizes to content capped by terminal width.
 *   If specified, clamps to available terminal width; throws if below 15, and shows a narrow warning box if the terminal itself is too small.
 *
 * @returns {Promise<{ indices: number[], values: any[] }>}
 *   Resolves with the selected indices and values.
 *
 * @example
 * const { multiPickBox } = require('cli-box-picker');
 * const result = await multiPickBox({
 *   question: "Select tasks",
 *   choices: { b: { value: "Build" }, t: { value: "Test" }, l: { value: "Lint" } },
 *   borderStyle: "double"
 * });
 * console.log(result.values);
 */
async function multiPickBox(options = {}) {
  const {
    question,
    choices,
    defaultIndex = 0,
    borderStyle = 'round',
    selectedColor = null,
    confirm = true,
    descriptionDisplay = 'selected',
    descriptionPlacement = 'inline',
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
  let finished = false;
  let stopListening = () => {};
  let resolveFn = null;
  let narrowInterval = null;
  let resizeHandlerAttached = false;
  const selectedSet = new Set();

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
    const indices = Array.from(selectedSet).sort((a, b) => a - b);
    const values = indices.map((idx) => choiceEntries[idx].value);
    if (resolveFn) {
      resolveFn({ indices, values });
    }
  };

  const render = () => {
    console.clear();
    const selectedEntry = choiceEntries[currentIndex];

    let footer = [];
    let inlineDescriptions = new Array(choiceEntries.length).fill(null);

    const shouldShowDesc = (idx) => {
      if (descriptionDisplay === 'none') return false;
      if (descriptionDisplay === 'always') return !!choiceEntries[idx].description;
      if (descriptionDisplay === 'selected') return idx === currentIndex && !!choiceEntries[idx].description;
      return false;
    };

    if (descriptionPlacement === 'inline') {
      inlineDescriptions = choiceEntries.map((entry, idx) =>
        shouldShowDesc(idx) && entry.description ? entry.description.split('\n') : null
      );
    } else if (descriptionPlacement === 'footer') {
      if (descriptionDisplay === 'always') {
        footer = choiceEntries
          .filter((entry) => entry.description)
          .map((entry) => `${entry.label}: ${entry.description}`);
      } else if (descriptionDisplay === 'selected' && selectedEntry.description) {
        footer = [selectedEntry.description];
      }
    }

    const count = selectedSet.size;
    if (confirming) {
      footer = [
        `Selected items: ${count}`,
        ...(selectedEntry.description && descriptionPlacement === 'footer' ? [selectedEntry.description] : []),
        'Confirm? (Enter/y = yes, n = back)'
      ];
    } else if (showFooterHint) {
      footer.push('Space to toggle, arrows/hotkeys to move, Enter to confirm.');
    }

    const { text, isNarrow } = renderBox(
      question,
      choiceEntries,
      currentIndex,
      style,
      footer,
      inlineDescriptions,
      boxWidth,
      highlightFn,
      selectedSet
    );

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
          if (selectedSet.has(idx)) {
            selectedSet.delete(idx);
          } else {
            selectedSet.add(idx);
          }
          render();
          return;
        }
        if (key === ' ') {
          if (selectedSet.has(currentIndex)) {
            selectedSet.delete(currentIndex);
          } else {
            selectedSet.add(currentIndex);
          }
          render();
        }
      }
    );
  });
}

module.exports = { multiPickBox };
