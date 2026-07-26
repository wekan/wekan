// Per-tenant backup and restore — the data half of multitenancy option D
// (docs/Design/Multitenancy/Multitenancy.md).
//
// Admin Panel / Attachments / Backup backs up the whole instance. With
// Organizations as tenants, a per-tenant Global Admin must be able to back up and
// restore THEIR Organization without touching anyone else's, and the site admin
// must be able to do it for any one of them.
//
// WHAT A TENANT BACKUP CONTAINS: the tenant's boards and everything hanging off
// them, plus the attachment and avatar files those boards use. WHAT IT DOES NOT:
//   * accounts — `Meteor.users` is ONE namespace in option D (a user may belong to
//     two tenants), so a tenant archive must not carry password hashes, e-mail
//     addresses or login state out of the instance, and restoring one must never
//     rewrite an account;
//   * the settings singletons — product name, SMTP, lockout policy and the rest are
//     per-INSTANCE, so they belong to the whole-instance backup, not to a tenant's;
//   * the org and team documents themselves — restoring them could resurrect a
//     deleted tenant or rewrite another tenant's membership.
// So a tenant restore can add back boards and their content, and nothing else.
//
// Every decision is pure and dependency-free so it can be unit-tested without a
// Meteor/Mongo runtime (tests/tenantBackup.test.cjs). server/methods/backup.js is
// the only caller; it streams exactly what these functions say and refuses
// everything they refuse.

// ── which collections, and how each is scoped to a tenant ────────────────────
//
// `match` says how a document of that collection is tied to the tenant's boards:
//   ids        — the document IS one of the boards (`_id`)
//   boardId    — a plain `boardId` field
//   boardIds   — an ARRAY of board ids (custom fields belong to several boards)
//   metaBoardId— a Meteor-Files record, board id under `meta.boardId`
//   ruleRef    — reached only through a rule of one of those boards (triggers and
//                actions carry no board of their own)
const TENANT_COLLECTIONS = [
  { name: 'boards', match: 'ids' },
  { name: 'lists', match: 'boardId' },
  { name: 'swimlanes', match: 'boardId' },
  { name: 'cards', match: 'boardId' },
  { name: 'card_comments', match: 'boardId' },
  { name: 'card_comment_reactions', match: 'boardId' },
  { name: 'checklists', match: 'boardId' },
  { name: 'checklistItems', match: 'boardId' },
  { name: 'customFields', match: 'boardIds' },
  { name: 'activities', match: 'boardId' },
  { name: 'rules', match: 'boardId' },
  { name: 'triggers', match: 'ruleRef' },
  { name: 'actions', match: 'ruleRef' },
  { name: 'integrations', match: 'boardId' },
  { name: 'attachments', match: 'metaBoardId' },
];

// Collections a tenant archive may NEVER carry, spelled out so the guard reads as a
// rule rather than as the absence of an entry above.
const TENANT_FORBIDDEN_COLLECTIONS = [
  'users', 'org', 'team', 'orgUser',
  'settings', 'accountSettings', 'accessibilitySettings', 'announcements',
  'attachmentStorageSettings', 'inviteToBoardRolesSettings', 'lockoutSettings',
  'tableVisibilityModeSettings', 'translation', 'invitation_codes',
  'impersonatedUsers', 'sessiondata', 'presences', 'backupSettings',
];

function names() {
  return TENANT_COLLECTIONS.map(c => c.name);
}

function specFor(collection) {
  return TENANT_COLLECTIONS.find(c => c.name === collection) || null;
}

function isTenantCollection(collection) {
  return !!specFor(collection);
}

function isForbiddenInTenantBackup(collection) {
  return TENANT_FORBIDDEN_COLLECTIONS.includes(collection);
}

function uniqueStrings(values) {
  const out = [];
  (Array.isArray(values) ? values : []).forEach(value => {
    if (typeof value === 'string' && value && !out.includes(value)) out.push(value);
  });
  return out;
}

// The board ids of a tenant: the boards that list the Organization. That is the
// tie WeKan already has — Admin Panel / People / Organizations sets it, and
// `boards.orgs` is what "this board belongs to that Organization" means today.
function tenantBoardSelector(orgId) {
  if (typeof orgId !== 'string' || !orgId) return null;
  return { orgs: { $elemMatch: { orgId } } };
}

// The MongoDB selector to export one collection with, given the tenant's board ids
// and (for triggers/actions) the ids its rules point at. Returns null when the
// tenant has nothing in that collection, which the caller reads as "skip it" — an
// empty `$in` would export nothing anyway, but saying so explicitly keeps an empty
// tenant from writing 15 empty files.
function exportSelector(collection, context) {
  const spec = specFor(collection);
  if (!spec) return null;
  const boardIds = uniqueStrings((context || {}).boardIds);
  if (spec.match === 'ruleRef') {
    const ids = uniqueStrings(
      collection === 'triggers' ? (context || {}).triggerIds : (context || {}).actionIds);
    return ids.length ? { _id: { $in: ids } } : null;
  }
  if (!boardIds.length) return null;
  if (spec.match === 'ids') return { _id: { $in: boardIds } };
  if (spec.match === 'boardId') return { boardId: { $in: boardIds } };
  if (spec.match === 'boardIds') return { boardIds: { $in: boardIds } };
  if (spec.match === 'metaBoardId') return { 'meta.boardId': { $in: boardIds } };
  return null;
}

// ── the restore-side guard ───────────────────────────────────────────────────

