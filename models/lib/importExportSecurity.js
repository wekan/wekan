// Server-side helpers for the Admin Panel / Features / Security import/export
// options:
//   - disableExportAvatars / disableImportAvatars: never carry avatars (user
//     profile pictures) out of / into WeKan.
//   - anonymizeExportUsers / anonymizeImportUsers: replace user identity fields
//     (username, fullname, initials) with counter placeholders (user1, user2, ...)
//     as a board is exported / imported, and rewrite @username mentions inside
//     card and comment text so no real identity remains.
//
// The placeholder word ("user") is translatable, so a Finnish user gets
// "käyttäjä1", "käyttäjä2", etc.

// Read the import/export security settings once. Server-side only.
export async function getImportExportSecuritySettings() {
  const Settings = require('/models/settings').default;
  const s = (await Settings.findOneAsync({})) || {};
  return {
    disableAllExport: !!s.disableAllExport,
    disableAllImport: !!s.disableAllImport,
    disableExportAvatars: !!s.disableExportAvatars,
    disableImportAvatars: !!s.disableImportAvatars,
    anonymizeExportUsers: !!s.anonymizeExportUsers,
    anonymizeImportUsers: !!s.anonymizeImportUsers,
  };
}

// An export asked for while the admin has disabled all export: the menus are
// hidden then, so it is recorded in Admin Panel / Problems (never costing the
// account - see the catalog key). CrossBoardExportBleed (GHSA-8885-xrq4-j47h).
function recordDisabledExport(source) {
  try {
    require('/server/lib/securityLog').record({ key: 'authz.export-disabled', action: 'blocked',
      source, detail: 'export while all export is disabled' });
  } catch (e) { /* logging must never break the guard */ }
}

// Throw if the admin has disabled ALL export. Call at every export entry point.
export async function assertExportEnabled(source = 'export') {
  const Settings = require('/models/settings').default;
  const s = (await Settings.findOneAsync({})) || {};
  if (s.disableAllExport) {
    recordDisabledExport(source);
    const { Meteor } = require('meteor/meteor');
    throw new Meteor.Error('export-disabled', 'Export is disabled by the administrator.');
  }
}

// The same switch for an HTTP export route, answered before anything is
// written: true when export is disabled and the 403 has been sent. Every export
// route calls it first - the streaming CSV/TSV, Excel, PDF, chart, calendar
// and external-format exporters did not ask at all, so "Disable all export"
// left them working (CrossBoardExportBleed). tests/exportDisabledEverywhere
// fails on an export route that does not call it.
export async function refuseDisabledExport(res, source = 'export') {
  const s = await getImportExportSecuritySettings();
  if (!s.disableAllExport) return false;
  recordDisabledExport(source);
  if (!res.headersSent) res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Export is disabled by the administrator.');
  return true;
}

// Throw if the admin has disabled ALL import. Call at every import entry point.
export async function assertImportEnabled() {
  const Settings = require('/models/settings').default;
  const s = (await Settings.findOneAsync({})) || {};
  if (s.disableAllImport) {
    const { Meteor } = require('meteor/meteor');
    throw new Meteor.Error('import-disabled', 'Import is disabled by the administrator.');
  }
}

// The translated word used as the anonymized username prefix ("user" -> user1;
// "käyttäjä" -> käyttäjä1). Falls back to "user" for any lookup problem.
export function anonymizedUserWord(language) {
  try {
    const { TAPi18n } = require('/imports/i18n');
    const w = TAPi18n.__('anonymized-user', {}, language || 'en');
    if (typeof w === 'string' && w.trim()) return w.trim();
  } catch (e) {
    /* fall through to default */
  }
  return 'user';
}

// Build a deterministic anonymization map from a list of user docs
// ({ _id, username }). Indices are assigned in _id order, so the same board
// always produces the same labels and export/import stay consistent.
// Returns { byId: Map(userId -> {username, fullname, initials}),
//           byUsername: Map(oldUsername -> newUsername) }.
export function buildUserAnonymizationMap(users, userWord) {
  const word = userWord || 'user';
  const initialChar = (word.charAt(0) || 'u').toUpperCase();
  const byId = new Map();
  const byUsername = new Map();
  (users || [])
    .filter(u => u && u._id)
    .slice()
    .sort((a, b) => {
      const x = String(a._id);
      const y = String(b._id);
      return x < y ? -1 : x > y ? 1 : 0;
    })
    .forEach((u, idx) => {
      const n = idx + 1;
      const label = `${word}${n}`;
      byId.set(String(u._id), {
        username: label,
        fullname: label,
        initials: `${initialChar}${n}`,
      });
      if (u.username) byUsername.set(u.username, label);
    });
  return { byId, byUsername };
}

