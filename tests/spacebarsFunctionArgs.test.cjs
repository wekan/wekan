'use strict';

// Spacebars calls a function it finds in a data context when a template
// passes it on: `+child(done=done)` inside a template whose own data has a
// function `done` calls done() with nothing and hands the child its result.
// That kept the Cloud Panel's domain form from ever rendering (done(undefined)
// threw on .then) and made Budget and billing's invoice reload instead of
// passing its reload on. A template that passes a function on takes it from a
// helper of its own, which Spacebars calls once and whose return value it
// passes as it is. Run: node tests/spacebarsFunctionArgs.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
// The function-valued arguments these pages hand from template to template.
const FUNCTIONS = ['done', 'reload', 'close', 'setPrinted', 'setPeriod'];
const PAGES = [
  ['client/components/main/billing.jade', 'client/components/main/billing.js'],
  ['client/components/cloud/cloudPanel.jade', 'client/components/cloud/cloudPanel.js'],
  ['client/components/main/workload.jade', 'client/components/main/workload.js'],
];

function helpersOf(js, template) {
  const at = js.indexOf(`Template.${template}.helpers({`);
  if (at === -1) return new Set();
  const body = js.slice(at, js.indexOf('\n});', at));
  return new Set([...body.matchAll(/^ {2}(\w+)(?:\(|:)/gm)].map(m => m[1]));
}

const problems = [];
for (const [jadeFile, jsFile] of PAGES) {
  const jade = read(jadeFile);
  const js = read(jsFile);
  for (const block of jade.split(/^template\(name="/m).slice(1)) {
    const name = block.slice(0, block.indexOf('"'));
    const helpers = helpersOf(js, name);
    for (const m of block.matchAll(/\+(\w+)\(([^)]*)\)/g)) {
      for (const arg of m[2].split(/\s+/)) {
        const [key, value] = arg.split('=');
        if (FUNCTIONS.includes(key) && value && !helpers.has(value)) problems.push(`${jadeFile}: ${name} passes ${arg} to ${m[1]}, not from a helper`);
      }
    }
  }
}
assert.deepEqual(problems, [], 'a function handed on comes from a helper of the template that hands it on');

// Negative: the old shape is found.
assert.ok(!helpersOf('Template.x.helpers({\n  printed() {}\n});', 'x').has('reload'));
console.log(`spacebarsFunctionArgs: ${PAGES.length} pages checked`);
