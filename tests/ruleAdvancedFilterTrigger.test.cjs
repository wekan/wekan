'use strict';

// Plain-Node unit test (no Meteor) for #3092: "let a Rule's trigger use the
// same 'Advanced Filter' criteria already available in the board's Filter
// sidebar."
//
// Run: ELECTRON_RUN_AS_NODE=1 <node> tests/ruleAdvancedFilterTrigger.test.cjs
//
// What this pins:
//   1. The command-array -> Mongo selector algorithm lives ONCE, in
//      /imports/lib/advancedFilter.js (advancedFilterCommandsToSelector /
//      advancedFilterStringToSelector). client/lib/filter.js's sidebar
//      AdvancedFilter class and server/lib/advancedFilterMatch.js (used by
//      the new rule trigger) both call it — this is verified two ways:
//        a) a SOURCE-PATTERN negative test: neither file contains its own
//           copy of the parser/selector-builder (no 'processConditions',
//           'processLogicalOperators' or 'processSubCommands' function
//           declaration outside imports/lib/advancedFilter.js);
//        b) both call sites actually import the shared function.
//   2. advancedFilterStringToSelector() produces selectors that correctly
//      combine label/custom-field/and/or/not criteria (representative
//      "advanced filter" combinations), matching the semantics the sidebar
//      has always had for these operators.
//   3. server/lib/advancedFilterMatch.js's synchronous resolver builder
//      resolves a custom field's name -> id and a dropdown value -> id the
//      same way the sidebar's ReactiveCache-backed resolvers do, from a
//      plain pre-fetched array (no ReactiveCache/Meteor import needed by the
//      shared algorithm itself).

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
const tests = [];
function test(name, fn) {
  tests.push([name, fn]);
}

// --- 1a. Negative test: the parser/selector-builder is not duplicated ------

