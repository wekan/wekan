'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = () => import('../imports/lib/advancedFilter.js');
const resolvers = { fieldNameToId: name => name, fieldValueToId: (_field, value) => value, customFieldDateSelector: () => null };
test('unary negation and adjacent/nested groups preserve tokens and literal parentheses', async () => {
  const m = await load();
  const commands = m.tokenizeAdvancedFilter("not((Points = 2) or Text = '(literal)')");
  const before = structuredClone(commands);
  const result = m.advancedFilterCommandsToSelector(commands, resolvers);
  assert.deepEqual(commands, before);
  assert.ok(result.$or[0].$nor[0].$or);
  assert.equal(result.$or[0].$nor[0].$or[1].customFields.$elemMatch.value.$in[0], '(literal)');
  const regex = m.advancedFilterStringToSelector('Text = /^(a|b)$/', resolvers);
  assert.equal(regex.$or[0].customFields.$elemMatch.value.source, '^(a|b)$');
});
test('incomplete, unmatched and trailing expressions are rejected before database access', async () => {
  const { advancedFilterStringToSelector: parse } = await load();
  for (const expression of ['', ' ', '()', 'not', '!', '(Points = 2', 'Points = 2)',
    'Points', 'Points =', 'Points = 2 and', 'or Points = 2', 'Points = 2 garbage',
    'Points = 2 Points = 3', "Text = 'unfinished", 'Text = /unfinished', 'Text = trailing\\']) {
    assert.throws(() => parse(expression, resolvers), undefined, expression);
  }
  assert.throws(() => parse('not '.repeat(102) + 'Points = 2', resolvers), /Invalid advanced filter/);
});
