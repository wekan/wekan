'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { parse } = require('@babel/parser');
const inventory = require('../docs/DeveloperDocs/Card-Email-Field-Inventory.json');
test('every top-level card schema field has an explicit email audit disposition', () => {
  const ast = parse(fs.readFileSync(require.resolve('../models/cards.js'), 'utf8'), { sourceType: 'module' });
  const statement = ast.program.body.find(node => node.type === 'ExpressionStatement' &&
    node.expression.callee?.object?.name === 'Cards' && node.expression.callee?.property?.name === 'attachSchema');
  assert.ok(statement, 'locate the actual Cards schema, not helper method names');
  const schema = statement.expression.arguments[0].arguments[0];
  assert.equal(schema.type, 'ObjectExpression');
  const keys = schema.properties.map(property => property.key.name || property.key.value).filter(key => !key.includes('.'));
  const classified = inventory.flatMap(group => {
    assert.ok(typeof group.handling === 'string' && group.handling.length > 30);
    return group.fields;
  });
  assert.equal(new Set(classified).size, classified.length, 'each field has exactly one disposition');
  assert.deepEqual(classified.sort(), keys.sort(), 'new or removed fields require an explicit content audit update');
  // This test verifies audit completeness, not feature completeness: the
  // inventory intentionally records unfinished linked-board display behavior.
});
