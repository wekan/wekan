'use strict';

// Admin Panel / Problems / Instrumentation: the per-method and per-publication
// counters grouped by the part of WeKan they belong to, so the page can show
// the whole picture as one bar per area instead of 200 rows on 11 pages.
// Pure: the client and tests/instrumentationAreas.test.cjs run it as it is.
//
// An operation belongs to the FIRST area whose pattern matches its name, so the
// specific areas come before the general ones: Migrations, Backup and Import
// before Problems' "report"/"status", Checklists before Lists, Cards before
// Boards. `(?<!re)move` keeps "remove" out of a move.
// `labelKey` is a translation key every language already has, apart from
// `instrumentation-other`.
const AREAS = [
  { id: 'login', labelKey: 'login', pattern: /login|logout|passkey|password|sqrl|saml|oauth|oidc|ldap|^_?is(cas|ldap|oauth2)|cas_|authconfig|authentication|lockout|impersonat|serviceconfiguration|sandstormclaim|disableregistration|disableforgot/i },
  { id: 'migrations', labelKey: 'migrations', pattern: /migrat|fixavatar|fixallfile|fixduplicate|deleteduplicate|correctfileextension|compactmongo|schema|rawmongo/i },
  { id: 'backup', labelKey: 'backup', pattern: /backup|restorepoint|fetchfromcloud/i },
  { id: 'import', labelKey: 'import', pattern: /import|export|trello|github|csv|excel|ics|wrike|jira|listsync|caldav|syncdescriptor/i },
  { id: 'problems', labelKey: 'problems', pattern: /eventlog|problem|instrumentation|cpu|statistic|selfcheck|report|repair|recovery|integrity|filestatus|brokencard|systemstatus|checknewest|progress|status$/i },
  { id: 'rules', labelKey: 'rules', pattern: /rule|trigger|action|^bot|bots?run/i },
  { id: 'history', labelKey: 'history', pattern: /history|activities|activityfeed|position|timeline|undo|redo/i },
  { id: 'people', labelKey: 'people', pattern: /user|people|member|org|team|domain|group|profile|language|setinitials|tenant|anonymiz|myadmin|invit|^setemail|usernameandemail|emailverified|customboardrole|avatar/i },
  { id: 'notifications', labelKey: 'notifications', pattern: /notif|email|mail|ntfy|bounce|smtp|announcement|webpush|watch/i },
  { id: 'attachments', labelKey: 'attachments', pattern: /attachment|file|gridfs|s3|azure|gcs|background|storage(stats|paths|settings|locations)|(attachment|move)tostorage|attachmentstorage/i },
  { id: 'checklists', labelKey: 'checklists', pattern: /checklist/i },
  { id: 'subtasks', labelKey: 'subtasks', pattern: /subtask/i },
  { id: 'custom-fields', labelKey: 'custom-fields', pattern: /customfield/i },
  { id: 'labels', labelKey: 'labels', pattern: /label/i },
  { id: 'comments', labelKey: 'comments', pattern: /comment|reaction/i },
  { id: 'search', labelKey: 'search', pattern: /search|filter|textmatch|movementmatch|facet/i },
  { id: 'swimlanes', labelKey: 'swimlanes', pattern: /swimlane/i },
  { id: 'lists', labelKey: 'lists', pattern: /list|wip/i },
  { id: 'cards', labelKey: 'cards', pattern: /card|vote|poker/i },
  { id: 'boards', labelKey: 'boards', pattern: /board|workspace|template|view|scrum|sprint|calendar|chart|chat|map|starred|dependenc|archive|quit|clone|key$|^vcs|(?<!re)move|copy/i },
  { id: 'settings', labelKey: 'settings', pattern: /setting|config|feature|translation|theme|customui|matomo|webhook|dateformat|startday|calendarsystem|limit|api|version|accessibility|optional|accountsetting|softlimit|^set(leftmenu|mobilemode|sidebar|ui|permanentdelete)|^toggle|sitelogo|imageurl|unsaved-edits|activitypub/i },
];
const OTHER = { id: 'other', labelKey: 'instrumentation-other' };

function areaOf(name) {
  const text = String(name || '');
  return AREAS.find(area => area.pattern.test(text)) || OTHER;
}

// One row per area that has calls, largest first: calls, completed, errors,
// the average duration weighted by completed calls, the slowest call, and the
// operations in it. `share` is the area's calls relative to the busiest area
// (0..1), which is what a bar's length shows.
function summarizeByArea(operations) {
  const byId = new Map();
  for (const op of Array.isArray(operations) ? operations : []) {
    const area = areaOf(op && op.name);
    const row = byId.get(area.id) || {
      id: area.id, labelKey: area.labelKey, calls: 0, completed: 0, errors: 0,
      timedCompleted: 0, totalMs: 0, maxMs: null, operations: 0,
    };
    row.calls += Number(op.calls) || 0;
    row.completed += Number(op.completed) || 0;
    row.errors += Number(op.errors) || 0;
    row.operations += 1;
    if (Number.isFinite(op.averageMs) && op.completed > 0) {
      row.timedCompleted += op.completed;
      row.totalMs += op.averageMs * op.completed;
    }
    if (Number.isFinite(op.maxMs)) row.maxMs = Math.max(row.maxMs ?? 0, op.maxMs);
    byId.set(area.id, row);
  }
  const rows = [...byId.values()].filter(row => row.calls > 0 || row.errors > 0);
  const busiest = Math.max(1, ...rows.map(row => row.calls));
  return rows
    .map(({ timedCompleted, totalMs, ...row }) => ({
      ...row,
      averageMs: timedCompleted ? Math.round(totalMs / timedCompleted) : null,
      share: row.calls / busiest,
      errorShare: row.calls ? Math.min(1, row.errors / row.calls) : (row.errors ? 1 : 0),
    }))
    .sort((a, b) => b.calls - a.calls || a.id.localeCompare(b.id));
}

module.exports = { AREAS, OTHER, areaOf, summarizeByArea };
