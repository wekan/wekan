const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'ks'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 417);

const english = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const kashmiri = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/ks.i18n.json'), 'utf8'));
const tokens = (value) => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)]
  .map(([token]) => token).sort();
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(kashmiri)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]), key);
  }
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(kashmiri.accept, 'قبول کریو');
assert.deepEqual(tokens(kashmiri['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(kashmiri['act-removeChecklistItem']),
  ['__board__', '__card__', '__checkList__', '__checklistItem__', '__list__',
    '__swimlane__']);
assert.match(kashmiri['act-createBoard'], /بنٲو/);
assert.deepEqual(tokens(kashmiri['act-moveCardToOtherBoard']),
  ['__board__', '__card__', '__list__', '__oldBoard__', '__oldList__',
    '__oldSwimlane__', '__swimlane__']);
assert.equal(kashmiri['workspace-settings'], 'کٲم جایہِ ترتیبات');
assert.deepEqual(tokens(kashmiri['activity-dueDate']), ['%s', '%s']);
assert.match(kashmiri['set-swimlane-height'], /وَتھ/);
assert.deepEqual(tokens(kashmiri['avatar-too-big']), ['__size__']);
assert.deepEqual(tags(kashmiri['board-private-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tokens(kashmiri['board-open-and-move-between-remaining-and-workspaces']),
  ['__workspaces__']);
assert.deepEqual(tags(kashmiri['board-public-info']),
  ['</strong>', '<strong>']);
assert.match(kashmiri['vote-question'], /راے شمٲری/);
assert.match(kashmiri['importSwimlanePopup-title'], /وَتھ/);
assert.match(kashmiri['map-to-existing-user-desc'], /اصلی صارف/);
assert.equal(kashmiri['changeLanguagePopup-title'], 'زبان بدلٲویو');
assert.match(kashmiri['auto-list-width'], /فہرست چوڑٲے/);
assert.equal(kashmiri['color-sky'], 'آسمٲنی');
assert.doesNotThrow(() => JSON.parse(kashmiri['copyManyCardsPopup-format']));
assert.match(kashmiri['read-only-desc'], /بدلٲوِتھ ہؠکِہ نہٕ/);
assert.deepEqual(tokens(kashmiri['email-invite-text']),
  ['__board__', '__inviter__', '__url__', '__user__']);
assert.match(kashmiri['error-import-empty-board'], /WeKan/);
assert.match(kashmiri['export-card-field-board-info'], /وَتھ/);
assert.equal(kashmiri['filter-no-member'], 'کانٛہہ ممبر نہٕ');
for (const operator of ['==', '!=', '<=', '>=', '&&', '||', '/Tes.*/i']) {
  assert.match(kashmiri['advanced-filter-description'],
    new RegExp(operator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}
assert.deepEqual(tokens(kashmiri['import-board-instruction-issues']),
  ['__endpoint__', '__sourceName__']);
assert.match(kashmiri['trello-api-key'], /https:\/\/trello\.com\/app-key/);
assert.deepEqual(tokens(kashmiri['label-default']), ['%s']);
assert.deepEqual(tokens(kashmiri['leave-board-pop']), ['__boardTitle__']);
assert.match(kashmiri['no-archived-swimlanes'], /وَتھ/);
assert.deepEqual(tokens(kashmiri['page-maybe-private']), ['%s']);
assert.deepEqual(tags(kashmiri['page-maybe-private']), ['</a>', "<a href='%s'>"]);
assert.deepEqual(tokens(kashmiri['remove-member-pop']),
  ['__boardTitle__', '__name__', '__username__']);
assert.match(kashmiri['welcome-swimlane'], /منزل/);
assert.match(kashmiri['wipLimitErrorPopup-dialog-pt1'], /WIP/);
assert.deepEqual(tokens(kashmiri['email-invite-register-text']),
  ['__icode__', '__inviter__', '__url__', '__user__']);
assert.match(kashmiri['attachment-transfer-limits-description'], /API/);
assert.match(kashmiri.Reactivity_order, /METEOR_REACTIVITY_ORDER/);
assert.match(kashmiri['org-domains-description'], /MULTITENANCY=true/);
assert.deepEqual(tokens(kashmiri['default-subtasks-board']), ['__board__']);
assert.deepEqual(tokens(kashmiri['activity-added-label']), ['%s', '%s']);
assert.deepEqual(tokens(kashmiri['activity-set-customfield']), ['%s', '%s', '%s']);
assert.match(kashmiri['r-board-rules'], /بورڈ اصول/);
assert.match(kashmiri['r-workflow-view'], /کٲم بہاؤ/);
assert.deepEqual(tokens(kashmiri['r-w-every-day-at']), ['__time__']);
assert.deepEqual(tokens(kashmiri['r-import-done']), ['__count__']);
assert.equal(kashmiri['r-all-boards'], 'سٲری بورڈ');
assert.deepEqual(tokens(kashmiri['r-import-unmapped']), ['__count__']);
assert.match(kashmiri['r-import-workflow'], /بصری کٲم بہاؤ/);
assert.match(kashmiri['r-set-scheduled-triggers'], /مقرر شُدٕ محرک/);
assert.equal(kashmiri['r-sort-due'], 'آخری تٲریخ');
assert.equal(kashmiri['r-trigger'], 'محرک');
assert.equal(kashmiri['r-list'], 'فہرست');
assert.match(kashmiri['r-unarchived'], /واپس انٲو/);
assert.equal(kashmiri['r-checklist'], 'چیک لسٹ');
assert.match(kashmiri['r-remove-all'], /سٲری ممبر ہٹٲویو/);
assert.match(kashmiri['r-d-move-to-top-gen'], /پنٕنۍ فہرست/);
assert.equal(kashmiri['r-in-swimlane'], 'وَتھ منٛز');
assert.match(kashmiri['r-when-a-card-is-moved'], /دۄیمہِ فہرست/);
assert.equal(kashmiri['r-df-due-at'], 'آخری تٲریخ');
assert.match(kashmiri['authentication-method'], /توثیق/);
assert.match(kashmiri['custom-head-manifest-content'], /JSON/);
assert.deepEqual(tags(kashmiri['add-custom-html-after-body-start']), ['<body>']);
assert.deepEqual(tags(kashmiri['add-custom-html-before-body-end']), ['</body>']);
assert.deepEqual(tokens(kashmiri['act-a-dueAt']),
  ['__card__', '__timeOldValue__', '__timeValue__']);
assert.deepEqual(tokens(kashmiri['act-atUserComment']),
  ['__board__', '__card__', '__comment__', '__list__', '__swimlane__']);
assert.match(kashmiri['swimlaneDeletePopup-title'], /وَتھ/);
assert.match(kashmiri['open-many-cards-at-once-description'], /پننِس ونڈو/);
assert.match(kashmiri['submit-on-enter-description'], /Shift\+Enter/);
assert.equal(kashmiri['roles-status-role'], 'کردار');
assert.equal(kashmiri.monday, 'سوموار');
assert.equal(kashmiri.voting, 'راے شمٲری');
assert.equal(kashmiri.task, 'کام');
assert.match(kashmiri['shared-templates-info'], /ای میل ڈومین/);
assert.equal(kashmiri['myCardsViewChange-choice-table'], 'جدول');
assert.match(kashmiri['dueCardsViewChange-choice-all-description'], /\*آخری تٲریخ\*/);
assert.deepEqual(tokens(kashmiri['swimlane-title-not-found']), ['%s']);
assert.deepEqual(tokens(kashmiri['n-n-of-n-cards-found']),
  ['__end__', '__start__', '__total__']);
for (const key of [
  'operator-board', 'operator-swimlane', 'operator-list', 'operator-label',
  'operator-user', 'operator-member', 'operator-assignee', 'operator-creator',
  'operator-status', 'operator-due', 'operator-created', 'operator-modified',
  'operator-sort', 'operator-comment', 'operator-has', 'operator-limit',
  'operator-debug', 'operator-org', 'operator-team', 'operator-title',
  'operator-description', 'operator-customfield', 'operator-attachment-text',
  'operator-checklist-text',
]) {
  assert.doesNotMatch(kashmiri[key], /\s/, `${key} must remain one search token`);
}
assert.equal(kashmiri['operator-swimlane'], 'وَتھ');
assert.equal(kashmiri['predicate-overdue'], 'گُزرِتھ');
assert.deepEqual(tokens(kashmiri['operator-number-expected']),
  ['__operator__', '__value__']);
assert.deepEqual(tokens(kashmiri['globalSearch-instructions-operator-has']), [
  '__operator_has__', '__predicate_assignee__', '__predicate_attachment__',
  '__predicate_checklist__', '__predicate_description__', '__predicate_due__',
  '__predicate_end__', '__predicate_member__', '__predicate_start__',
]);
assert.match(kashmiri['globalSearch-instructions-notes-2'], /\*OR\*/);
assert.equal(kashmiri['link-to-search'], 'یَتھ تلاشس لنک کریو');
assert.equal(kashmiri['sort-cards'], 'کارڈ ترتیب دِیو');
assert.match(kashmiri['drag-to-connect'], /دۄیمس کارڈس/);
assert.deepEqual(tokens(kashmiri['import-dependencies-done']),
  ['__imported__', '__unmatched__']);
assert.deepEqual(tokens(kashmiri['background-too-big']), ['{{size}}']);
assert.equal(kashmiri.location, 'جاے');
assert.match(kashmiri['server-error-troubleshooting'], /sudo snap logs wekan\.wekan/);
assert.equal(kashmiri['move-swimlane'], 'وَتھ پکنٲویو');
assert.deepEqual(tokens(kashmiri['custom-field-stringtemplate-format']), ['%{value}']);
assert.match(kashmiri['custom-field-stringtemplate-separator'], /&#32;.*&nbsp;/);
assert.match(kashmiri['office-report-desc'], /IPv4.*IPv6/);
assert.match(kashmiri['api-no-calls'], /WITH_API=true/);
assert.match(kashmiri['recovery-report-desc'], /MongoDB/);
assert.equal(kashmiri['copy-swimlane'], 'وَتھ نقل کریو');
assert.match(kashmiri['carbon-copy'], /Cc:/);
assert.equal(kashmiri['cardDetailsPopup-title'], 'کارڈ تفصیل');
assert.match(kashmiri.Node_heap_malloced_memory, /Node.*malloc/);
assert.match(kashmiri.Node_memory_usage_rss, /resident set/);
assert.equal(kashmiri.moveChecklist, 'چیک لسٹ پکنٲویو');
assert.match(kashmiri['attachment-move-storage-gridfs'], /GridFS/);
assert.match(kashmiri['attachment-move-storage-s3'], /S3/);
assert.match(kashmiri['attachment-repair-locations-description'], /GridFS/);
assert.equal(kashmiri['move-progress-pause'], 'رُکٲویو');
assert.match(kashmiri['gridfs-file-id'], /GridFS.*ID/);
assert.match(kashmiri['mongodb-compact-description'], /MongoDB GridFS.*Compact/);
assert.equal(kashmiri.action, 'کارروٲیی');
assert.equal(kashmiri['board-status'], 'بورڈ حالت');
assert.match(kashmiri['drag-board-to-workspace'], /__workspaces__/);
assert.match(kashmiri['show-week-of-year'], /ISO 8601/);
assert.match(kashmiri['import-board-zip'], /JSON.*\.zip/);
assert.equal(kashmiri.accessibility, 'رسٲیی');
assert.match(kashmiri['accounts-lockout-settings'], /Brute Force/);
assert.equal(kashmiri['accounts-lockout-status'], 'حالت');
assert.match(kashmiri['attachment-storage-configuration'], /اٹیچمنٹ ذخیرٕ/);
assert.match(kashmiri['board-backup-scheduled'], /کامیٲبی/);
assert.equal(kashmiri['cron-migrations'], 'مقرر شُدٕ منتقلی');
