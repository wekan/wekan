'use strict';

// #4540: a board's filter state can be driven by URL query params, e.g.
// `?assignee=johndoe&member=janedoe&label=urgent`. This pins the pure
// param-parsing/resolution logic in client/lib/filterQueryParams.js, which
// client/components/boards/boardBody.js wires into the existing `Filter`
// object once the board is ready.

const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

(async () => {
  const modUrl = pathToFileURL(
    path.join(__dirname, '..', 'client', 'lib', 'filterQueryParams.js'),
  ).href;
  const {
    parseListParam,
    resolveUsernamesToIds,
    resolveLabelNamesToIds,
    parseBoardFilterQueryParams,
  } = await import(modUrl);

  // parseListParam: splits, trims, drops empties, de-duplicates.
  assert.deepEqual(parseListParam('johndoe'), ['johndoe']);
  assert.deepEqual(parseListParam(' johndoe , janedoe ,,johndoe'), [
    'johndoe',
    'janedoe',
  ]);
  assert.deepEqual(parseListParam(''), []);
  assert.deepEqual(parseListParam(undefined), []);
  assert.deepEqual(parseListParam(null), []);

  // resolveUsernamesToIds: matches by username, silently drops unknowns.
  const users = [
    { _id: 'u1', username: 'johndoe' },
    { _id: 'u2', username: 'janedoe' },
  ];
  assert.deepEqual(resolveUsernamesToIds(['johndoe', 'janedoe'], users), [
    'u1',
    'u2',
  ]);
  assert.deepEqual(resolveUsernamesToIds(['johndoe', 'nobody'], users), [
    'u1',
  ]);
  assert.deepEqual(resolveUsernamesToIds([], users), []);
  assert.deepEqual(resolveUsernamesToIds(['johndoe'], []), []);

  // resolveLabelNamesToIds: matches by name, case-insensitively.
  const labels = [
    { _id: 'l1', name: 'Urgent', color: 'red' },
    { _id: 'l2', name: 'Later', color: 'blue' },
  ];
  assert.deepEqual(resolveLabelNamesToIds(['urgent'], labels), ['l1']);
  assert.deepEqual(resolveLabelNamesToIds(['URGENT', 'later'], labels), [
    'l1',
    'l2',
  ]);
  assert.deepEqual(resolveLabelNamesToIds(['missing'], labels), []);

  // parseBoardFilterQueryParams: the end-to-end shape Filter needs.
  const result = parseBoardFilterQueryParams(
    { assignee: 'johndoe', member: 'janedoe,johndoe', label: 'Urgent' },
    users,
    labels,
  );
  assert.deepEqual(result.assigneeIds, ['u1']);
  assert.deepEqual(result.memberIds, ['u2', 'u1']);
  assert.deepEqual(result.labelIds, ['l1']);

  // Missing/empty query params resolve to empty arrays, never throw.
  const empty = parseBoardFilterQueryParams({}, users, labels);
  assert.deepEqual(empty, { assigneeIds: [], memberIds: [], labelIds: [] });
  const emptyNoArgs = parseBoardFilterQueryParams(undefined, undefined, undefined);
  assert.deepEqual(emptyNoArgs, {
    assigneeIds: [],
    memberIds: [],
    labelIds: [],
  });

  // boardBody.js must actually wire this into the existing Filter object
  // rather than a new filtering engine, and must apply it once the board's
  // subscription is ready (not eagerly in the route, before members/labels
  // are loaded).
  const fs = require('node:fs');
  const boardBody = fs.readFileSync(
    path.join(__dirname, '..', 'client', 'components', 'boards', 'boardBody.js'),
    'utf8',
  );
  assert.match(
    boardBody,
    /import \{ parseBoardFilterQueryParams \} from '\/client\/lib\/filterQueryParams';/,
    'boardBody.js must import the pure param-parsing helper',
  );
  assert.match(
    boardBody,
    /applyQueryParamFilters = \(boardId\) => \{/,
    'boardBody.js must define applyQueryParamFilters',
  );
  assert.match(
    boardBody,
    /Filter\.assignees\.add\(id\)/,
    'resolved assignee ids must be applied through the existing Filter.assignees API',
  );
  assert.match(
    boardBody,
    /Filter\.members\.add\(id\)/,
    'resolved member ids must be applied through the existing Filter.members API',
  );
  assert.match(
    boardBody,
    /Filter\.labelIds\.add\(id\)/,
    'resolved label ids must be applied through the existing Filter.labelIds API',
  );
  assert.match(
    boardBody,
    /Tracker\.nonreactive\(\(\) => this\.applyQueryParamFilters\(currentBoardId\)\);/,
    'the filters must be applied once the board subscription is ready, guarded like the other once-per-board hooks',
  );

  console.log('filterQueryParams4540: URL query param filter parsing passed');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
