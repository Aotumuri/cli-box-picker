function listenForKeys(onChange, onSubmit, onHotkey) {
  const stdin = process.stdin;
  let cleanup;

  const handleData = (key) => {
    if (key === '\u0003') {
      if (cleanup) cleanup();
      process.exit(1);
    } else if (key === '\u001b[A') {
      onChange(-1);
    } else if (key === '\u001b[B') {
      onChange(1);
    } else if (key === '\r' || key === '\n') {
      onSubmit();
    } else if (onHotkey && key.length === 1) {
      onHotkey(key);
    }
  };

  cleanup = () => {
    stdin.off('data', handleData);
    if (stdin.isTTY) {
      stdin.setRawMode(false);
    }
    stdin.pause();
  };

  if (stdin.isTTY) {
    stdin.setRawMode(true);
  }
  stdin.resume();
  stdin.setEncoding('utf8');
  stdin.on('data', handleData);

  return cleanup;
}

module.exports = { listenForKeys };