test('the selector-building algorithm is not reimplemented anywhere else', () => {
  const root = path.resolve(__dirname, '..');
  const shared = path.join(root, 'imports/lib/advancedFilter.js');
  const sharedSrc = fs.readFileSync(shared, 'utf8');
  assert.ok(/function processConditions/.test(sharedSrc));
  assert.ok(/function processLogicalOperators/.test(sharedSrc));
  assert.ok(/function processSubCommands/.test(sharedSrc));

  const candidateFiles = [
    'client/lib/filter.js',
    'server/lib/advancedFilterMatch.js',
    'server/rulesHelper.js',
  ].map(f => path.join(root, f));

  for (const file of candidateFiles) {
    const src = fs.readFileSync(file, 'utf8');
    // No file outside advancedFilter.js may declare its own copy of these
    // three functions (the actual parser/selector logic).
    assert.ok(!/function processConditions\(/.test(src), `${file} redeclares processConditions`);
    assert.ok(!/function processLogicalOperators\(/.test(src), `${file} redeclares processLogicalOperators`);
    assert.ok(!/function processSubCommands\(/.test(src), `${file} redeclares processSubCommands`);
  }
});

// --- 1b. Both call sites import the shared function -------------------------

test('the sidebar filter and the rule trigger both import the shared selector builder', () => {
  const root = path.resolve(__dirname, '..');
  const clientFilter = fs.readFileSync(path.join(root, 'client/lib/filter.js'), 'utf8');
  const serverMatch = fs.readFileSync(path.join(root, 'server/lib/advancedFilterMatch.js'), 'utf8');
  assert.ok(/advancedFilterCommandsToSelector/.test(clientFilter));
  assert.ok(/from ['"]\/imports\/lib\/advancedFilter['"]/.test(clientFilter));
  assert.ok(/advancedFilterStringToSelector/.test(serverMatch));
  assert.ok(/from ['"]\/imports\/lib\/advancedFilter['"]/.test(serverMatch));
});

// --- 2. Representative advanced-filter combinations -------------------------

async function loadShared() {
  const mod = await import('../imports/lib/advancedFilter.js');
  return mod;
}

test('label = value and custom-field comparisons combine with and/or/not', async () => {
  const { advancedFilterStringToSelector } = await loadShared();
  const resolvers = {
    fieldNameToId: field => (field === 'Priority' ? 'cf-priority' : field),
    fieldValueToId: (field, value) => (field === 'Priority' && value === 'High' ? 'opt-high' : value),
    customFieldDateSelector: () => null,
  };

  // Priority == High
  const simple = advancedFilterStringToSelector("Priority == 'High'", resolvers);
  assert.deepEqual(simple, {
    $or: [
      {
        'customFields._id': 'cf-priority',
        'customFields.value': { $in: ['opt-high', NaN] },
      },
    ],
  });

  // Priority == High && Points > 3
  const anded = advancedFilterStringToSelector("Priority == 'High' && Points > 3", resolvers);
  assert.deepEqual(anded, {
    $or: [
      {
        $and: [
          {
            'customFields._id': 'cf-priority',
            'customFields.value': { $in: ['opt-high', NaN] },
          },
          {
            'customFields._id': 'Points',
            'customFields.value': { $gt: 3 },
          },
        ],
      },
    ],
  });

  // Priority == High || Priority == Low
  const ored = advancedFilterStringToSelector("Priority == 'High' || Priority == 'Low'", resolvers);
  assert.deepEqual(ored, {
    $or: [
      {
        $or: [
          {
            'customFields._id': 'cf-priority',
            'customFields.value': { $in: ['opt-high', NaN] },
          },
          {
            'customFields._id': 'cf-priority',
            'customFields.value': { $in: ['Low', NaN] },
          },
        ],
      },
    ],
  });

  // ! Priority == High (the sidebar's 'not' applies to the single condition
  // that follows it once that condition has already been reduced - the same
  // left-to-right evaluation the sidebar's Advanced Filter description
  // documents; a NOT wrapped in its own parentheses is a pre-existing corner
  // case of the shared algorithm, not something this refactor changes).
  const negated = advancedFilterStringToSelector("! Priority == 'High'", resolvers);
  assert.deepEqual(negated, {
    $or: [
      {
        $not: {
          'customFields._id': 'cf-priority',
          'customFields.value': { $in: ['opt-high', NaN] },
        },
      },
    ],
  });
});

// --- 3. Server-side synchronous resolvers mirror the client's -------------

test('the server resolvers resolve custom field names and dropdown values like the sidebar does', async () => {
  const { buildAdvancedFilterResolversFromCustomFields: buildServerAdvancedFilterResolvers } = await loadShared();
  const customFields = [
    {
      _id: 'cf-1',
      name: 'Priority',
      type: 'dropdown',
      settings: {
        dropdownItems: [
          { _id: 'opt-high', name: 'High' },
          { _id: 'opt-low', name: 'Low' },
        ],
      },
    },
  ];
  const resolvers = buildServerAdvancedFilterResolvers(customFields);
  assert.equal(resolvers.fieldNameToId('Priority'), 'cf-1');
  assert.equal(resolvers.fieldValueToId('Priority', 'High'), 'opt-high');
  // An unknown field name resolves to undefined (no crash) - the sidebar's
  // ReactiveCache-backed lookup throws instead when the field truly does not
  // exist; server/lib/advancedFilterMatch.js's cardMatchesAdvancedFilter()
  // wraps the whole build in try/catch for exactly that class of input, so a
  // stored trigger filter that references a field the board no longer has
  // simply never matches rather than crashing rule evaluation.
  assert.equal(resolvers.fieldNameToId('NoSuchField'), undefined);
});

// --- 4. Fire / no-fire behaviour for representative criteria ---------------
//
// cardMatchesAdvancedFilter() itself needs a live Mongo/FerretDB-backed Cards
// collection (it queries `Cards.findOneAsync`) so it is not unit-testable
// without Meteor; what IS unit-testable and pinned here is that the selector
// it builds actually discriminates a matching card from a non-matching one,
// using the same minimongo-style evaluator style as advancedFilterDate.test.cjs.

function matchesSelector(selector, doc) {
  if (selector.$or) return selector.$or.some(s => matchesSelector(s, doc));
  if (selector.$and) return selector.$and.every(s => matchesSelector(s, doc));
  if (selector.$not) return !matchesSelector(selector.$not, doc);
  // A flat {'customFields._id': x, 'customFields.value': y} clause matches a
  // card that has SOME customFields entry with that _id whose value matches y.
  if (selector['customFields._id'] !== undefined) {
    const id = selector['customFields._id'];
    const valueSel = selector['customFields.value'];
    return (doc.customFields || []).some(cf => {
      if (cf._id !== id) return false;
      if (valueSel && typeof valueSel === 'object' && !(valueSel instanceof RegExp)) {
        if (valueSel.$in) return valueSel.$in.includes(cf.value);
        if (valueSel.$gt !== undefined) return cf.value > valueSel.$gt;
        if (valueSel.$gte !== undefined) return cf.value >= valueSel.$gte;
        if (valueSel.$lt !== undefined) return cf.value < valueSel.$lt;
        if (valueSel.$lte !== undefined) return cf.value <= valueSel.$lte;
      }
      if (valueSel instanceof RegExp) return valueSel.test(cf.value);
      return cf.value === valueSel;
    });
  }
  return false;
}

test('fire/no-fire: a card only matches once its custom field crosses into the filter', async () => {
  const { advancedFilterStringToSelector } = await loadShared();
  const resolvers = {
    fieldNameToId: () => 'cf-points',
    fieldValueToId: (field, value) => value,
    customFieldDateSelector: () => null,
  };
  const selector = advancedFilterStringToSelector('Points >= 5', resolvers);

  const before = { customFields: [{ _id: 'cf-points', value: 3 }] };
  const after = { customFields: [{ _id: 'cf-points', value: 5 }] };
  assert.equal(matchesSelector(selector, before), false, 'below the threshold does not match');
  assert.equal(matchesSelector(selector, after), true, 'at/above the threshold matches');
});

(async () => {
  for (const [name, fn] of tests) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await fn();
      passed++;
      console.log(`  ok - ${name}`);
    } catch (e) {
      console.error(`  FAIL - ${name}`);
      console.error(`    ${e.message}`);
      process.exitCode = 1;
    }
  }
  console.log(`ruleAdvancedFilterTrigger: ${passed}/${tests.length} passed`);
  if (passed !== tests.length) process.exit(1);
})();
