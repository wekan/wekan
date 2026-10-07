"use strict";
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { mountedBoardAfterEnter, mustRenderBoardLayout } = require('../models/lib/boardLayoutMount.js');
const source = fs.readFileSync(path.join(__dirname, '../config/router.js'), 'utf8');
const start = source.indexOf("FlowRouter.route('/b/:id/:slug', {");
const end = source.indexOf("\nFlowRouter.route('/shortcuts'", start);
const routeSource = source.slice(start, end);
const helperStart = source.indexOf('function renderBoardLayout(ctx, boardId, routeName) {');
const helperSource = source.slice(helperStart, source.indexOf('\n}\n', helperStart) + 2);
// #6745: whether the board is re-rendered no longer depends on the previous
// PATH but on which board the layout is mounted for (models/lib/boardLayoutMount.js):
// the route that was left decides it, through FlowRouter.triggers.enter.
// `previousRoute` is that route's name, or undefined on a first page load.
function navigate(previousBoard, previousRoute, id) {
  const state = { currentBoard: previousBoard };
  let action, renders = 0, resets = 0;
  const context = {
    mustRenderBoardLayout,
    mountedBoardId: previousRoute ? mountedBoardAfterEnter(previousBoard, previousRoute) : null,
    Session: { get: key => state[key], set: (key, value) => { state[key] = value; } },
    FlowRouter: { route: (_, options) => { action = options.action; }, current: () => ({ path: `/b/${id}/board` }) },
    EscapeActions: { executeAll() {}, executeUpTo() {} },
    Filter: { resetBoardScoped() { resets++; } },
    Utils: { manageCustomUI() {}, manageMatomo() {} },
  };
  vm.runInNewContext(`${helperSource}\n${routeSource}`, context);
  // Entering the board route itself keeps whatever was mounted.
  context.mountedBoardId = mountedBoardAfterEnter(context.mountedBoardId, 'board');
  action.call({ render(layout, data) {
    assert.equal(layout, 'defaultLayout'); assert.equal(data.content, 'board'); renders++;
  } }, { id });
  return { renders, resets, state, mounted: context.mountedBoardId };
}
// setQueryParams reruns the route on the same board: no re-render, filters kept.
assert.equal(navigate('a', 'board', 'a').renders, 0);
assert.equal(navigate('a', 'board', 'a').resets, 0);
// First load renders.
assert.equal(navigate(undefined, undefined, 'a').renders, 1);
// Coming back from a page that is not the board (rules) renders.
assert.equal(navigate('a', 'rules', 'a').renders, 1);
// #6745: closing a card goes card -> board on the SAME board. This used to
// render (every minicard re-created, seconds on a large board); the board on
// screen is now kept, and closing follows Session like opening does.
assert.equal(navigate('a', 'card', 'a').renders, 0);
// A renamed board (old slug -> new slug) is still the same mounted board.
assert.equal(navigate('a', 'board', 'a').mounted, 'a');
const other = navigate('a', 'board', 'b');
assert.equal(other.renders, 1); assert.equal(other.resets, 1); assert.equal(other.state.currentBoard, 'b');
assert.equal(other.mounted, 'b');
console.log('board query navigation: 9 passed');
