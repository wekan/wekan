'use strict';

// The one-line summary of what an import could not bring over, for Admin
// Panel -> Problems -> Recovery (docs/Features/ImportExport/Format-Coverage.md:
// "a success with unsupported fields is completed-with-warnings, not silently
// completed"). Parsers and planners return { path, reason } entries; this
// bounds them so a huge source cannot grow one recovery row without limit.
// Paths and reasons never carry source VALUES, only locations and counts.

export const IMPORT_WARNINGS_EVENT = 'import-completed-with-warnings';
const MAX_LISTED = 20;
const MAX_TEXT = 200;

function clip(value) {
  const text = String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  return text.length > MAX_TEXT ? `${text.slice(0, MAX_TEXT - 1)}…` : text;
}

export function importLossReport({ source, warnings = [], unsupported = [] } = {}) {
  const entries = []
    .concat((Array.isArray(unsupported) ? unsupported : []).map(e => ({ kind: 'not imported', ...e })))
    .concat((Array.isArray(warnings) ? warnings : []).map(e => ({ kind: 'warning', ...e })))
    .filter(e => e && (e.path || e.reason));
  if (!entries.length) return null;
  const notImported = entries.filter(e => e.kind === 'not imported').length;
  const listed = entries.slice(0, MAX_LISTED).map(e => `${clip(e.path)} ${clip(e.reason)}`.trim());
  const more = entries.length - listed.length;
  const detail = `${clip(source || 'import')}: ${notImported} not imported, ${entries.length - notImported} warning(s). `
    + listed.join('; ') + (more > 0 ? `; and ${more} more` : '');
  return { type: IMPORT_WARNINGS_EVENT, severity: 'warning', detail, count: entries.length };
}