// Replace one user doc's identity fields in place with its anonymized label.
// Also drops every avatar field: an avatar identifies the person, so a truly
// anonymized user carries none.
export function anonymizeUserDoc(user, map) {
  if (!user || !user._id) return user;
  const a = map.byId.get(String(user._id));
  if (!a) return user;
  user.username = a.username;
  user.profile = user.profile || {};
  user.profile.fullname = a.fullname;
  user.profile.initials = a.initials;
  delete user.profile.avatarUrl;
  delete user.profile.avatarFile;
  delete user.profile.avatarFileName;
  delete user.profile.avatarFileType;
  return user;
}

// Rewrite @username mentions inside free text to the anonymized labels. Only
// known usernames are rewritten; an @ that is not a known member is left as-is.
// The leading (^|[^\w@]) guard keeps email-like "a@b" text from matching.
export function rewriteMentionsInText(text, byUsername) {
  if (typeof text !== 'string' || !text || !byUsername || byUsername.size === 0) {
    return text;
  }
  return text.replace(/(^|[^\w@])@([\w.-]+)/g, (full, pre, name) => {
    const repl = byUsername.get(name);
    return repl ? `${pre}@${repl}` : full;
  });
}

// A free-text identity value (e.g. card.requestedBy / assignedBy) is anonymized
// only when it exactly matches a known username.
export function anonymizeIdentityValue(value, byUsername) {
  if (typeof value === 'string' && byUsername && byUsername.has(value)) {
    return byUsername.get(value);
  }
  return value;
}

// Apply mention/identity rewriting to a board's card + comment text arrays in
// place, using an already-built byUsername map. Shared by export (build()) and
// import so both scrub the same free-text fields.
export function anonymizeBoardTextInPlace(board, byUsername) {
  if (!board) return;
  // ReactiveCache board documents also expose cards()/swimlanes() helpers.
  // Only exported arrays are data; never invoke collection helpers here.
  const dataRows = value => Array.isArray(value) ? value : [];
  const rewriteFields = (value, fields) => {
    if (!value || typeof value !== 'object') return;
    for (const key of fields) {
      if (typeof value[key] === 'string') value[key] = rewriteMentionsInText(value[key], byUsername);
    }
  };
  const scrumText = data => {
    if (!data) return;
    rewriteFields(data.scrum || data.settings, ['productGoal', 'definitionOfDone']);
    for (const card of dataRows(data.cards)) rewriteFields(card?.scrum, ['issueType', 'acceptanceCriteria']);
    for (const lane of dataRows(data.swimlanes)) rewriteFields(lane?.scrum, ['purpose']);
    for (const key of ['sprints', 'releases', 'events']) {
      for (const record of dataRows(data[key])) rewriteFields(record, ['name', 'goal', 'notes', 'cancellationReason']);
    }
  };
  // Explicit prose fields only: IDs, source provenance, estimate units and
  // snapshots must keep their meaning and references during anonymization.
  scrumText(board);
  scrumText(board.scrumTransfer);
  dataRows(board.cards).forEach(card => {
    if (!card) return;
    card.title = rewriteMentionsInText(card.title, byUsername);
    card.description = rewriteMentionsInText(card.description, byUsername);
    card.requestedBy = anonymizeIdentityValue(card.requestedBy, byUsername);
    card.assignedBy = anonymizeIdentityValue(card.assignedBy, byUsername);
  });
  dataRows(board.comments).forEach(comment => {
    if (comment) comment.text = rewriteMentionsInText(comment.text, byUsername);
  });
}

// Anonymize what one exporter is about to write, when Admin Panel says so:
// the user docs it will name (username, full name, initials, avatar) and the
// @mentions and requested-by / assigned-by text of its cards and comments. The
// map is built as build() builds it - from the exported users and the board's
// members - so a member only mentioned in a title is anonymized too. Returns
// the map, or null when anonymization is off. Every exporter that writes a
// user identity calls it: only build() and buildStream() did, so the CSV/TSV,
// Excel, PDF and external formats carried real names (CrossBoardExportBleed).
export async function anonymizeExportIdentities({ boardId, users = [], cards = [], comments = [], language = 'en' } = {}) {
  const security = await getImportExportSecuritySettings();
  if (!security.anonymizeExportUsers) return null;
  const { ReactiveCache } = require('/imports/reactiveCache');
  const known = new Map();
  for (const u of users) if (u && u._id) known.set(String(u._id), u);
  const board = boardId ? await ReactiveCache.getBoard(boardId) : null;
  const memberIds = ((board && board.members) || []).map(m => m && m.userId)
    .filter(id => id && !known.has(String(id)));
  const members = memberIds.length
    ? await ReactiveCache.getUsers({ _id: { $in: memberIds } }, { fields: { _id: 1, username: 1 } })
    : [];
  const map = buildUserAnonymizationMap([...known.values(), ...members], anonymizedUserWord(language));
  for (const u of known.values()) anonymizeUserDoc(u, map);
  anonymizeBoardTextInPlace({ cards, comments }, map.byUsername);
  return map;
}
