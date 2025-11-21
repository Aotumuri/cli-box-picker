const chalk = require('chalk');

function wrapWithLead(text, lead, maxWidth) {
  const cleanLead = lead || '';
  const leadLen = cleanLead.length;
  const available = Math.max(1, maxWidth - leadLen);
  const words = String(text).split(/(\s+)/).filter((w) => w.length > 0);
  const lines = [];
  let current = '';

  words.forEach((word) => {
    let currentWord = word;
    if ((current ? current.length : 0) + currentWord.length > available) {
      if (current) lines.push(current);
      while (currentWord.length > available) {
        lines.push(currentWord.slice(0, available));
        currentWord = currentWord.slice(available);
      }
      current = currentWord;
    } else {
      current += currentWord;
    }
  });

  if (current) lines.push(current);
  if (lines.length === 0) lines.push('');

  return lines.map((line, idx) =>
    idx === 0 ? `${cleanLead}${line}` : `${' '.repeat(leadLen)}${line}`
  );
}

function renderBox(
  question,
  choiceEntries,
  selectedIndex = 0,
  borderStyle = 'round',
  footerLines = [],
  inlineDescriptions = []
) {
  const borders =
    borderStyle === 'single'
      ? { topLeft: '┌', topRight: '┐', bottomLeft: '└', bottomRight: '┘', horizontal: '─', vertical: '│' }
      : { topLeft: '╭', topRight: '╮', bottomLeft: '╰', bottomRight: '╯', horizontal: '─', vertical: '│' };

  const maxContentWidth = Math.max(10, (process.stdout.columns || 80) - 4);
  const descIndent = '        '; // two tabs worth of spacing for inline descriptions

  const questionLines = String(question)
    .split('\n')
    .flatMap((line) => wrapWithLead(line, '', maxContentWidth));

  const choiceLines = [];
  choiceEntries.forEach(({ key, label }, idx) => {
    const indicator = idx === selectedIndex ? '> ' : '  ';
    const text = key ? `${key}) ${label}` : String(label);
    const wrapped = wrapWithLead(text, indicator, maxContentWidth);
    wrapped.forEach((ln) => choiceLines.push({ text: ln, selected: idx === selectedIndex, choiceIdx: idx }));
  });

  const inlineLines = [];
  inlineDescriptions.forEach((descLines, idx) => {
    if (!Array.isArray(descLines) || descLines.length === 0) return;
    descLines.forEach((line) => {
      const wrappedDesc = wrapWithLead(line, descIndent, maxContentWidth);
      wrappedDesc.forEach((ln) => inlineLines.push({ text: ln, selected: idx === selectedIndex, choiceIdx: idx }));
    });
  });

  const footerWrapped = footerLines
    .map((line) => wrapWithLead(line, '', maxContentWidth))
    .flat();

  const allLineTexts = [
    ...questionLines,
    ...choiceLines.map((l) => l.text),
    ...inlineLines.map((l) => l.text),
    ...footerWrapped
  ];

  const contentWidth = Math.min(
    maxContentWidth,
    Math.max(0, ...allLineTexts.map((line) => line.length))
  );

  const horizontal = borders.horizontal.repeat(contentWidth + 2);
  const top = `${borders.topLeft}${horizontal}${borders.topRight}`;
  const bottom = `${borders.bottomLeft}${horizontal}${borders.bottomRight}`;

  const formatLine = (line, isSelected) => {
    const padded = line.padEnd(contentWidth, ' ');
    const rendered = isSelected ? chalk.cyan(padded) : padded;
    return `${borders.vertical} ${rendered} ${borders.vertical}`;
  };

  const paddedQuestionLines = questionLines.map((line) => formatLine(line, false));
  const blankLine = `${borders.vertical} ${''.padEnd(contentWidth, ' ')} ${borders.vertical}`;

  const paddedChoiceAndDescLines = [];
  choiceEntries.forEach((_, idx) => {
    const choicePart = choiceLines.filter((c) => c.choiceIdx === idx);
    choicePart.forEach((c) => paddedChoiceAndDescLines.push(formatLine(c.text, c.selected)));
    const descPart = inlineLines.filter((d) => d.choiceIdx === idx);
    descPart.forEach((d) => paddedChoiceAndDescLines.push(formatLine(d.text, d.selected)));
  });

  const paddedFooterLines = footerWrapped.map((line) => formatLine(line, false));

  const body = [
    ...paddedQuestionLines,
    blankLine,
    ...paddedChoiceAndDescLines,
    ...(footerWrapped.length ? [blankLine, ...paddedFooterLines] : [])
  ];

  return [top, ...body, bottom].join('\n');
}

module.exports = { renderBox };
