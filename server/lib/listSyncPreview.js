const SYNC_FIELDS = ['title', 'description', 'spentTime', 'estimate', 'originalEstimate', 'remainingEstimate'];
const hasValue = value => value !== undefined && value !== null && value !== '' &&
  (!Array.isArray(value) || value.length > 0);

// Describe the normalized fields actually available to this Sync run. No source
// values or credentials belong in omission diagnostics. Deep provider-specific
// schema auditing is separate from this normalized-field inventory.
function syncCoverage(parsed, source) {
  const selected = new Set(source.fields === undefined ? ['title', 'description'] : source.fields);
  const counts = new Map();
  for (const task of parsed.tasks) {
    for (const [field, value] of Object.entries(task)) {
      if (field === 'externalId' || !hasValue(value)) continue;
      if (SYNC_FIELDS.includes(field) && selected.has(field)) continue;
      const reason = SYNC_FIELDS.includes(field) ? 'excluded' : 'unmapped';
      const key = `${reason}:${field}`;
      const row = counts.get(key) || { field: field.slice(0, 200), reason, count: 0 };
      row.count++;
      counts.set(key, row);
    }
  }
  const rows = [...counts.values()].sort((a, b) => a.field.localeCompare(b.field));
  return { rows: rows.slice(0, 100), fields: rows.length,
    truncated: rows.length > 100,
    parserWarnings: Array.isArray(parsed.warnings) ? parsed.warnings.length : 0,
    parserUnsupported: Array.isArray(parsed.unsupported) ? parsed.unsupported.length : 0 };
}

function prepareSyncWrites(plan, baselines) {
  if (!plan) return;
  // Status is not a list move in the current implementation. Do not count a
  // status-only diff as a database update in either the preview or actual run.
  plan.toUpdate = plan.toUpdate.map(({ cardId, changes }) => {
    const { column_name, ...applied } = changes;
    return { cardId, changes: applied };
  }).filter(row => Object.keys(row.changes).length);
  const updates = new Map(plan.toUpdate.map(row => [row.cardId, row]));
  for (const [cardId, baseline] of baselines) {
    let update = updates.get(cardId);
    if (!update) { update = { cardId, changes: {} }; plan.toUpdate.push(update); }
    update.changes.syncLastSource = baseline;
  }
}

function describeSyncPreview({ plan, cards, coverage, blocked }) {
  const summary = { blocked, coverage, items: [], total: 0, truncated: false };
  if (blocked || !plan) return summary;
  const byId = new Map(cards.map(card => [card._id, card]));
  summary.created = plan.toCreate.length;
  summary.updated = plan.toUpdate.length;
  summary.archived = plan.toArchive.length;
  const append = item => { summary.total++; if (summary.items.length < 100) summary.items.push(item); };
  for (const task of plan.toCreate) append({ action: 'create', externalId: String(task.externalId),
    title: (task.title || 'Imported item').slice(0, 500), fields: SYNC_FIELDS.filter(field => task[field] !== undefined) });
  for (const update of plan.toUpdate) {
    const card = byId.get(update.cardId);
    // A planning change is one item, `scrum`; its revision is bookkeeping.
    append({ action: 'update', externalId: String(card.syncExternalId), title: (card.title || '').slice(0, 500),
      fields: Object.keys(update.changes).filter(field => field !== 'scrumRevision') });
  }
  for (const cardId of plan.toArchive) {
    const card = byId.get(cardId);
    append({ action: 'archive', externalId: String(card.syncExternalId), title: (card.title || '').slice(0, 500), fields: [] });
  }
  summary.truncated = summary.total > summary.items.length;
  return summary;
}
module.exports = { syncCoverage, prepareSyncWrites, describeSyncPreview };
