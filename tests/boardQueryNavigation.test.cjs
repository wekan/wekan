"use strict";
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../config/router.js'), 'utf8');
const start = source.indexOf("FlowRouter.route('/b/:id/:slug', {");
const end = source.indexOf("\nFlowRouter.route('/shortcuts'", start);
const routeSource = source.slice(start, end);
function navigate(previousBoard, previousPath, currentPath, id) {
  const state = { currentBoard: previousBoard };
  let action, renders = 0, resets = 0;
  const context = {
    previousPath,
    Session: { get: key => state[key], set: (key, value) => { state[key] = value; } },
    FlowRouter: { route: (_, options) => { action = options.action; }, current: () => ({ path: currentPath }) },
    EscapeActions: { executeAll() {}, executeUpTo() {} },
    Filter: { resetBoardScoped() { resets++; } },
    Utils: { manageCustomUI() {}, manageMatomo() {} },
  };
  vm.runInNewContext(routeSource, context);
  action.call({ render(layout, data) {
    assert.equal(layout, 'defaultLayout'); assert.equal(data.content, 'board'); renders++;
  } }, { id });
  return { renders, resets, state };
}
assert.equal(navigate('a', '/b/a/board', '/b/a/board?label=Green', 'a').renders, 0);
assert.equal(navigate('a', '/b/a/board?label=Green', '/b/a/board', 'a').renders, 0);
assert.equal(navigate('a', '/b/a/board?label=Green', '/b/a/board?assignee=user', 'a').resets, 0);
assert.equal(navigate(undefined, undefined, '/b/a/board', 'a').renders, 1);
assert.equal(navigate('a', '/b/a/board/rules', '/b/a/board', 'a').renders, 1);
assert.equal(navigate('a', '/b/a/board/card', '/b/a/board', 'a').renders, 1);
assert.equal(navigate('a', '/b/a/old-slug', '/b/a/new-slug', 'a').renders, 1);
const other = navigate('a', '/b/a/board?label=Green', '/b/b/board', 'b');
assert.equal(other.renders, 1); assert.equal(other.resets, 1); assert.equal(other.state.currentBoard, 'b');
console.log('board query navigation: 8 passed');
