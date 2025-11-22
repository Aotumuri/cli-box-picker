# cli-box-picker

Small interactive picker for terminals. Renders a boxed question with selectable choices, supports hotkeys, inline/ footer descriptions, and optional confirmation.

## Install

```sh
npm install cli-box-picker
# or
npx cli-box-picker
```

Node.js 18+ (CommonJS).

## Quick start (CLI)

```sh
npx cli-box-picker
```

## Quick start (API)

```js
const { pickBox } = require('cli-box-picker');

async function main() {
  const result = await pickBox({
    question: 'What are you doing now?',
    choices: {
      c: { value: 'Coding', description: 'Writing new code right now' },
      r: { value: 'Reviewing', description: 'Reading or reviewing changes' },
      s: { value: 'Sleeping', description: 'Away from keyboard' }
    },
    borderStyle: 'round',
    confirm: true,
    descriptionPlacement: 'inline',   // 'inline' | 'footer'
    descriptionDisplay: 'selected',   // 'selected' | 'always' | 'none'
    showFooterHint: true
  });

  console.log('Index:', result.index);
  console.log('Value:', result.value);
}

main();
```

## API

```js
const { pickBox } = require('cli-box-picker');
```

### `await pickBox(options)`

| option | type | default | description |
| --- | --- | --- | --- |
| `question` | `string` | required | Text shown at the top of the box (multi-line allowed). |
| `choices` | `Array` \| `Object` | required | Either an array or an object. Values can be strings or `{ value, label, description }`. Object keys become hotkeys. |
| `defaultIndex` | `number` | `0` | Initial selected index. |
| `borderStyle` | `'round' \| 'single' \| 'double'` | `'round'` | Border style characters. |
| `confirm` | `boolean` | `true` | If `true`, asks for confirmation (Enter/y to confirm, n to go back). |
| `descriptionPlacement` | `'inline' \| 'footer'` | `'inline'` | Where to show descriptions. |
| `descriptionDisplay` | `'selected' \| 'always' \| 'none'` | `'selected'` | When to show descriptions. |
| `showFooterHint` | `boolean` | `true` | Show the hint line “Use arrows or hotkeys, Enter to choose.” |
| `boxWidth` | `number \| null` | `null` | Fixed inner content width (min 15). If `null`, width auto-sizes to content (capped by terminal width). If the terminal is too narrow for 15 inner columns, it renders a small boxed message “Too narrow to render (need at least 15 columns).”. Values below 15 throw. |

### Choice shapes

- Array of strings: `['Coding', 'Reviewing']` → hotkeys `1, 2` auto-assigned.
- Array of objects: `[{ value: 'Coding', description: 'Writing new code right now' }]`.
- Object map: `{ c: 'Coding', r: { value: 'Reviewing', description: 'Reading or reviewing changes' } }` → hotkeys `c`, `r`.

### Key handling

- Up/Down arrows to move (wraps around).
- Hotkeys jump/select immediately.
- Enter: select (or confirm if `confirm: true`).
- Ctrl+C: exit process.

## CLI demo script

`bin/cli-box-picker.js` calls the API with a sample question; usable via `npx cli-box-picker` or after a local install `npx .`.

## Tests

```sh
npm test
```

## Notes

- Clears the screen on each render via `console.clear()`.
