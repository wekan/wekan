'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const url = process.env.WEKAN_SYNC_TEST_MONGO_URL;

test('real Mongo filters bind numeric, text, regex, dropdown and date values to their own field', { skip: !url }, async () => {
  const { MongoClient } = require('../tests/playwright/node_modules/mongodb');
  const { advancedFilterStringToSelector, buildAdvancedFilterResolversFromCustomFields } = await import('../imports/lib/advancedFilter.js');
  const client = await MongoClient.connect(url);
  const database = client.db(`wekan_filter_test_${randomUUID().replaceAll('-', '')}`);
  const cards = database.collection('cards');
  const definitions = [
    { _id: 'points', name: 'Points', type: 'number' },
    { _id: 'text', name: 'Text', type: 'text' },
    { _id: 'date', name: 'Date', type: 'date' },
    { _id: 'priority', name: 'Priority', type: 'dropdown', settings: { dropdownItems: [{ _id: 'high', name: 'High' }] } },
  ];
  const resolvers = buildAdvancedFilterResolversFromCustomFields(definitions);
  const sameDay = new Date(2026, 8, 28, 12), otherDay = new Date(2026, 8, 27, 12);
  const scenarios = [
    ['Points = 2.5', 'points', 2, 2.5], ['Points > 2.5', 'points', 2.5, 2.75],
    ['Points >= 2.5', 'points', 2.25, 2.5], ['Points < 2.5', 'points', 2.5, 2.25],
    ['Points <= 2.5', 'points', 2.75, 2.5], ['Points != 2.5', 'points', 2.5, 2],
    ['Points = -.5', 'points', 0, -0.5], ['Points = 1e2', 'points', 1, 100],
    ["Text = '2hours'", 'text', 2, '2hours'],
    ['Points = 2', 'points', 1, 2], ['Points > 1', 'points', 1, 2],
    ['Points >= 2', 'points', 1, 2], ['Points < 2', 'points', 2, 1],
    ['Points <= 1', 'points', 2, 1], ['Points != 2', 'points', 2, 1],
    ["Text = 'yes'", 'text', 'no', 'yes'], ["Text != 'yes'", 'text', 'yes', 'no'],
    ['Text = /^yes$/', 'text', 'no', 'yes'], ['Text != /^yes$/', 'text', 'yes', 'no'],
    ["Priority = 'High'", 'priority', ['low'], ['high']],
    ["Date = '2026-09-28'", 'date', otherDay, sameDay],
    ["Date != '2026-09-28'", 'date', sameDay, otherDay],
    ["Date >= '2026-09-28'", 'date', otherDay, sameDay],
  ];
  try {
    assert.throws(() => advancedFilterStringToSelector('UnknownField = 2', resolvers), /Unknown custom field/);
    for (const [filter, id, wrong, right] of scenarios) {
      await cards.deleteMany({});
      await cards.insertMany([
        { _id: 'wrong', customFields: [{ _id: id, value: wrong }, { _id: 'unrelated', value: right }] },
        { _id: 'right', customFields: [{ _id: id, value: right }, { _id: 'unrelated', value: wrong }] },
        { _id: 'missing', customFields: [{ _id: 'unrelated', value: right }] },
      ]);
      const selector = advancedFilterStringToSelector(filter, resolvers);
      const matches = await cards.find(selector).toArray();
      assert.deepEqual(matches.map(card => card._id), ['right'], filter);
    }
    await cards.deleteMany({});
    await cards.insertMany([
      { _id: 'one', customFields: [{ _id: 'points', value: 1 }, { _id: 'text', value: 'yes' }] },
      { _id: 'two', customFields: [{ _id: 'points', value: 2 }, { _id: 'text', value: 'no' }] },
      { _id: 'missing', customFields: [{ _id: 'text', value: 'no' }] },
    ]);
    for (const [filter, expected] of [
      ['not Points = 2', ['missing', 'one']],
      ['!(Points = 2)', ['missing', 'one']],
      ["not(Points = 2 or Text = 'yes')", ['missing']],
      ["(Points = 1 or Points = 2) and Text = 'no'", ['two']],
      ["(Points = 1) or (Points = 2 and Text = 'no')", ['one', 'two']],
      ['not not(Points = 2)', ['two']],
      ["Points = 1 or Points = 2 and Text = 'no'", ['two']],
    ]) {
      const matches = await cards.find(advancedFilterStringToSelector(filter, resolvers)).sort({ _id: 1 }).toArray();
      assert.deepEqual(matches.map(card => card._id), expected, filter);
    }
    await cards.deleteMany({});
    await cards.insertOne({ _id: 'split', customFields: [{ _id: 'points', value: 1 }, { _id: 'text', value: 2 }] });
    // Reproduce the former false positive using Mongo's actual array semantics.
    assert.equal(await cards.countDocuments({ 'customFields._id': 'points', 'customFields.value': 2 }), 1);
    assert.equal(await cards.countDocuments(advancedFilterStringToSelector('Points = 2', resolvers)), 0);
  } finally {
    await database.dropDatabase();
    await client.close();
  }
});
