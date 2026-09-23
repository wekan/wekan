'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
function files(directory, suffix) {
  return fs.readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap(entry => {
    const name = `${directory}/${entry.name}`;
    return entry.isDirectory() ? files(name, suffix) : name.endsWith(suffix) ? [name] : [];
  });
}
function inventory() {
  const scripts = files('client/components', '.js').map(file => ({ file, text: fs.readFileSync(path.join(root, file), 'utf8') }));
  const specs = files('tests/playwright/specs', '.js').map(file => ({ file, text: fs.readFileSync(path.join(root, file), 'utf8') }));
  const actions = [];
  for (const file of files('client/components', '.jade')) {
    let template = '';
    fs.readFileSync(path.join(root, file), 'utf8').split('\n').forEach((text, index) => {
      const match = /^template\(name=['"]([^'"]+)/.exec(text);
      if (match) template = match[1];
      if (!/menu|popup|header|sidebar/i.test(template) || !/^\s*(a|button)[.#(\s]/.test(text)) return;
      for (const [, selector] of text.matchAll(/\.(js-[\w-]+)/g)) {
        const handlers = scripts.filter(script => new RegExp(`['"\x60](?:click|change|mousedown|touchstart)[^'"\x60\\n]*\\.${selector}(?![\\w-])`).test(script.text)).map(script => script.file);
        const references = specs.filter(spec => spec.text.includes(selector)).map(spec => spec.file);
        actions.push({ file, template, line: index + 1, selector, handlers, testReferences: references });
      }
    });
  }
  return actions;
}
module.exports = { inventory };
if (require.main === module) process.stdout.write(JSON.stringify(inventory(), null, 2) + '\n');
