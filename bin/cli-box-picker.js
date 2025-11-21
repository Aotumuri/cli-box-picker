#!/usr/bin/env node

const { pickBox } = require('../lib');

(async () => {
  const result = await pickBox({
    question: 'What are you doing now?',
    choices: {
      c: { value: 'Coding', description: 'Writing new code right now' },
      r: { value: 'Reviewing', description: 'Reading or reviewing changes' },
      s: { value: 'Sleeping', description: 'Away from keyboard' }
    },
    borderStyle: 'round',
    descriptionDisplay: 'selected'
  });

  console.log('You selected:', result.value);
})();
