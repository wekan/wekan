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
