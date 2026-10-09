// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const locales = {};
for (const language of ['gl', 'gl-ES', 'xh']) {
  const result = spawnSync(process.execPath, [fillScript, '--completed-catalog', '--list', language], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '{}\n');
  locales[language] = JSON.parse(
    fs.readFileSync(path.join(root, `imports/i18n/data/${language}.i18n.json`), 'utf8'),
  );
}

for (const language of ['gl', 'gl-ES']) {
  assert.equal(locales[language]['select-none'], 'Non seleccionar ningún');
  assert.equal(locales[language].backup, 'Copia de seguranza');
}
assert.equal(locales.xh['select-none'], 'Ungakhethi nanye');
assert.match(locales.xh['font-preview-text'], /0123456789$/);

for (const locale of Object.values(locales)) {
  assert.match(locale['office-report-desc'], /IPv4.*IPv6/);
  assert.match(locale['api-no-calls'], /REST API.*WITH_API=true/);
}

(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const source = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
  const locale = locales.xh;
  const keys = [
  "board-announcement",
  "board-announcement-enabled",
  "cards-use-list-color",
  "external-link-rules",
  "external-link-rules-description",
  "external-link-identifier-aliases",
  "read-only-field",
  "r-moved-forward",
  "r-moved-back",
  "r-assignee",
  "r-add-actinguser-assignee",
  "r-remove-all-assignees",
  "ldap-sync-now",
  "ldap-sync-now-done",
  "ldap-sync-now-error",
  "ldap-sync-now-nothing",
  "oauth-providers-allowed-email-domains",
  "card-field-visibility",
  "card-field-visibility-desc",
  "r-blocks-view",
  "r-blocks-help",
  "r-blocks-discard",
  "r-blocks-unavailable",
  "r-blocks-invalid",
  "r-blocks-conflict",
  "r-blocks-permission",
  "r-blocks-unsaved",
  "r-blocks-saved",
  "r-blocks-reload"
];
  keys.push(...[
  "board-view-product-backlog",
  "board-view-sprints",
  "board-view-sprint-report",
  "board-view-velocity",
  "scrum-settings",
  "scrum-product-owner",
  "scrum-master",
  "scrum-developers",
  "scrum-working-days",
  "scrum-enabled",
  "scrum-product-goal",
  "scrum-definition-of-done",
  "scrum-estimate-source",
  "scrum-estimate-unit",
  "scrum-completion-policy",
  "scrum-source-poker",
  "scrum-source-customField",
  "scrum-policy-dueComplete",
  "scrum-policy-doneLists",
  "scrum-sprints",
  "scrum-sprint",
  "scrum-start-sprint",
  "scrum-close-sprint",
  "scrum-cancel-sprint",
  "scrum-rollover-sprint",
  "scrum-cancel-reason",
  "scrum-product-backlog",
  "scrum-edit-sprint",
  "scrum-sprint-goal",
  "scrum-capacity"
]);
  keys.push(...[
  "scrum-new-sprint",
  "scrum-releases",
  "scrum-release",
  "scrum-release-scope",
  "scrum-releases-select-help",
  "scrum-select-sprint",
  "scrum-backlog",
  "scrum-backlog-help",
  "scrum-estimate",
  "scrum-backlog-rank",
  "scrum-issue-type",
  "scrum-acceptance-criteria",
  "scrum-events",
  "scrum-event-kind",
  "scrum-timebox",
  "scrum-notes",
  "scrum-event-planning",
  "scrum-event-daily",
  "scrum-event-review",
  "scrum-event-retrospective",
  "scrum-committed",
  "scrum-completed",
  "scrum-added",
  "scrum-removed",
  "scrum-incomplete",
  "scrum-no-closed-sprints",
  "scrum-report-help",
  "scrum-total",
  "scrum-state-planned",
  "scrum-state-active"
]);
  keys.push(...[
  "scrum-state-closed",
  "scrum-state-cancelled",
  "scrum-unknown-estimate",
  "scrum-confirm-close",
  "scrum-confirm-cancel",
  "scrum-past-sprints",
  "scrum-list-category",
  "scrum-swimlane-purpose",
  "scrum-category-backlog",
  "scrum-category-todo",
  "scrum-category-doing",
  "scrum-category-done",
  "scrum-partial-report",
  "scrum-state-released",
  "scrum-released-at",
  "scrum-follow-up-cards",
  "scrum-import-reference-omitted",
  "scrum-partial-snapshot",
  "scrum-resume-close",
  "scrum-daily-observations",
  "scrum-daily-observations-help",
  "scrum-daily-truncated",
  "scrum-daily-empty",
  "scrum-observed-scope"
]);
  for (const key of keys) {
    assert.notEqual(locale[key], source[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(source[key]), key);
  }
  const links = 'external-link-rules-description';
  assert.deepEqual(locale[links].match(/\{(?:identifier|number)\}/g), source[links].match(/\{(?:identifier|number)\}/g));
  assert.ok(locale[links].includes('[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
  for (const name of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) assert.ok(locale['ldap-sync-now-nothing'].includes(name));
  assert.match(locale['read-only-field'], /ngabaphathi bebhodi kuphela/);
  assert.match(locale['r-blocks-invalid'], /esinye kuphela.*esinye/);
  assert.match(locale['r-blocks-conflict'], /Layisha kwakhona.*ngaphambi kokugcina/);
  assert.match(locale['card-field-visibility-desc'], /Akukho datha yekhadi.*etshintshayo/);
  assert.match(locale['scrum-start-sprint'], /^Qala/);
  assert.match(locale['scrum-close-sprint'], /^Vala/);
  assert.match(locale['scrum-cancel-sprint'], /^Rhoxisa/);
  assert.match(locale['scrum-rollover-sprint'], /ongagqitywanga/);
  assert.equal(locale['board-view-product-backlog'], locale['scrum-product-backlog']);
  assert.equal(locale['board-view-sprints'], locale['scrum-sprints']);
  assert.notEqual(locale['scrum-policy-dueComplete'], locale['scrum-policy-doneLists']);
  for (const literal of ['Ctrl', 'Cmd', 'Mac']) assert.ok(locale['scrum-releases-select-help'].includes(literal));
  assert.match(locale['scrum-report-help'], /lubalwa ngokwahlukeneyo.*asilulo uqikelelo olunguziro/);
  assert.match(locale['scrum-report-help'], /kuphela xa iiyunithi zoqikelelo nemigaqo zifana/);
  assert.notEqual(locale['scrum-completed'], locale['scrum-incomplete']);
  const totals = locale['scrum-total'].replace('__count__', '3').replace('__estimate__', '8').replace('__unknown__', '1');
  assert.match(totals, /3.*8.*1/);
  assert.doesNotMatch(totals, /__\w+__/);
  assert.match(locale['scrum-confirm-close'], /aya kuhanjiswa kwindawo ekhethiweyo/);
  assert.match(locale['scrum-confirm-cancel'], /ahlala eyinxalenye yayo ade abelwe/);
  assert.match(locale['scrum-partial-report'], /kuphela amakhadi owabelweyo ngoku/);
  assert.match(locale['scrum-daily-observations-help'], /UTC.*Iintsuku ezingekhoyo azifakwa/);
  assert.match(locale['scrum-daily-observations-help'], /akurekhodi lonke utshintsho/);
  assert.match(locale['scrum-daily-observations-help'], /olungaziwayo alunguziro/);
  assert.match(locale['scrum-daily-truncated'], /366/);
  const reference = locale['scrum-import-reference-omitted'].replace('__reference__', 'CARD-7');
  assert.ok(reference.includes('CARD-7'));
  assert.ok(!reference.includes('__reference__'));
  const error = locale['ldap-sync-now-error'].replace('%s', 'E_LDAP');
  assert.ok(error.includes('E_LDAP'));
  assert.ok(!error.includes('%s'));
  console.log('Xhosa settings: variables, literals, restrictions and rendered errors passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
