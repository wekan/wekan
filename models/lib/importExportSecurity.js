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

// Throw if the admin has disabled ALL export. Call at every export entry point.
export async function assertExportEnabled() {
  const Settings = require('/models/settings').default;
  const s = (await Settings.findOneAsync({})) || {};
  if (s.disableAllExport) {
    const { Meteor } = require('meteor/meteor');
    throw new Meteor.Error('export-disabled', 'Export is disabled by the administrator.');
  }
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
  (board.cards || []).forEach(card => {
    if (!card) return;
    card.title = rewriteMentionsInText(card.title, byUsername);
    card.description = rewriteMentionsInText(card.description, byUsername);
    card.requestedBy = anonymizeIdentityValue(card.requestedBy, byUsername);
    card.assignedBy = anonymizeIdentityValue(card.assignedBy, byUsername);
  });
  (board.comments || []).forEach(comment => {
    if (comment) comment.text = rewriteMentionsInText(comment.text, byUsername);
  });
}
