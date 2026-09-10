const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const jade = fs.readFileSync('client/components/cards/cardDetails.jade', 'utf8');

for (const field of [
  { helper: 'getRequestedBy', selector: 'js-card-details-requester' },
  { helper: 'getAssignedBy', selector: 'js-card-details-assigner' },
]) {
  test(`${field.selector} uses icons with accessible add/edit names`, () => {
    const start = jade.indexOf(`classNames="${field.selector}"`);
    assert.notEqual(start, -1);
    // The block runs to the outer `else` of the surrounding `if canModifyCard`
    // (14-space indent) - not the inner `unless currentUser.isWorker / else`
    // (18-space indent) added for the Worker role, which sits INSIDE this
    // range and would otherwise truncate it before reaching the accessible
    // add/edit icons rendered in the isWorker view branch.
    const end = jade.indexOf('\n              else', start);
    const block = jade.slice(start, end);
    assert.match(block, /title="\{\{#if .*\}\}\{\{_ 'edit'\}\}\{\{else\}\}\{\{_ 'add'\}\}\{\{\/if\}\}"/);
    assert.match(block, /aria-label="\{\{#if .*\}\}\{\{_ 'edit'\}\}\{\{else\}\}\{\{_ 'add'\}\}\{\{\/if\}\}"/);
    assert.match(block, /i\.fa\.fa-pencil-square-o\(aria-hidden="true"\)/);
    assert.match(block, /i\.fa\.fa-plus\(aria-hidden="true"\)/);
    assert.doesNotMatch(block, /^\s*\| \{\{_ 'add'\}\}/m);
  });
}
