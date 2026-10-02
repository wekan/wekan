// Source-side coverage for the parsers in models/lib/externalParsers.js.
// Unknown objects are reported at their first unmapped path, without traversing
// or copying their values. Known containers (for example Jira time tracking)
// are inspected so unused siblings cannot hide beside one mapped field.
const WRITABLE_FIELDS = new Set(['title', 'description', 'spentTime', 'estimate', 'originalEstimate', 'remainingEstimate']);
const mapped = (target, converted = false) => ({ target, converted });
const unusedFallback = { reason: 'fallback' };
const present = value => value !== undefined && value !== null && value !== '' &&
  (!Array.isArray(value) || value.length > 0);

function issueRules(type, issue, estimateMapping, timeMappings) {
  if (type === 'jira') {
    const fields = issue.fields || {};
    const timeRules = {}, trackingRules = { timeSpentSeconds: mapped('spentTime', true) };
    for (const [field, mapping] of Object.entries(timeMappings)) {
      timeRules[mapping.flat] = Object.hasOwn(fields.timetracking || {}, mapping.nested) ? unusedFallback : mapped(field, true);
      trackingRules[mapping.nested] = mapped(field, true);
    }
    return { key: mapped('externalId'), fields: {
      ...(estimateMapping ? { [estimateMapping.estimateFieldId]: mapped('estimate') } : {}),
      summary: mapped('title'),
      description: mapped('description', typeof fields.description === 'object'),
      status: mapped('column_name'), labels: mapped('tags'), duedate: mapped('date_due'),
      assignee: mapped('owner_username'), reporter: mapped('requested_by'),
      timespent: fields.timetracking?.timeSpentSeconds == null ? mapped('spentTime', true) : unusedFallback,
      ...timeRules, timetracking: trackingRules,
    } };
  }
  if (type === 'gitlab') {
    // #2698: everything parseGitlab now carries. `epic` stays unmapped (group
    // level) and is reported by the parser's own loss report too.
    return { iid: mapped('externalId'), id: issue.iid == null ? mapped('externalId') : unusedFallback,
      title: mapped('title'), description: mapped('description'), state: mapped('column_name'),
      due_date: mapped('date_due'), milestone: mapped('tags'), iteration: mapped('tags'),
      issue_type: mapped('tags'), confidential: mapped('tags'),
      assignee: Array.isArray(issue.assignees) && issue.assignees.length ? unusedFallback : mapped('owner_username'),
      assignees: mapped('owner_username'), author: mapped('requested_by'), labels: mapped('tags'),
      references: mapped('description', true), web_url: mapped('description', true),
      created_at: mapped('date_creation'), closed_at: mapped('date_end'),
      // The estimate Sync reads, when one is mapped (models/lib/listSyncEstimate.js).
      weight: estimateMapping?.estimateFieldId === 'weight' ? mapped('estimate') : mapped('custom_fields'),
      time_stats: estimateMapping?.estimateFieldId === 'time_estimate' ? mapped('estimate', true)
        : mapped('custom_fields', true),
      task_completion_status: mapped('custom_fields', true), notes: mapped('comments', true),
      user_notes_count: issue.notes ? unusedFallback : mapped('unsupported'), links: mapped('dependencies', true) };
  }
  // GitHub, Gitea and Forgejo all use parseIssuesArray.
  return { number: mapped('externalId'), id: issue.number == null ? mapped('externalId') : unusedFallback,
    title: mapped('title'), body: mapped('description'),
    description: issue.body ? unusedFallback : mapped('description'),
    html_url: mapped('description', true), url: issue.html_url ? unusedFallback : mapped('description', true),
    comments_data: mapped('description', true),
    state: mapped('column_name'), state_reason: mapped('tags'), labels: mapped('tags'),
    assignee: mapped('owner_username'), assignees: mapped('tags'),
    user: mapped('requested_by'), author: mapped('requested_by'),
    milestone: mapped('tags'), due_date: mapped('date_due') };
}

function describeSyncSourceCoverage(type, raw, fields, estimateMapping = null, timeMappings = {}) {
  if (!['jira', 'github', 'gitlab', 'gitea', 'forgejo'].includes(type)) throw new Error('Unsupported Sync coverage source.');
  const selected = new Set(fields === undefined ? ['title', 'description'] : fields);
  const rows = new Map();
  let occurrences = 0, omittedOccurrences = 0, excludedItems = 0, shortenedPaths = false;
  const add = (path, reason, target) => {
    occurrences++;
    const key = `${reason}:${target || ''}:${path}`;
    let row = rows.get(key);
    if (!row) {
      if (rows.size >= 100) { omittedOccurrences++; return; }
      row = { path, reason, ...(target ? { target } : {}), count: 0 };
      rows.set(key, row);
    }
    row.count++;
  };
  const childPath = (parent, key) => {
    // Bound strings before escaping, too. An arbitrary source key must not
    // expand the diagnostic payload without limit. JSON Pointer escaping
    // distinguishes literal slashes/tildes from container boundaries.
    if (key.length > 80) shortenedPaths = true;
    return `${parent}/${key.slice(0, 80).replace(/~/g, '~0').replace(/\//g, '~1')}${key.length > 80 ? '…' : ''}`;
  };
  const inspect = (value, rules, parent) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      if (present(value)) add(parent, 'unmapped');
      return;
    }
    for (const key of Object.keys(value)) {
      const entry = value[key];
      if (!present(entry)) continue;
      const path = childPath(parent, key);
      const rule = Object.hasOwn(rules, key) ? rules[key] : null;
      if (!rule) { add(path, 'unmapped'); continue; }
      if (rule.reason) { add(path, rule.reason); continue; }
      if (!rule.target) { inspect(entry, rule, path); continue; }
      if (rule.target === 'externalId') continue;
      if (!WRITABLE_FIELDS.has(rule.target)) add(path, 'unmapped', rule.target);
      else if (!selected.has(rule.target)) add(path, 'excluded', rule.target);
      else if (rule.converted) add(path, 'converted', rule.target);
    }
  };
  const issues = Array.isArray(raw) ? raw : raw.issues;
  const issuePath = Array.isArray(raw) ? '/*' : '/issues/*';
  for (const issue of issues) {
    if (['github', 'gitea', 'forgejo'].includes(type) && issue.pull_request) {
      excludedItems++;
      add(issuePath, 'excluded-item');
      continue;
    }
    inspect(issue, issueRules(type, issue, estimateMapping, timeMappings), issuePath);
  }
  if (!Array.isArray(raw)) {
    // Pagination counters/tokens are transport state, not issue data. Other
    // envelope extensions remain visible in the report.
    const envelope = { issues: mapped('externalId'), startAt: mapped('externalId'),
      maxResults: mapped('externalId'), total: mapped('externalId'), isLast: mapped('externalId'),
      nextPageToken: mapped('externalId'), board: { name: mapped('board.name') } };
    inspect(raw, envelope, '');
  }
  return { rows: [...rows.values()].sort((a, b) => a.path.localeCompare(b.path) || a.reason.localeCompare(b.reason)),
    occurrences, omittedOccurrences, excludedItems, sourceItems: issues.length,
    truncated: omittedOccurrences > 0 || shortenedPaths };
}
module.exports = { describeSyncSourceCoverage };
