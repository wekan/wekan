'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'client/components/sidebar/sidebarFilters.js'), 'utf8');
const handlers = {};
const calls = [];
const context = {
  Template: new Proxy({ currentData: () => ({ _id: 'surrounding-template' }) }, { get(target, key) {
    return target[key] || { events: events => { handlers[key] = events; } };
  } }),
  mutateSelectedCards: async (...args) => { calls.push(args); },
  mapSelection: (kind, id) => { assert.equal(id, 'target'); return [false, false]; },
  Popup: { open: () => () => {}, back: () => calls.push(['back']) },
};
vm.runInNewContext(source.slice(source.indexOf('Template.multiselectionSidebar.events'), source.indexOf('// The four selects')), context);
const event = detail => ({ detail, preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; } });
(async () => {
  for (const [template, selector, mutation] of [
    ['disambiguateMultiLabelPopup', 'click .js-add-selection-label', 'addLabel'],
    ['disambiguateMultiLabelPopup', 'click .js-remove-selection-label', 'removeLabel'],
    ['disambiguateMultiMemberPopup', 'click .js-assign-member', 'assignMember'],
    ['disambiguateMultiMemberPopup', 'click .js-unassign-member', 'unassignMember'],
  ]) {
    calls.length = 0;
    const evt = event(1);
    await handlers[template][selector].call({ _id: 'target' }, evt);
    assert.deepEqual(calls, [[mutation, 'target'], ['back']]);
    assert.ok(evt.prevented && evt.stopped);
  }
  for (const selector of ['click .js-toggle-label-multiselection', 'click .js-toggle-member-multiselection']) {
    calls.length = 0;
    await handlers.multiselectionSidebar[selector].call({ _id: 'target' }, event(2));
    assert.deepEqual(calls, [], 'second click must not reverse the first');
    await handlers.multiselectionSidebar[selector].call({ _id: 'target' }, event(1));
    assert.equal(calls.length, 1);
  }
  const jade = fs.readFileSync(path.join(root, 'client/components/sidebar/sidebarFilters.jade'), 'utf8');
  const popup = jade.slice(jade.indexOf('template(name="disambiguateMultiLabelPopup")'), jade.indexOf('template(name="disambiguateMultiMemberPopup")'));
  assert.match(popup, /button.wide.js-add-selection-label/);
  assert.doesNotMatch(popup, /button.wide.js-add-label\b/);
  console.log('Multi-selection labels/members: action direction, popup wiring, propagation and repeated clicks verified');
})().catch(error => { console.error(error); process.exitCode = 1; });
