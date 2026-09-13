'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = filename => fs.readFileSync(path.join(root, filename), 'utf8');
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
const labels = { ...en, 'operator-user': "lo'wI'", 'operator-title': "pong’le'" };
const context = { TAPi18n: { __: key => labels[key] || key }, Boards: { colorMap: () => ({}) }, console };
vm.createContext(context);
vm.runInContext(read('config/search-const.js').replace(/export /g, '') + '\n' +
  read('config/query-classes.js').replace(/import[\s\S]*?from ['"][^'"]+['"];\s*/g, '').replace(/export /g, '') +
  '\nthis.Query = Query;', context);
function query(text) {
  const result = new context.Query();
  result.buildParams(text);
  return result;
}
assert.equal(query("lo'wI':Alice").getQueryParams().getPredicate('user'), 'Alice');
assert.equal(query("pong’le':\"two words\"").getQueryParams().getPredicate('title'), 'two words');
assert.equal(query('board:Roadmap').getQueryParams().getPredicate('board'), 'Roadmap');
assert.equal(query('board:"two words"').getQueryParams().getPredicate('board'), 'two words');
assert.equal(query("unknown'operator:value").hasErrors(), true);
assert.equal(query("'plain words'").getQueryParams().text, 'plain words');
console.log('localizedSearchApostrophes: localized operators, quoted values, ordinary operators and unknown names verified');
