'use strict';

// #319: applying a filter should update the URL (e.g. `?assignee=johndoe`) so
// the filtered view can be bookmarked/shared. #4540 already covers the READ
// direction (URL query params -> `Filter` state, on board load, once). This
// pins the WRITE direction added here: the `Filter` state's current
// assignee/member/label ids -> the `?assignee=`/`?member=`/`?label=` query
// params, reusing #4540's exact token vocabulary, plus a round trip through
// #4540's own parser to prove the two directions agree.

const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');

(async () => {
  const modUrl = pathToFileURL(
    path.join(__dirname, '..', 'client', 'lib', 'filterQueryParams.js'),
  ).href;
  const {
    resolveIdsToUsernames,
    resolveIdsToLabelNames,
    buildBoardFilterQueryParams,
    parseBoardFilterQueryParams,
  } = await import(modUrl);

  const users = [
    { _id: 'u1', username: 'johndoe' },
    { _id: 'u2', username: 'janedoe' },
  ];
  const labels = [
    { _id: 'l1', name: 'Urgent', color: 'red' },
    { _id: 'l2', name: 'Later', color: 'blue' },
  ];

  // resolveIdsToUsernames / resolveIdsToLabelNames: the exact inverse of
  // resolveUsernamesToIds / resolveLabelNamesToIds, unknown ids dropped.
  assert.deepEqual(resolveIdsToUsernames(['u1', 'u2'], users), [
    'johndoe',
    'janedoe',
  ]);
  assert.deepEqual(resolveIdsToUsernames(['u1', 'missing'], users), [
    'johndoe',
  ]);
  assert.deepEqual(resolveIdsToUsernames([], users), []);
  assert.deepEqual(resolveIdsToUsernames(['u1'], []), []);

  assert.deepEqual(resolveIdsToLabelNames(['l1', 'l2'], labels), [
    'Urgent',
    'Later',
  ]);
  assert.deepEqual(resolveIdsToLabelNames(['missing'], labels), []);

  // buildBoardFilterQueryParams: given the Filter's current id-based state,
  // produces the comma-joined query-param object.
  const built = buildBoardFilterQueryParams(
    { assigneeIds: ['u1'], memberIds: ['u2', 'u1'], labelIds: ['l1'] },
    users,
    labels,
  );
  assert.deepEqual(built, {
    assignee: 'johndoe',
    member: 'janedoe,johndoe',
    label: 'Urgent',
  });

  // An empty list of ids produces `null` for that param, not `''` or an empty
  // array - `null` is what FlowRouter.setQueryParams treats as "remove this
  // param", so a cleared filter also clears the URL instead of leaving a
  // stale `?assignee=` behind.
  const emptyBuilt = buildBoardFilterQueryParams(
    { assigneeIds: [], memberIds: [], labelIds: [] },
    users,
    labels,
  );
  assert.deepEqual(emptyBuilt, { assignee: null, member: null, label: null });

  // Unknown ids (already removed from the board, say) are silently dropped
  // rather than corrupting the URL.
  const partiallyUnknown = buildBoardFilterQueryParams(
    { assigneeIds: ['u1', 'ghost'], memberIds: [], labelIds: ['ghost-label'] },
    users,
    labels,
  );
  assert.deepEqual(partiallyUnknown, {
    assignee: 'johndoe',
    member: null,
    label: null,
  });

  // Round trip: Filter state -> query-param strings -> re-parsed by #4540's
  // own parseBoardFilterQueryParams -> the same ids back out. This is the
  // property that makes a filtered board genuinely bookmarkable: the URL
  // written by one direction must be understood by the other.
  const original = {
    assigneeIds: ['u1'],
    memberIds: ['u2', 'u1'],
    labelIds: ['l1', 'l2'],
  };
  const asQueryParams = buildBoardFilterQueryParams(original, users, labels);
  const reparsed = parseBoardFilterQueryParams(asQueryParams, users, labels);
  assert.deepEqual(reparsed, original);

  // Round trip also holds for a single-filter and an empty state.
  const singleOriginal = { assigneeIds: ['u2'], memberIds: [], labelIds: [] };
  const singleReparsed = parseBoardFilterQueryParams(
    buildBoardFilterQueryParams(singleOriginal, users, labels),
    users,
    labels,
  );
  assert.deepEqual(singleReparsed, singleOriginal);

  const emptyOriginal = { assigneeIds: [], memberIds: [], labelIds: [] };
  const emptyReparsed = parseBoardFilterQueryParams(
    buildBoardFilterQueryParams(emptyOriginal, users, labels),
    users,
    labels,
  );
  assert.deepEqual(emptyReparsed, emptyOriginal);

  // client/lib/filter.js's SetFilter must expose a reactive list() so
  // boardBody.js can read the current selection to build the query params.
  const filterSrc = fs.readFileSync(
    path.join(__dirname, '..', 'client', 'lib', 'filter.js'),
    'utf8',
  );
  assert.match(
    filterSrc,
    /list\(\)\s*\{\s*this\._dep\.depend\(\);\s*return this\._selectedElements\.slice\(\);/,
    'SetFilter.list() must be reactive (depend on _dep) and return a copy of the selected elements',
  );

  // boardBody.js must wire buildBoardFilterQueryParams into a reactive
  // write-back, reusing FlowRouter.setQueryParams under withReplaceState so
  // toggling a filter never piles up browser-history entries.
  const boardBody = fs.readFileSync(
    path.join(__dirname, '..', 'client', 'components', 'boards', 'boardBody.js'),
    'utf8',
  );
  assert.match(
    boardBody,
    /buildBoardFilterQueryParams,?\s*[\s\S]{0,80}from '\/client\/lib\/filterQueryParams';/,
    'boardBody.js must import buildBoardFilterQueryParams',
  );
  assert.match(
    boardBody,
    /syncFilterQueryParams = \(boardId\) => \{/,
    'boardBody.js must define syncFilterQueryParams',
  );
  assert.match(
    boardBody,
    /Filter\.assignees\.list\(\)/,
    'syncFilterQueryParams must read the current assignee selection reactively via list()',
  );
  assert.match(
    boardBody,
    /Filter\.members\.list\(\)/,
    'syncFilterQueryParams must read the current member selection reactively via list()',
  );
  assert.match(
    boardBody,
    /Filter\.labelIds\.list\(\)/,
    'syncFilterQueryParams must read the current label selection reactively via list()',
  );
  assert.match(
    boardBody,
    /FlowRouter\.withReplaceState\(\(\) => \{\s*FlowRouter\.setQueryParams\(queryParams\);/,
    'syncFilterQueryParams must write the URL via FlowRouter.setQueryParams, wrapped in withReplaceState so it replaces rather than pushes a history entry',
  );
  assert.match(
    boardBody,
    /this\.syncFilterQueryParams\(currentBoardId\);/,
    'syncFilterQueryParams must actually be called from a reactive autorun',
  );

  console.log('filterQueryParams319: URL query param filter write-back + round trip passed');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
