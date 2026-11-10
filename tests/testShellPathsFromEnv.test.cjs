'use strict';
// CodeQL js/shell-command-injection-from-environment (alerts #549, #550, #601):
// tests ran `bash -c` with a script that interpolated an absolute path built
// from __dirname or the temporary directory, e.g. `source "${helper}"`,
// `node_bin=${JSON.stringify(prog)}` or `bash "${fetchSh}" -o "${out}"`. A path
// with a quote, `$(` or a backtick would change the command - JSON's quotes are
// not the shell's. The path goes in through the environment (`"$HELPER"`) or
// as an argument (`"$1"`), so the script text is constant.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
// A shell `source`/`.` of an interpolated JavaScript value inside a template.
const SHAPE = /(?:^|[\s;&|(`'"])(?:source|\.)\s+"?\$\{[^}]+\}/m;

const offenders = fs.readdirSync(path.join(root, 'tests'))
  .filter(name => /\.(c?js|mjs)$/.test(name) && name !== path.basename(__filename))
  .filter(name => SHAPE.test(fs.readFileSync(path.join(root, 'tests', name), 'utf8')))
  .sort();
assert.deepEqual(offenders, [], 'pass the path in an environment variable: source "$HELPER"');

// Negative: the guard does catch the shapes that were flagged.
assert.ok(SHAPE.test('spawnSync(\'bash\', [\'-c\', `source "${helper}"; socket_denied`])'));
assert.ok(SHAPE.test('spawnSync(\'bash\', [\'-c\', `. "${helper}"; _et_os`])'));
assert.ok(SHAPE.test('`\n    source "${configPath}"\n`'));
// ...and not the fixed form, nor a JavaScript template that merely mentions a dot.
assert.ok(!SHAPE.test('[\'-c\', \'source "$SOCKET_DENIED_HELPER"; socket_denied\']'));
assert.ok(!SHAPE.test('`${name}. ${detail}`'));

// #601: any value quoted into a `-c` script - "${...}" or ${JSON.stringify(...)}
// - is data pasted into code. A script built from the test's own snippets
// (${functions}, ${body}) is code, and stays allowed.
const DASH_C = /['"]-c['"],\s*`([^`]*)`/g;
const QUOTED_VALUE = /"\$\{|\$\{JSON\.stringify\(/;
function quotedValues(src) {
  const found = [];
  for (const m of src.matchAll(DASH_C)) if (QUOTED_VALUE.test(m[1])) found.push(m[1].slice(0, 80));
  return found;
}
const quoted = fs.readdirSync(path.join(root, 'tests'))
  .filter(name => /\.(c?js|mjs)$/.test(name) && name !== path.basename(__filename))
  .flatMap(name => quotedValues(fs.readFileSync(path.join(root, 'tests', name), 'utf8')).map(s => `${name}: ${s}`))
  .sort();
assert.deepEqual(quoted, [], 'pass the value as an argument ("$1") or in the environment ("$NAME")');
// Negative: the guard catches #601's shapes...
assert.deepEqual(quotedValues("spawnSync('bash', ['-c', `set -u; node_bin=${JSON.stringify(prog)}; npm`])").length, 1);
assert.deepEqual(quotedValues("spawnSync('bash', ['-c', `umask 022; bash \"${fetchSh}\" -o \"${out}\"`])").length, 1);
// ...and not the fixed forms, nor a script built from the test's own code.
assert.deepEqual(quotedValues("spawnSync('bash', ['-c', 'bash \"$1\" -o \"$2\"', '_', fetchSh, out])").length, 0);
assert.deepEqual(quotedValues("spawnSync('bash', ['-c', `set -u; node_bin=\"$NODE_BIN\"; ${body}`])").length, 0);
assert.deepEqual(quotedValues("spawnSync('bash', ['-c', `${functions}\ntool_repo_dir ${args}`])").length, 0);

console.log('testShellPathsFromEnv: no test sources an interpolated path, nor quotes a value into a -c script');
