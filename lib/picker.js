const { renderBox } = require('./renderBox');
const { listenForKeys } = require('./keyHandler');

function normalizeChoices(choices) {
  if (Array.isArray(choices)) {
    if (choices.length === 0) throw new Error('choices must be a non-empty array or object');
    return choices.map((value, idx) => ({ key: String(idx + 1), value: String(value) }));
  }

  if (choices && typeof choices === 'object') {
    const entries = Object.entries(choices).map(([key, value]) => ({ key: String(key), value: String(value) }));
    if (entries.length === 0) {
      throw new Error('choices must be a non-empty array or object');
    }
    return entries;
  }

  throw new Error('choices must be a non-empty array or object');
}

async function pickBox(options = {}) {
  const { question, choices, defaultIndex = 0, borderStyle = 'round', confirm = true } = options;

  if (typeof question !== 'string') {
    throw new Error('question must be a string');
  }

  const choiceEntries = normalizeChoices(choices);
  const hotkeyToIndex = choiceEntries.reduce((acc, entry, idx) => {
    acc[entry.key.toLowerCase()] = idx;
    return acc;
  }, {});

  const style = borderStyle === 'single' ? 'single' : 'round';
  const length = choiceEntries.length;
  let currentIndex = Number.isInteger(defaultIndex)
    ? ((defaultIndex % length) + length) % length
    : 0;
  let confirming = false;

  const render = () => {
    console.clear();
    const footer = confirming
      ? [
          `Selected: ${choiceEntries[currentIndex].value}`,
          'Confirm? (Enter/y = yes, n = back)'
        ]
      : ['Use arrows or hotkeys, Enter to choose.'];
    const box = renderBox(question, choiceEntries, currentIndex, style, footer);
    console.log(box);
  };

  return new Promise((resolve) => {
    let finished = false;
    let stopListening = () => {};
    const submit = () => {
      if (finished) return;
      finished = true;
      stopListening();
      const { value } = choiceEntries[currentIndex];
      resolve({ index: currentIndex, value });
    };

    render();

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

module.exports = { pickBox };
