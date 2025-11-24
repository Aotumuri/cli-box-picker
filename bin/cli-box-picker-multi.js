#!/usr/bin/env node

const { multiPickBox } = require('../lib');

(async () => {
  const result = await multiPickBox({
    question: 'Select tasks to run',
    choices: {
      b: { value: 'Build', description: 'Compile the project' },
      t: { value: 'Test', description: 'Run unit tests' },
      l: { value: 'Lint', description: 'Run lint checks' }
    },
    borderStyle: 'double',
    descriptionDisplay: 'selected',
    showFooterHint: true
  });

  console.log('Selected values:', result.values.join(', '));
})();
