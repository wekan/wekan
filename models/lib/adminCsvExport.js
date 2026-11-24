'use strict';

// CSV exports for access reviews and incidents (docs/Compliance/README.md
// WP-10; [ISO27001] A.5.18 access rights review, [SOC2] CC6.2/CC6.3, [HIPAA]
// § 164.308(a)(4) and § 164.312(b), [NIS2] Art. 21(2)(i)): the whole of a
// list an administrator otherwise reads ten rows at a time, as one file a
// spreadsheet or a SIEM opens.
//
//   people       Admin Panel / People: every account
//   boards       Admin Panel / Problems / Boards: every board
//   board-roles  one row per board member and role - who can do what where,
//                the access review itself
//   security     Admin Panel / Problems / Security: every summarised problem
//   audit        Admin Panel / People / Audit log: every administrator action
//   data-access  its Data access tab: who downloaded what (WP-11)
//
// Served by server/routes/adminCsvExport.js to a site administrator only, and
// each download is in the Audit log. A dataset names the fields it reads, so
// the database never hands the route more than those: no password hash, login
// token, two-factor secret or API key can reach a file (tests/adminCsvExport
// .test.cjs pins that).
//
// Pure: no Meteor.

const MAX_ROWS = 200000;

// RFC 4180: a cell with a comma, a quote or a line break is quoted, quotes
// doubled. And a cell a spreadsheet would run as a formula (=, +, -, @, tab,
// carriage return first - CSV injection, CWE-1236) gets a leading apostrophe,
// so a username like "=HYPERLINK(...)" is shown, never run.
function csvCell(value) {
  if (value === undefined || value === null) return '';
  let s = value instanceof Date ? value.toISOString() : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function csvLine(cells) {
  return `${cells.map(csvCell).join(',')}\r\n`;
}

const yesNo = v => (v === true ? 'yes' : 'no');
const firstEmail = u => (Array.isArray(u.emails) && u.emails[0] && u.emails[0].address) || '';

const DATASETS = Object.freeze({
  people: {
    collection: 'users',
    fields: { username: 1, 'profile.fullname': 1, emails: 1, isAdmin: 1, loginDisabled: 1, authenticationMethod: 1, createdAt: 1, lastConnectionDate: 1 },
    sort: { username: 1 },
    columns: [
      ['id', u => u._id],
      ['username', u => u.username],
      ['full name', u => u.profile && u.profile.fullname],
      ['email', firstEmail],
      ['site admin', u => yesNo(u.isAdmin)],
      ['login disabled', u => yesNo(u.loginDisabled)],
      ['authentication', u => u.authenticationMethod || 'password'],
      ['created', u => u.createdAt],
      ['last connection', u => u.lastConnectionDate],
    ],
  },
  boards: {
    collection: 'boards',
    query: { type: { $ne: 'template-container' } },
    fields: { title: 1, permission: 1, archived: 1, type: 1, members: 1, createdAt: 1, modifiedAt: 1 },
    sort: { title: 1 },
    columns: [
      ['id', b => b._id],
      ['title', b => b.title],
      ['visibility', b => b.permission],
      ['archived', b => yesNo(b.archived)],
      ['type', b => b.type || 'board'],
      ['active members', b => (b.members || []).filter(m => m && m.isActive === true).length],
      ['created', b => b.createdAt],
      ['modified', b => b.modifiedAt],
    ],
  },
  'board-roles': {
    collection: 'boards',
    query: { type: { $ne: 'template-container' } },
    fields: { title: 1, archived: 1, members: 1 },
    sort: { title: 1 },
    // One board gives one row per active member; usernames come from the
    // route, which looks the members up (memberRows below).
    perMember: true,
    columns: [
      ['board id', r => r.boardId],
      ['board', r => r.board],
      ['board archived', r => yesNo(r.archived)],
      ['user id', r => r.userId],
      ['username', r => r.username],
      ['role', r => r.role],
    ],
  },
  security: {
    collection: 'eventlog',
    query: { stream: 'security' },
    fields: { at: 1, firstAt: 1, count: 1, severity: 1, category: 1, bleed: 1, action: 1, source: 1, cwe: 1, username: 1, ip: 1, detail: 1 },
    sort: { at: -1 },
    columns: [
      ['last', e => e.at],
      ['first', e => e.firstAt || e.at],
      ['count', e => e.count || 1],
      ['severity', e => e.severity],
      ['category', e => e.category],
      ['vulnerability', e => e.bleed],
      ['action', e => e.action],
      ['source', e => e.source],
      ['CWE', e => e.cwe],
      ['last username', e => e.username],
      ['last IP', e => e.ip],
      ['detail', e => e.detail],
    ],
  },
  'data-access': {
    collection: 'dataAccessLog',
    fields: { day: 1, firstAt: 1, at: 1, userId: 1, username: 1, kind: 1, target: 1, count: 1, ip: 1 },
    sort: { at: -1 },
    columns: [
      ['day', d => d.day],
      ['first', d => d.firstAt],
      ['last', d => d.at],
      ['user id', d => d.userId],
      ['username', d => d.username],
      ['what', d => d.kind],
      ['of', d => d.target],
      ['times', d => d.count],
      ['last IP', d => d.ip],
    ],
  },
  audit: {
    collection: 'adminAuditLog',
    fields: { at: 1, actorId: 1, actorUsername: 1, method: 1, args: 1, ok: 1, error: 1, ip: 1 },
    sort: { at: -1 },
    columns: [
      ['when', a => a.at],
      ['administrator id', a => a.actorId],
      ['administrator', a => a.actorUsername],
      ['action', a => a.method],
      // Stored already redacted (models/lib/adminAudit.js auditArgs).
      ['details', a => (a.args === undefined ? '' : typeof a.args === 'string' ? a.args : JSON.stringify(a.args))],
      ['succeeded', a => yesNo(a.ok)],
      ['error', a => a.error],
      ['IP', a => a.ip],
    ],
  },
});

function dataset(name) {
  return Object.prototype.hasOwnProperty.call(DATASETS, name) ? DATASETS[name] : null;
}

function headerLine(spec) {
  return csvLine(spec.columns.map(([header]) => header));
}

function rowLine(spec, doc) {
  return csvLine(spec.columns.map(([, value]) => value(doc)));
}

// The rows of board-roles for one board: its active members, each with the
// role memberRoleOf gives it (models/lib/boardRoleCapabilities.js).
function memberRows(board, usernames, roleOf) {
  return (board.members || []).filter(m => m && m.isActive === true && m.userId).map(m => ({
    boardId: board._id,
    board: board.title,
    archived: board.archived,
    userId: m.userId,
    username: (usernames && usernames.get(m.userId)) || '',
    role: roleOf(m) || '',
  }));
}

function filename(name, now = new Date()) {
  return `wekan-${name}-${now.toISOString().slice(0, 10)}.csv`;
}

module.exports = { MAX_ROWS, DATASETS, csvCell, csvLine, dataset, headerLine, rowLine, memberRows, filename };