// Does this document belong to the tenant being restored? The archive names the
// collection and carries the documents, and neither can be trusted: an archive can
// be edited, and a per-tenant admin uploading one must not be able to write into
// another tenant's boards. So every document is checked against the board ids the
// restore is allowed to touch, and anything else is skipped.
//
// `boardIds` is the allowed set — the board ids from the archive's own boards
// entry, intersected by the caller with the boards that really belong to the
// tenant, so an archive cannot widen its own scope.
function docBelongsToTenant(collection, doc, context) {
  const spec = specFor(collection);
  if (!spec || !doc || typeof doc !== 'object') return false;
  const boardIds = uniqueStrings((context || {}).boardIds);
  if (spec.match === 'ids') {
    return typeof doc._id === 'string' && boardIds.includes(doc._id);
  }
  if (spec.match === 'boardId') {
    return typeof doc.boardId === 'string' && boardIds.includes(doc.boardId);
  }
  if (spec.match === 'boardIds') {
    const ids = uniqueStrings(doc.boardIds);
    // A custom field shared with a board outside the tenant is NOT restored: it
    // would write a document another tenant's boards also read.
    return ids.length > 0 && ids.every(id => boardIds.includes(id));
  }
  if (spec.match === 'metaBoardId') {
    const meta = doc.meta;
    return !!meta && typeof meta.boardId === 'string' && boardIds.includes(meta.boardId);
  }
  if (spec.match === 'ruleRef') {
    const allowed = uniqueStrings(
      collection === 'triggers' ? (context || {}).triggerIds : (context || {}).actionIds);
    return typeof doc._id === 'string' && allowed.includes(doc._id);
  }
  return false;
}

// The board ids a restore may write, given what the archive claims and what the
// tenant really owns. The intersection, always — an archive listing a board the
// tenant does not own is the interesting attack, and it is simply dropped.
function allowedRestoreBoardIds(archiveBoardIds, tenantBoardIds) {
  const owned = new Set(uniqueStrings(tenantBoardIds));
  return uniqueStrings(archiveBoardIds).filter(id => owned.has(id));
}

// ── where a tenant's archives live ───────────────────────────────────────────
//
// Under the same backup root as the instance archives, in a per-org directory:
//
//   <files>/backup/2026/07/26/12_00_00/backup.zip          instance
//   <files>/backup/org/<orgId>/2026/07/26/12_00_00/backup.zip   tenant
//
// so listing, pruning and "which archives may this admin see" are a path question
// rather than a database question, and an instance archive can never be mistaken
// for a tenant one.
const TENANT_BACKUP_SEGMENT = 'org';

function tenantBackupRelativeDir(orgId, parts) {
  const t = parts || {};
  const stampDir = `${t.h}_${t.mi}_${t.s}`;
  const base = `${t.y}/${t.mo}/${t.da}/${stampDir}`;
  return orgId
    ? `backup/${TENANT_BACKUP_SEGMENT}/${orgId}/${base}`
    : `backup/${base}`;
}

// The org id an archive path belongs to, or null for an instance archive. Accepts
// both separators so a Windows path is read the same way.
function orgIdOfBackupPath(backupPath) {
  if (typeof backupPath !== 'string' || !backupPath) return null;
  const parts = backupPath.split(/[\\/]+/);
  const at = parts.lastIndexOf(TENANT_BACKUP_SEGMENT);
  if (at === -1) return null;
  // …/backup/org/<orgId>/… — the segment before it must be the backup root, so a
  // board named "org" somewhere in a path cannot masquerade as a tenant archive.
  if (parts[at - 1] !== 'backup') return null;
  const orgId = parts[at + 1];
  return orgId && orgId !== '' ? orgId : null;
}

// May this caller see / restore this archive? Pure, and the same answer on both
// sides: the site admin may use any archive; a per-tenant admin may use only their
// own tenant's, and never an instance-wide one (it contains every tenant).
function canUseBackupPath({ isSiteAdmin = false, adminOrgIds = [], backupPath } = {}) {
  if (isSiteAdmin) return true;
  const orgId = orgIdOfBackupPath(backupPath);
  if (!orgId) return false;
  return uniqueStrings(adminOrgIds).includes(orgId);
}

// The scope a backup/restore request runs in, refused rather than narrowed when the
// caller asks for something they may not have: silently backing up the wrong scope
// is worse than an error.
//   { ok: true, orgId }  — run for that org (null = whole instance)
//   { ok: false, error } — refuse
function resolveBackupScope({ isSiteAdmin = false, adminOrgIds = [], orgId = null } = {}) {
  const mine = uniqueStrings(adminOrgIds);
  if (orgId === null || orgId === undefined || orgId === '') {
    // Whole instance: the site admin only. A per-tenant admin asking for it is not
    // silently given their own tenant instead.
    return isSiteAdmin
      ? { ok: true, orgId: null }
      : { ok: false, error: 'not-authorized' };
  }
  if (typeof orgId !== 'string') return { ok: false, error: 'bad-scope' };
  if (isSiteAdmin || mine.includes(orgId)) return { ok: true, orgId };
  return { ok: false, error: 'not-authorized' };
}

// ESM exports: every app file is an ES module in Meteor, so a `module.exports`
// assignment throws the moment the CLIENT bundle loads it. The .cjs unit tests read
// this file with a dynamic `import()`, the way the other pure modules are tested.
export {
  TENANT_BACKUP_SEGMENT,
  TENANT_COLLECTIONS,
  TENANT_FORBIDDEN_COLLECTIONS,
  allowedRestoreBoardIds,
  canUseBackupPath,
  docBelongsToTenant,
  exportSelector,
  isForbiddenInTenantBackup,
  isTenantCollection,
  names,
  orgIdOfBackupPath,
  resolveBackupScope,
  specFor,
  tenantBackupRelativeDir,
  tenantBoardSelector,
};
