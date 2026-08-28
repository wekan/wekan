'use strict';

// #6644: a location row is the Blaze data context of its own X button. The
// handler must resolve the surrounding card before invoking the model method.
// Run: node tests/cardLocationRemoval.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const details = fs.readFileSync(
  path.join(root, 'client/components/cards/cardDetails.js'), 'utf8');
const models = fs.readFileSync(path.join(root, 'models/cards.js'), 'utf8');

const at = details.indexOf("async 'click .js-remove-location'(event)");
assert.notStrictEqual(at, -1, 'the location X has an awaited click handler');
const handler = details.slice(at, details.indexOf('\n  },', at));
assert.match(handler, /const card = getCurrentCardFromContext\(\)/,
  'the nested location row resolves its surrounding card');
assert.doesNotMatch(handler, /const card = Template\.currentData\(\)/,
  'the location row itself is never mistaken for the card');
assert.match(handler, /await card\.removeLocation\(locationId\)/,
  'the database removal finishes inside the event boundary');

const methodAt = models.indexOf('async removeLocation(locationId)');
assert.notStrictEqual(methodAt, -1, 'the card model exposes location removal');
const method = models.slice(methodAt, models.indexOf('\n  },', methodAt));
assert.match(method, /\$pull: \{ locations: \{ _id: locationId \} \}/,
  'array locations are removed by their stable id');
assert.match(method, /locationId === 'legacy'/,
  'legacy flat-field locations retain their removal path');

console.log('cardLocationRemoval: 5 tests passed');
