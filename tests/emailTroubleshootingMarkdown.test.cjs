'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const doc = fs.readFileSync(
  path.join(__dirname, '..', 'docs/Features/Email/Troubleshooting-Mail.md'),
  'utf8',
);

assert.doesNotMatch(doc, /\{%\s*(?:raw|endraw)\s*%\}/,
  'GitHub Markdown must not display Liquid raw wrapper tags');
assert.doesNotMatch(doc, /\{\{variable\}\}/,
  'the example must not expose a Liquid expression to a Pages build');
assert.match(doc, /htmlText\.replace\(\/\\\{\\\{variable\\\}\\\}\/g, variable\)/,
  'the example uses a fixed regex literal for the template placeholder');

const placeholder = /\{\{variable\}\}/g;
assert.equal(
  '<p>{{variable}}</p> {{variable}}'.replace(placeholder, 'safe'),
  '<p>safe</p> safe',
  'the documented regex replaces every literal placeholder',
);
assert.equal(
  '<p>{{variableX}}</p>'.replace(placeholder, 'safe'),
  '<p>{{variableX}}</p>',
  'the fixed pattern does not replace a different placeholder',
);

console.log('emailTroubleshootingMarkdown: 5 assertions passed');
