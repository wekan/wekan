'use strict';

// Every Template.X.events / helpers / onCreated / onRendered / onDestroyed must
// have a matching `template(name="X")` in some .jade file.
//
// This is not a style rule. Registering a handler on a template that does not
// exist throws at MODULE LOAD:
//
//   TypeError: can't access property "events", Template.accountSettings is undefined
//
// and because it throws, every module after it in the client graph never runs. A
// removed Admin Panel pane therefore took out `client/features/users.js`, so
// passwordInput.jade was never registered and useraccounts logged
// "Warning no template passwordInput found!" - the password fields disappeared
// from /sign-in and /sign-up. One dead reference in the Admin Panel locked users
// out of the login form.
//
// Nothing else catches this: the file parses, the tests pass, and the failure only
// appears in a browser console.
//
// Run: node tests/templateHandlersExist.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const root = path.join(__dirname, '..');

function walk(dir, out = { jade: [], js: [] }) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (full.endsWith('.jade')) out.jade.push(full);
    else if (full.endsWith('.js')) out.js.push(full);
  }
  return out;
}

const files = walk(path.join(root, 'client/components'));

// Templates defined in markup, plus the ones Blaze/packages provide that app code
// legitimately extends.
const defined = new Set(['body']);
for (const file of files.jade) {
  const src = fs.readFileSync(file, 'utf8');
  for (const m of src.matchAll(/template\(name=['"]([\w]+)['"]\)/g)) defined.add(m[1]);
}
// Templates that come from packages (useraccounts, etc.) rather than our jade.
const fromPackages = new Set(['atForm', 'atSigninLink', 'atSignupLink', 'atPwdForm',
  'atPwdFormBtn', 'atInput', 'atTitle', 'atError', 'atResult', 'atSocial', 'atOauth',
  'userFormsLayout']);

console.log('templateHandlersExist:');

test('every template handler targets a template that exists', () => {
  const missing = [];
  for (const file of files.js) {
    // Strip comments: a commented-out Template.cards.events() in minicard.js is
    // not a registration and must not be reported as one.
    const src = fs.readFileSync(file, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');
    for (const m of src.matchAll(/Template\.(\w+)\.(events|helpers|onCreated|onRendered|onDestroyed)\(/g)) {
      const [, name, hook] = m;
      if (defined.has(name) || fromPackages.has(name)) continue;
      missing.push(`${path.relative(root, file)}: Template.${name}.${hook}()`);
    }
  }
  assert.deepStrictEqual(missing, [],
    'these would throw at module load and abort every module after them:\n  ' +
    missing.join('\n  '));
});

test('the pane removed from Admin Panel Settings left nothing behind', () => {
  // The specific regression: accountSettings was removed when its three settings
  // moved to Email and Login.
  const js = fs.readFileSync(path.join(root, 'client/components/settings/settingBody.js'), 'utf8');
  const jade = fs.readFileSync(path.join(root, 'client/components/settings/settingBody.jade'), 'utf8');
  assert.ok(!/template\(name=['"]accountSettings['"]\)/.test(jade),
    'the pane is gone');
  assert.ok(!/Template\.accountSettings\.(events|helpers|onCreated|onRendered)/.test(js),
    'and nothing may still register on it');
  // Its save button moved to the template that renders the Login pane.
  assert.ok(/Template\.setting\.events\(\{[\s\S]*js-account-access-save/.test(js),
    'the save handler belongs to the template that renders the pane');
});

console.log(`\ntemplateHandlersExist: ${passed} tests passed`);
