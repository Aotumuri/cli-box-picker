#!/usr/bin/env node

const { pickBox } = require("../lib");

(async () => {
  const result = await pickBox({
    question: "What are you doing now?",
    choices: {
      c: "Coding",
      r: "Reviewing",
      s: "Sleeping",
    },
    borderStyle: "round",
  });

  console.log("You selected:", result.value);
})();
