const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const source = fs.readFileSync('client/components/gantt/frappeGantt.js', 'utf8');
const body = source.slice(source.indexOf('function translateFrappeChrome('), source.indexOf('Template.frappeGanttView.onCreated'));
for (const translated of [false, true]) {
  test(`Frappe chrome observer settles without a mutation loop (translated=${translated})`, () => {
    let mutations = 0;
    let callback;
    const node = text => ({
      get textContent() { return text; },
      set textContent(value) { text = value; mutations++; },
    });
    const today = node('Today');
    const mode = node('Mode');
    const container = { querySelector: selector => selector === '.today-button' ? today : mode };
    const instance = {};
    class Observer {
      constructor(fn) { callback = fn; }
      observe() {}
    }
    const apply = new Function('TAPi18n', 'MutationObserver', `${body}; return translateFrappeChrome;`)(
      { __: key => translated ? (key === 'today' ? 'Tänään' : 'Tila') : (key === 'today' ? 'Today' : 'Mode') }, Observer);
    apply(container, instance);
    assert.equal(mutations, translated ? 2 : 0);
    const first = mutations;
    for (let i = 0; i < 10; i++) callback();
    assert.equal(mutations, first, 'observer must not write identical text');
    assert.equal(today.textContent, translated ? 'Tänään' : 'Today');
    assert.match(source, /chromeObserver\.disconnect\(\)/);
  });
}
