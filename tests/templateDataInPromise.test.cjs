'use strict';

// Template.currentData() is only the current template's data while Blaze is
// running a helper, an event handler or an autorun. Inside a promise's then()
// there is no current template: it returns null, and whatever the code meant
// to read - Budget and billing's reload() - is silently skipped. That left
// the Budget and billing page unrefreshed after every save. Code that needs
// the data later reads the instance's own `this.data`, or takes what it
// needs before the promise. Run: node tests/templateDataInPromise.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const walk = dir => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap(e => {
  const rel = `${dir}/${e.name}`;
  if (e.isDirectory()) return walk(rel);
  return e.name.endsWith('.js') ? [rel] : [];
});

// A then() callback whose own body, up to its closing brace, reads it.
// One level of braces inside it - `const { reload } =` - is still its body.
const SHAPE = /\.then\(\s*(?:\([^)]*\)|\w+)\s*=>\s*\{(?:[^{}]|\{[^{}]*\})*?Template\.currentData\(\)/;

const found = walk('client').filter(file => SHAPE.test(fs.readFileSync(path.join(ROOT, file), 'utf8')));
assert.deepEqual(found, [], 'Template.currentData() inside a then() callback is null there');

// Negative: the shape is found, and reading the data before the promise is not it.
assert.ok(SHAPE.test("p.then(result => {\n  const { reload } = Template.currentData() || {};\n})"));
assert.ok(!SHAPE.test("const { reload } = Template.currentData();\np.then(() => reload())"));
assert.match(fs.readFileSync(path.join(ROOT, 'client/components/main/billing.js'), 'utf8'),
  /this\.done = promise => promise\.then\(result => \{[\s\S]{0,300}const \{ reload \} = this\.data \|\| \{\};/);

console.log(`templateDataInPromise: ${found.length} found in client/`);
