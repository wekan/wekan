'use strict';
// CodeQL js/shell-command-injection-from-environment (alerts #549, #550): tests
// ran `bash -c` with a script that interpolated an absolute path built from
// __dirname, e.g. `source "${helper}"`. A checkout path with a quote, `$(` or a
// backtick would change the command. The path goes in through the environment
// instead (`source "$HELPER"`), so the script text is constant.
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

console.log('testShellPathsFromEnv: no test sources an interpolated path');
