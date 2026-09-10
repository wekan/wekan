// #4540: let a board's filter state be driven by URL query parameters, e.g.
// `?assignee=johndoe&member=janedoe&label=urgent`, so a link (for instance
// embedded in an iframe) opens the board already filtered. Kept as pure
// functions (no Meteor/Tracker/DOM access) so they can be unit tested and
// reused from the board route without depending on subscriptions being ready.

// Splits a query param value such as "johndoe,janedoe" (also accepting
// repeated whitespace) into a trimmed, de-duplicated, non-empty list.
export function parseListParam(paramValue) {
  if (!paramValue || typeof paramValue !== 'string') {
    return [];
  }
  const seen = new Set();
  const result = [];
  paramValue
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)
    .forEach(part => {
      if (!seen.has(part)) {
        seen.add(part);
        result.push(part);
      }
    });
  return result;
}

// Resolves a list of usernames to user `_id`s using the provided list of user
// documents ({ _id, username }). Unknown usernames are silently dropped so a
// typo in the URL never throws - it just filters to nothing extra.
export function resolveUsernamesToIds(usernames, users) {
  const byUsername = new Map(
    (users || [])
      .filter(user => user && user.username)
      .map(user => [user.username, user._id]),
  );
  return (usernames || [])
    .map(username => byUsername.get(username))
    .filter(Boolean);
}

// Resolves a list of label names (case-insensitive) to label `_id`s using the
// board's own labels array ({ _id, name, color }).
export function resolveLabelNamesToIds(labelNames, labels) {
  const byName = new Map(
    (labels || [])
      .filter(label => label && label.name)
      .map(label => [label.name.toLowerCase(), label._id]),
  );
  return (labelNames || [])
    .map(name => byName.get(String(name).toLowerCase()))
    .filter(Boolean);
}

// #319: the inverse of the parsing below - given the *ids* the `Filter`
// sidebar currently holds, resolves them back to the usernames/label names
// the query-param vocabulary uses, so an interactively filtered board can
// write its own bookmarkable/shareable URL. Kept alongside the parser so the
// two directions can never drift into different token formats.
export function resolveIdsToUsernames(ids, users) {
  const byId = new Map(
    (users || [])
      .filter(user => user && user._id)
      .map(user => [user._id, user.username]),
  );
  return (ids || []).map(id => byId.get(id)).filter(Boolean);
}

export function resolveIdsToLabelNames(ids, labels) {
  const byId = new Map(
    (labels || [])
      .filter(label => label && label._id)
      .map(label => [label._id, label.name]),
  );
  return (ids || []).map(id => byId.get(id)).filter(Boolean);
}

// Builds the `{ assignee, member, label }` query-param object (comma-joined,
// same vocabulary `parseBoardFilterQueryParams` reads) from the board
// filter's current id-based state. `assigneeIds`/`memberIds`/`labelIds` come
// from `Filter.assignees.list()` / `Filter.members.list()` /
// `Filter.labelIds.list()`; `users`/`labels` resolve them back to names. A
// param whose list is empty is set to `null` so the caller can pass the
// result straight to `FlowRouter.setQueryParams`, which removes any key
// whose value is `null`/`undefined`.
export function buildBoardFilterQueryParams(
  { assigneeIds, memberIds, labelIds },
  users,
  labels,
) {
  const assigneeUsernames = resolveIdsToUsernames(assigneeIds, users);
  const memberUsernames = resolveIdsToUsernames(memberIds, users);
  const labelNames = resolveIdsToLabelNames(labelIds, labels);

  return {
    assignee: assigneeUsernames.length ? assigneeUsernames.join(',') : null,
    member: memberUsernames.length ? memberUsernames.join(',') : null,
    label: labelNames.length ? labelNames.join(',') : null,
  };
}

// Parses the supported board-filter query params into the shape the `Filter`
// object needs: arrays of member ids, assignee ids and label ids. `queryParams`
// is a plain object such as `{ assignee: 'johndoe', member: 'a,b', label: 'x' }`
// (as returned by FlowRouter.getQueryParam for each key), `users` is the list
// of candidate user docs ({ _id, username }) and `labels` is the board's
// labels array ({ _id, name, color }).
export function parseBoardFilterQueryParams(queryParams, users, labels) {
  const assigneeUsernames = parseListParam(queryParams && queryParams.assignee);
  const memberUsernames = parseListParam(queryParams && queryParams.member);
  const labelNames = parseListParam(queryParams && queryParams.label);

  return {
    assigneeIds: resolveUsernamesToIds(assigneeUsernames, users),
    memberIds: resolveUsernamesToIds(memberUsernames, users),
    labelIds: resolveLabelNamesToIds(labelNames, labels),
  };
}
