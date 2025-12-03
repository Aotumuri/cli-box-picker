const { renderBox: rawRenderBox } = require('cli-box-renderer');

function renderPickerBox({
  question,
  choiceEntries,
  currentIndex,
  borderStyle,
  boxWidth,
  descriptionDisplay,
  descriptionPlacement,
  showFooterHint,
  confirming,
  highlightFn
}) {
  const lines = [];
  lines.push(...String(question).split('\n'));
  lines.push('');

  const shouldShowDesc = (idx) => {
    if (descriptionDisplay === 'none') return false;
    if (descriptionDisplay === 'always') return !!choiceEntries[idx].description;
    if (descriptionDisplay === 'selected') return idx === currentIndex && !!choiceEntries[idx].description;
    return false;
  };

  choiceEntries.forEach((entry, idx) => {
    const prefix = idx === currentIndex ? '> ' : '  ';
    const label = entry.key ? `${entry.key}) ${entry.label}` : entry.label;
    const base = `${prefix}${label}`;
    lines.push(idx === currentIndex ? highlightFn(base) : base);

    if (descriptionPlacement === 'inline' && shouldShowDesc(idx) && entry.description) {
      entry.description.split('\n').forEach((d) => lines.push(`        ${d}`));
    }
  });

  let footerLines = [];
  const selectedEntry = choiceEntries[currentIndex];
  if (descriptionPlacement === 'footer') {
    if (confirming) {
      footerLines = [
        `Selected: ${selectedEntry.value}`,
        ...(selectedEntry.description ? [selectedEntry.description] : []),
        'Confirm? (Enter/y = yes, n = back)'
      ];
    } else if (descriptionDisplay === 'always') {
      footerLines = choiceEntries
        .filter((entry) => entry.description)
        .map((entry) => `${entry.label}: ${entry.description}`);
    } else if (descriptionDisplay === 'selected' && selectedEntry.description) {
      footerLines = [selectedEntry.description];
    }
  } else if (confirming) {
    footerLines = ['Confirm? (Enter/y = yes, n = back)'];
  }

  if (!confirming && showFooterHint) {
    footerLines.push('Use arrows or hotkeys, Enter to choose.');
  }

  if (footerLines.length) {
    lines.push('');
    lines.push(...footerLines);
  }

  return rawRenderBox(lines, { borderStyle, boxWidth });
}

function renderMultiPickerBox({
  question,
  choiceEntries,
  currentIndex,
  selectedSet,
  borderStyle,
  boxWidth,
  descriptionDisplay,
  descriptionPlacement,
  showFooterHint,
  confirming,
  highlightFn
}) {
  const lines = [];
  lines.push(...String(question).split('\n'));
  lines.push('');

  const shouldShowDesc = (idx) => {
    if (descriptionDisplay === 'none') return false;
    if (descriptionDisplay === 'always') return !!choiceEntries[idx].description;
    if (descriptionDisplay === 'selected') return idx === currentIndex && !!choiceEntries[idx].description;
    return false;
  };

  choiceEntries.forEach((entry, idx) => {
    const cursor = idx === currentIndex ? '>' : ' ';
    const check = selectedSet.has(idx) ? '[x]' : '[ ]';
    const label = entry.key ? `${entry.key}) ${entry.label}` : entry.label;
    const base = `${cursor} ${check} ${label}`;
    lines.push(idx === currentIndex ? highlightFn(base) : base);

    if (descriptionPlacement === 'inline' && shouldShowDesc(idx) && entry.description) {
      entry.description.split('\n').forEach((d) => lines.push(`        ${d}`));
    }
  });

  const selectedEntry = choiceEntries[currentIndex];
  const count = selectedSet.size;
  let footerLines = [];
  if (descriptionPlacement === 'footer') {
    if (confirming) {
      footerLines = [
        `Selected items: ${count}`,
        ...(selectedEntry.description ? [selectedEntry.description] : []),
        'Confirm? (Enter/y = yes, n = back)'
      ];
    } else if (descriptionDisplay === 'always') {
      footerLines = choiceEntries
        .filter((entry) => entry.description)
        .map((entry) => `${entry.label}: ${entry.description}`);
    } else if (descriptionDisplay === 'selected' && selectedEntry.description) {
      footerLines = [selectedEntry.description];
    }
  } else if (confirming) {
    footerLines = ['Confirm? (Enter/y = yes, n = back)'];
  }

  if (!confirming && showFooterHint) {
    footerLines.push('Space to toggle, arrows/hotkeys to move, Enter to confirm.');
  }

  if (footerLines.length) {
    lines.push('');
    lines.push(...footerLines);
  }

  return rawRenderBox(lines, { borderStyle, boxWidth });
}

module.exports = { renderBox: rawRenderBox, renderPickerBox, renderMultiPickerBox };
