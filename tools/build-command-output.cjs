'use strict';
// Preloaded only by the human-run build. Print captured tool commands/output
// without changing their return values, exit codes, callbacks or stdio settings.
const childProcess = require('node:child_process');
const { syncBuiltinESMExports } = require('node:module');
function argument(value) {
  return String(value).replace(/(https?:\/\/)[^\s/@]+:[^\s/@]+@/gi, '$1[redacted]@')
    .replace(/([?&](?:access_token|token|password|secret|api_key)=)[^&\s]+/gi, '$1[redacted]')
    .replace(/((?:token|password|secret|api[-_]?key)=)[^\s]+/gi, '$1[redacted]');
}
function announce(method, command, args) {
  let hideNext = false;
  const safe = (Array.isArray(args) ? args : []).map(value => {
    if (hideNext) { hideNext = false; return '[redacted]'; }
    if (/^--?(?:token|password|secret|api[-_]?key)$/i.test(String(value))) hideNext = true;
    return argument(value);
  });
  process.stderr.write(`[build command ${process.pid}] ${method}: ${argument(command)} ${safe.map(value => JSON.stringify(value)).join(' ')}\n`);
}
for (const method of ['spawn', 'execFile', 'exec']) {
  const original = childProcess[method];
  childProcess[method] = function (command, ...rest) {
    announce(method, command, rest[0]);
    const child = original.call(this, command, ...rest);
    // Capture-mode commands otherwise hide successful dependency resolver output.
    // Listening does not replace Meteor's own collectors or callback buffers.
    child.stdout?.on('data', bytes => process.stdout.write(bytes));
    child.stderr?.on('data', bytes => process.stderr.write(bytes));
    return child;
  };
}
for (const method of ['spawnSync', 'execFileSync', 'execSync']) {
  const original = childProcess[method];
  childProcess[method] = function (command, ...rest) {
    announce(method, command, rest[0]);
    try {
      const result = original.call(this, command, ...rest);
      if (method === 'spawnSync') {
        if (result.stdout) process.stdout.write(result.stdout);
        if (result.stderr) process.stderr.write(result.stderr);
      } else if (result) process.stdout.write(result);
      return result;
    } catch (error) {
      if (error.stdout) process.stdout.write(error.stdout);
      if (error.stderr) process.stderr.write(error.stderr);
      throw error;
    }
  };
}
syncBuiltinESMExports();
