const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'chr'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 66);

const english = JSON.parse(
  fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'),
);
const cherokee = JSON.parse(
  fs.readFileSync(path.join(root, 'imports/i18n/data/chr.i18n.json'), 'utf8'),
);
const tokens = (value) =>
  [
    ...value.matchAll(
      /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
    ),
  ]
    .map(([token]) => token)
    .sort();
const tags = (value) =>
  [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
    .map(([tag]) => tag)
    .sort();

for (const [key, value] of Object.entries(cherokee)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]), key);
  }
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(cherokee.accept, 'ᎠᏓᏂᎸᏤᏗ');
assert.deepEqual(tokens(cherokee['act-addChecklistItem']), [
  '__board__',
  '__card__',
  '__checklistItem__',
  '__checklist__',
  '__list__',
  '__swimlane__',
]);
assert.match(cherokee['act-createBoard'], /ᎦᏍᎩᎸ/);
assert.deepEqual(tokens(cherokee['act-moveCard']), [
  '__board__',
  '__card__',
  '__list__',
  '__oldList__',
  '__oldSwimlane__',
  '__swimlane__',
]);
assert.match(cherokee['activity-checklist-added'], /ᏗᎪᏪᎵ/);
assert.match(cherokee['workspace-settings'], /ᎠᏛᏁᏗ ᎦᏙᎯ/);
assert.deepEqual(tokens(cherokee['activity-dueDate']), ['%s', '%s']);
assert.match(cherokee['home-board-remove-confirm'], /ᎦᏍᎩᎸ/);
assert.match(cherokee['setSwimlaneHeightPopup-title'], /ᏍᏫᎻᎴᏅ/);
assert.deepEqual(tokens(cherokee['and-n-other-card']), ['__count__']);
assert.deepEqual(tags(cherokee['board-private-info']), [
  '</strong>',
  '<strong>',
]);
assert.match(cherokee['board-private-info'], /ᎤᏕᎵᏛ/);
assert.deepEqual(tokens(cherokee['board-open-and-move-between-remaining-and-workspaces']), ['__workspaces__']);
assert.deepEqual(tags(cherokee['board-public-info']), ['</strong>', '<strong>']);
assert.deepEqual(tokens(cherokee['card-comments-title']), ['%s']);
assert.match(cherokee['cardStartVotingPopup-title'], /ᎤᏂᏁᎫᏥ/);
assert.match(cherokee['cardStartPlanningPokerPopup-title'], /ᏉᎧ/);
assert.match(cherokee['importSwimlanePopup-title'], /ᏍᏫᎻᎴᏅ/);
assert.match(cherokee['map-to-existing-user'], /ᎬᏗᏍᎩ/);
assert.match(cherokee['changeLanguagePopup-title'], /ᎦᏬᏂᎯᏍᏗ/);
assert.match(cherokee['font-preview-text'], /0123456789/);
assert.match(cherokee['color-blue'], /ᏌᎪᏂᎨ/);
assert.match(cherokee['color-red'], /ᎩᎦᎨ/);
assert.match(cherokee['move-card-up'], /ᎦᎸᎳᏗ/);
assert.equal(JSON.parse(cherokee['copyManyCardsPopup-format']).length, 3);
assert.match(cherokee['comment-only'], /ᎧᏃᎮᏓ/);
assert.match(cherokee['custom-field-number'], /ᎠᏎᎸ/);
assert.deepEqual(tokens(cherokee['email-enrollAccount-text']), [
  '__url__',
  '__user__',
]);
assert.deepEqual(tokens(cherokee['email-invite-text']), [
  '__board__',
  '__inviter__',
  '__url__',
  '__user__',
]);
assert.match(cherokee['error-import-empty-board'], /WeKan/);
assert.match(cherokee['export-card-pdf'], /PDF/);
assert.match(cherokee['export-card-excel'], /Excel/);
assert.match(cherokee['filter-due-today'], /ᎪᎯ/);
assert.deepEqual(tokens(cherokee['import-board-instruction-issues']), [
  '__endpoint__',
  '__sourceName__',
]);
assert.match(cherokee['advanced-filter-description'], /F1 == \/Tes\.\*\/i/);
assert.match(cherokee['import-board-instruction-openproject'], /GET \/api\/v3\/work_packages/);
assert.match(cherokee['trello-api-key'], /https:\/\/trello\.com\/app-key/);
assert.deepEqual(tokens(cherokee['label-default']), ['%s']);
assert.match(cherokee['invalid-year'], /2026/);
assert.deepEqual(tokens(cherokee['leave-board-pop']), ['__boardTitle__']);
assert.match(cherokee['listImportCardsTsvPopup-title'], /CSV\/TSV/);
assert.match(cherokee['no-archived-swimlanes'], /ᏍᏫᎻᎴᏅ/);
assert.deepEqual(tokens(cherokee['page-maybe-private']), ['%s']);
assert.deepEqual(tokens(cherokee['remove-member-pop']), [
  '__boardTitle__',
  '__name__',
  '__username__',
]);
assert.deepEqual(tags(cherokee['page-maybe-private']), ["</a>", "<a href='%s'>"]);
assert.match(cherokee['toggle-assignees'], /1-9/);
assert.match(cherokee['custom-top-left-corner-logo-height'], /27/);
assert.match(cherokee['attachment-transfer-limits-title'], /API/);
assert.deepEqual(tokens(cherokee['email-invite-register-text']), [
  '__icode__',
  '__inviter__',
  '__url__',
  '__user__',
]);
assert.match(cherokee['smtp-host'], /SMTP/);
assert.match(cherokee.Database_type, /ᎧᏃᎮᏓ/);
assert.match(cherokee.Reactivity_order, /METEOR_REACTIVITY_ORDER/);
assert.match(cherokee.DDP_transport, /DDP_TRANSPORT/);
assert.match(cherokee['org-domains-description'], /MULTITENANCY=true/);
assert.deepEqual(tokens(cherokee['default-subtasks-board']), ['__board__']);
assert.deepEqual(tokens(cherokee['activity-added-label']), ['%s', '%s']);
assert.match(cherokee['checklist-count'], /0\/0/);
assert.deepEqual(tokens(cherokee['activity-set-customfield']), [
  '%s',
  '%s',
  '%s',
]);
assert.deepEqual(tokens(cherokee['r-w-every-day-at']), ['__time__']);
assert.deepEqual(tokens(cherokee['r-import-done']), ['__count__']);
assert.deepEqual(tokens(cherokee['r-import-unmapped']), ['__count__']);
assert.match(cherokee['r-import-workflow-note'], /n8n.*Node-RED/);
assert.match(cherokee['r-for-n-days'], /N/);
assert.match(cherokee['r-move-card-to'], /ᎪᏪᎵ ᎤᏍᏗ/);
assert.match(cherokee['r-send-email'], /ᎢᎦᎵᏍᏓᏴᏗ/);
assert.match(cherokee['r-check-all'], /ᏂᎦᏛ/);
assert.match(cherokee['r-items-list'], /^ᎪᏪᎵ1,ᎪᏪᎵ2,ᎪᏪᎵ3$/);
assert.match(cherokee['custom-head-meta-tags'], /HTML/);
assert.match(cherokee['custom-assetlinks-content'], /assetlinks\.json.*JSON/);
assert.deepEqual(tags(cherokee['add-custom-html-after-body-start']), ['<body>']);
assert.deepEqual(tokens(cherokee['act-a-dueAt']), [
  '__card__',
  '__timeOldValue__',
  '__timeValue__',
]);
assert.deepEqual(tokens(cherokee['act-atUserComment']), [
  '__board__',
  '__card__',
  '__comment__',
  '__list__',
  '__swimlane__',
]);
assert.match(cherokee['submit-on-enter-description'], /Shift\+Enter.*Ctrl\/Cmd\+Enter/);
assert.match(cherokee.monday, /ᏔᎵᏁᎢᎦ/);
assert.match(cherokee['roles-status-role'], /ᎢᏯᏛᏁᏗ/);
assert.match(cherokee['invalid-domain'], /example\.com.*@/);
assert.deepEqual(tokens(cherokee['board-title-not-found']), ['%s']);
assert.match(cherokee['dueCardsViewChange-choice-all-description'], /\*ᎤᎵᏍᏆᏗ\*/);
assert.deepEqual(tokens(cherokee['comment-not-found']), ['%s']);
assert.deepEqual(tokens(cherokee['n-n-of-n-cards-found']), [
  '__end__',
  '__start__',
  '__total__',
]);
assert.match(cherokee['operator-board'], /ᎦᏍᎩᎸ/);
assert.match(cherokee['operator-member'], /ᎠᎵᏏᎾᏓᏍᏗ/);
assert.match(cherokee['predicate-overdue'], /ᎤᎶᏒ/);
assert.match(cherokee['predicate-checklist'], /ᏗᎪᏪᎵ/);
assert.deepEqual(tokens(cherokee['operator-number-expected']), [
  '__operator__',
  '__value__',
]);
assert.deepEqual(
  tokens(cherokee['globalSearch-instructions-operator-has']),
  tokens(english['globalSearch-instructions-operator-has']),
);
assert.deepEqual(
  tags(cherokee['globalSearch-instructions-operator-label']),
  tags(english['globalSearch-instructions-operator-label']),
);
assert.match(cherokee['globalSearch-instructions-notes-2'], /\*OR\*/);
assert.match(cherokee['globalSearch-instructions-notes-3'], /\*AND\*/);
assert.match(cherokee['sort-boards-title-asc'], /A → Z/);
assert.match(cherokee['import-dependencies-file'], /JSON.*SVG/);
assert.deepEqual(tokens(cherokee['import-dependencies-done']), [
  '__imported__',
  '__unmatched__',
]);
assert.deepEqual(tokens(cherokee['background-too-big']), ['{{size}}']);
assert.match(cherokee['location-open-map'], /ᎦᏙᎯ/);
assert.deepEqual(tokens(cherokee['custom-field-stringtemplate-format']), [
  '%{value}',
]);
assert.match(
  cherokee['custom-field-stringtemplate-separator'],
  /&#32;.*&nbsp;/,
);
assert.match(
  cherokee['server-error-troubleshooting'],
  /sudo snap logs wekan\.wekan.*sudo docker logs wekan-app/s,
);
assert.match(cherokee.officeReportTitle, /ᎠᏂᎸᏫᏍᏓᏁᎸ/);
assert.match(cherokee['office-report-desc'], /IPv4.*IPv6/);
assert.match(cherokee['api-report-desc'], /REST API/);
assert.match(cherokee['api-no-calls'], /WITH_API=true/);
assert.match(cherokee['recovery-report-desc'], /MongoDB/);
assert.match(cherokee['recovery-maintenance-note'], /—/);
assert.match(cherokee['carbon-copy'], /Cc:/);
assert.match(cherokee.Node_heap_total_heap_size, /Node.*heap/);
assert.match(cherokee['custom-legal-notice-link-url'], /URL/);
assert.match(cherokee['attachment-move-storage-gridfs'], /GridFS/);
assert.match(cherokee['attachment-move-storage-s3'], /S3/);
assert.match(cherokee.newLineNewItem, /=/);
assert.match(cherokee['attachment-repair-locations-description'], /GridFS/);
assert.match(cherokee['move-all-attachments-of-board-to-s3'], /S3/);
assert.match(cherokee['gridfs-file-id'], /GridFS.*ID/);
assert.match(cherokee['mongodb-compact-description'], /MongoDB.*GridFS.*Compact/);
assert.match(cherokee['mongodb-compact-warning'], /Meteor/);
assert.deepEqual(tokens(cherokee['drag-board-to-workspace']), ['__workspaces__']);
assert.match(cherokee['preview-pdf-not-supported'], /PDF/);
assert.match(cherokee['show-week-of-year'], /ISO 8601/);
assert.match(cherokee['import-board-zip'], /\.zip.*JSON/);
assert.match(cherokee['convert-to-markdown'], /Markdown/);
assert.match(cherokee['accounts-lockout-no-locked-users'], /ᎬᏗᏍᎩ/);
assert.match(cherokee['accounts-lockout-confirm-unlock-all'], /ᏂᎦᏛ/);
assert.match(cherokee['attachments-path-description'], /ᏅᏃᏓ/);
assert.match(cherokee['board-backup-scheduled'], /ᎣᏍᏓ/);
assert.match(cherokee['cron-job-delete-confirm'], /\?/);
assert.match(cherokee['s3-force-path-style-description'], /MinIO.*AWS.*S3/);
assert.deepEqual(tokens(cherokee['database-migration-confirm']), ['__db__']);
assert.match(
  cherokee['database-migration-description'],
  /mongodb:\/\/127\.0\.0\.1:27018.*WEKAN_FERRETDB_URL.*MONGO_URL/s,
);
assert.match(cherokee['sandstorm-migration-description'], /MongoDB 3.*SQLite/s);
assert.match(
  cherokee['cards-loading-description'],
  /CARDS_LOADING.*CARDS_LOADING_LAZY_THRESHOLD/,
);
assert.deepEqual(
  tags(cherokee['render-links-as-plain-text-description']),
  ['<a href>'],
);
assert.match(cherokee['always-show-code-as-text-description'], /<!-- -->/);
assert.match(cherokee['disable-import-avatars-description'], /LDAP.*OIDC\/OAuth2/);
assert.match(cherokee['backup-description'], /backup\/YYYY\/MM\/DD\/HH_MM_SS\/backup\.zip/);
assert.match(cherokee['backup-time'], /HH:MM/);
assert.match(cherokee['gcs-key-filename-description'], /JSON/);
assert.match(cherokee['gcs-permissions-note'], /client_email.*Storage Object Admin/);
assert.match(cherokee['s3-endpoint-menu-path'], /MinIO.*Cloudflare R2.*Backblaze B2/);
assert.match(cherokee['gcs-credentials-menu-path'], /IAM & Admin.*JSON/);
assert.match(cherokee['gridfs-enabled-description'], /MongoDB GridFS/);
assert.match(cherokee['gridfs-move-collectionfs-note'], /CollectionFS/);
assert.match(cherokee['s3-region-description'], /us-east-1/);
assert.match(cherokee['s3-ssl-enabled-description'], /SSL\/TLS/);
assert.match(cherokee['card-show-lists-on-minicard'], /ᎤᏍᏗ ᎪᏪᎵ/);
assert.match(cherokee['restore-lost-cards-migration-description'], /swimlaneId.*listId/);
assert.match(cherokee['fix-avatar-urls-migration-description'], /URLs/);
assert.match(cherokee['run-restore-all-archived-migration-confirm'], /IDs.*\?/);
assert.match(cherokee['step-fix-attachment-urls'], /URLs/);
assert.match(cherokee['step-fix-file-urls'], /URLs/);
assert.match(cherokee['cpu-cores'], /CPU/);
assert.match(cherokee['filesystem-attachments'], /Filesystem/);
assert.match(cherokee['gridfs-attachments'], /GridFS/);
assert.match(cherokee['every-30-minutes'], /30/);
assert.match(cherokee['migration-batch-size-description'], /1-100/);
assert.match(cherokee['migration-cpu-threshold-description'], /10-90/);
assert.match(cherokee['migration-delay-ms-description'], /100-10000/);
assert.match(cherokee['migrate-all-to-gridfs'], /GridFS/);
assert.match(cherokee['migrate-all-to-s3'], /S3/);
