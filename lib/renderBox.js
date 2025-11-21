const chalk = require('chalk');

function renderBox(question, choiceEntries, selectedIndex = 0, borderStyle = 'round', footerLines = []) {
  const borders =
    borderStyle === 'single'
      ? { topLeft: '┌', topRight: '┐', bottomLeft: '└', bottomRight: '┘', horizontal: '─', vertical: '│' }
      : { topLeft: '╭', topRight: '╮', bottomLeft: '╰', bottomRight: '╯', horizontal: '─', vertical: '│' };

  const questionLines = String(question).split('\n');

  const decoratedChoices = choiceEntries.map(({ key, value }) => {
    const label = key ? `${key}) ${value}` : String(value);
    return label;
  });

  const choiceBaseLines = decoratedChoices.map((label, idx) =>
    idx === selectedIndex ? `> ${label}` : `  ${label}`
  );

  const contentWidth = Math.max(
    ...questionLines.map((line) => line.length),
    ...choiceBaseLines.map((line) => line.length),
    ...(footerLines.length ? footerLines.map((line) => line.length) : [0]),
    0
  );

  const horizontal = borders.horizontal.repeat(contentWidth + 2);
  const top = `${borders.topLeft}${horizontal}${borders.topRight}`;
  const bottom = `${borders.bottomLeft}${horizontal}${borders.bottomRight}`;

  const paddedQuestionLines = questionLines.map((line) =>
    `${borders.vertical} ${line.padEnd(contentWidth, ' ')} ${borders.vertical}`
  );

  const paddedChoiceLines = choiceBaseLines.map((line, idx) => {
    const padded = line.padEnd(contentWidth, ' ');
    const rendered = idx === selectedIndex ? chalk.cyan(padded) : padded;
    return `${borders.vertical} ${rendered} ${borders.vertical}`;
  });

  const paddedFooterLines = footerLines.map((line) =>
    `${borders.vertical} ${line.padEnd(contentWidth, ' ')} ${borders.vertical}`
  );

  const blankLine = `${borders.vertical} ${''.padEnd(contentWidth, ' ')} ${borders.vertical}`;
  const body = [
    ...paddedQuestionLines,
    blankLine,
    ...paddedChoiceLines,
    ...(footerLines.length ? [blankLine, ...paddedFooterLines] : [])
  ];

  return [top, ...body, bottom].join('\n');
}

module.exports = { renderBox };
