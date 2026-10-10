// Guard all four Portuguese variants against current fill placeholders.
'use strict';
const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const node = process.execPath;
const fill = path.join(ROOT, 'releases/translations/fill-translations.mjs');
for (const language of ['pt-PT', 'pt', 'pt_PT', 'pt-BR']) {
  const remaining = JSON.parse(childProcess.execFileSync(node,
    [fill, '--list', language], { cwd: ROOT, encoding: 'utf8' }));
  assert.deepStrictEqual(remaining, {});
  const translated = JSON.parse(fs.readFileSync(path.join(ROOT,
    'imports/i18n/data', `${language}.i18n.json`), 'utf8'));
  assert.strictEqual(translated.officeReportTitle, 'Escritórios');
  assert.match(translated['api-report-desc'], /pontos finais|frequência/);
  assert.doesNotMatch(translated['office-no-results'], /Nobody|logged in/);
  assert.match(translated['api-no-calls'], /WITH_API=true/);
  assert.match(translated['custom-field-links-hint'], /mesmo nome e tipo nos dois/);
  assert.match(translated['custom-field-links-hint'], /único cartão permanecem inalterados/);
  assert.match(translated['custom-field-link-both'], /dois sentidos/);
  assert.match(translated['custom-field-link-send'], /só sentido.*cartão principal/);
  assert.match(translated['field-link-not-allowed'], /editar os dois cartões/);
  assert.match(translated['custom-field-link-inactive'], /arquivado/);
  assert.strictEqual(translated['import-members-mode-me'], 'Substituí-las todas por mim');
  assert.match(translated['import-many-boards-hint'], /sem associação de membros/);
  assert.match(translated['import-many-boards-hint'], /por si só uma exportação.*é um quadro/);
  assert.match(translated['export-all-boards-hint'], /pode exportar.*\.zip/);
  assert.match(translated['webhook-payload-description'], /configuração herdada.*sempre enviaram/);
  assert.match(translated['webhook-hide-identity'], /Omitir o meu nome/);
  assert.match(translated['notification-delivery-quiet'], /aguardar até terminarem/);
  assert.match(translated['r-wrike-workflow-note'], /concluído.*Completed.*Cancelled.*não concluído.*Active.*Deferred/);
  assert.match(translated['r-wrike-workflow-note'], /não podem ser exportadas/);
  for (const literal of ['GET /workflows', 'Active', 'Completed', 'Deferred', 'Cancelled']) {
    assert.ok(translated['r-wrike-workflow-note'].includes(literal), `${language}: ${literal}`);
  }
  assert.ok(translated['webhook-payload-field-standard'].includes('WEBHOOKS_ATTRIBUTES'));
  assert.notStrictEqual(translated['subtask-mark-done'], translated['subtask-mark-not-done']);
  if (language === 'pt-BR') {
    assert.match(translated['import-file-label'], /arquivo/);
    assert.match(translated['import-members-mode-map'], /usuário/);
    assert.match(translated['csv-mapping-boards'], /planilha/);
    assert.strictEqual(translated['notification-delivery-part-swimlane'], 'Raia');
    assert.match(translated['attach-card-hint'], /um link/);
  } else {
    assert.match(translated['import-file-label'], /ficheiro/);
    assert.match(translated['import-members-mode-map'], /utilizador/);
    assert.match(translated['csv-mapping-boards'], /folha/);
    assert.strictEqual(translated['notification-delivery-part-swimlane'], 'Pista');
    assert.match(translated['attach-card-hint'], /uma ligação/);
  }

}
console.log('upcomingPortugueseTranslationFill: full current fills and regional terminology verified');

const currentKeys = [
  "board-announcement",
  "board-announcement-enabled",
  "cards-use-list-color",
  "external-link-rules",
  "external-link-rules-description",
  "external-link-identifier-aliases",
  "read-only-field",
  "r-moved-forward",
  "r-moved-back",
  "scrum-import-into-board",
  "scrum-import-into-board-hint",
  "scrum-import-preview",
  "scrum-import-choose-file",
  "scrum-import-invalid-file",
  "scrum-import-preview-sprints",
  "scrum-import-preview-releases",
  "scrum-import-preview-cards",
  "scrum-import-preview-nothing",
  "scrum-import-into-board-done",
  "scrum-import-card-not-matched",
  "scrum-import-card-ambiguous",
  "scrum-import-card-on-another-board",
  "scrum-import-record-ambiguous",
  "scrum-import-record-not-imported",
  "scrum-import-sprint-finished",
  "sync-planning-sprint",
  "sync-planning-releases",
  "sync-planning-fields",
  "sync-planning-hint",
  "interrupted-import-heading",
  "interrupted-import-description",
  "interrupted-import-board",
  "interrupted-import-progress",
  "interrupted-import-created",
  "interrupted-import-source",
  "interrupted-import-state-stopped",
  "interrupted-import-state-failed",
  "interrupted-import-state-discarding",
  "interrupted-import-scrum",
  "interrupted-import-counts",
  "interrupted-import-no-board",
  "interrupted-import-keep",
  "interrupted-import-discard",
  "interrupted-import-keep-confirm",
  "interrupted-import-discard-confirm",
  "interrupted-import-refresh",
  "interrupted-import-empty",
  "interrupted-import-truncated",
  "interrupted-import-unavailable",
  "interrupted-import-missing",
  "interrupted-import-not-interrupted",
  "interrupted-import-foreign-board",
  "interrupted-import-scrum-busy",
  "interrupted-import-failed",
  "scrum-history-checkpoint-stuck",
  "scrum-history-checkpoint-counts",
  "scrum-history-checkpoint-hint",
  "scrum-history-checkpoint-rollback",
  "scrum-history-checkpoint-discard",
  "scrum-history-checkpoint-discard-confirm",
  "scrum-history-checkpoint-ask-admin",
  "import-board-instruction-opml",
  "import-board-instruction-orgmode",
  "import-board-instruction-todoist",
  "r-assignee",
  "r-add-actinguser-assignee",
  "r-remove-all-assignees",
  "ldap-sync-now",
  "ldap-sync-now-done",
  "ldap-sync-now-error",
  "ldap-sync-now-nothing",
  "oauth-providers-allowed-email-domains",
  "scrum-release-scope",
  "scrum-releases-select-help",
  "stuck-sync-operation-heading",
  "stuck-sync-operation-description",
  "stuck-sync-operation-list",
  "stuck-sync-operation-progress",
  "stuck-sync-operation-reason",
  "stuck-sync-operation-applied",
  "stuck-sync-operation-reason-scope-changed",
  "stuck-sync-operation-reason-access-denied",
  "stuck-sync-operation-reason-trigger-unknown",
  "stuck-sync-operation-reason-intent-missing",
  "stuck-sync-operation-reason-unknown",
  "stuck-sync-operation-replayable-now",
  "stuck-sync-operation-discard",
  "stuck-sync-operation-discard-confirm",
  "stuck-sync-operation-refresh",
  "stuck-sync-operation-empty",
  "stuck-sync-operation-truncated",
  "stuck-sync-operation-unavailable",
  "stuck-sync-operation-missing",
  "stuck-sync-operation-not-stuck",
  "stuck-sync-operation-replayable",
  "stuck-sync-operation-busy",
  "stuck-sync-operation-failed"
];

(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const english = JSON.parse(fs.readFileSync(path.join(ROOT, 'imports/i18n/data/en.i18n.json'), 'utf8'));
  for (const language of ['pt', 'pt-PT', 'pt_PT', 'pt-BR']) {
    const translated = JSON.parse(fs.readFileSync(path.join(ROOT,
      'imports/i18n/data', `${language}.i18n.json`), 'utf8'));
    assert.deepStrictEqual(Object.keys(translated), Object.keys(english), language);
    for (const key of Object.keys(english)) {
      assert.deepStrictEqual(translationTokens(translated[key]), translationTokens(english[key]), `${language}:${key}`);
    }
    for (const key of ['filter-column-age-hint', 'scrum-total', 'sync-preview-saved',
      'email-recovery-description', 'activity-recovery-busy', 'saml-login-not-started',
      'r-rule-any-trigger-help', 'r-add-trigger-to-rule', 'r-add-action-to-rule', 'r-remove-rule-part']) {
      assert.ok(translated[key]?.trim(), key);
      assert.notStrictEqual(translated[key], english[key], `${language}:${key}`);
    }
    assert.deepStrictEqual(JSON.parse(childProcess.execFileSync(node,
      [fill, '--list', language], { cwd: ROOT, encoding: 'utf8' })), {});
    for (const key of currentKeys) {
      assert.ok(translated[key]?.trim(), `${language}:${key}`);
      assert.notStrictEqual(translated[key], english[key], `${language}:${key} remains English`);
    }
    assert.match(translated['scrum-import-into-board-hint'], /nunca duplicados/);
    assert.match(translated['scrum-import-into-board-hint'], /pelo ID ou pelo número do cartão e título/);
    assert.match(translated['scrum-import-card-on-another-board'], /deixado inalterado/);
    assert.match(translated['scrum-import-sprint-finished'], /não foi movido/);
    assert.match(translated['sync-planning-hint'], /primeiro pelo seu ID.*depois pelo nome/);
    assert.match(translated['sync-planning-hint'], /primeira sincronização nunca remove/);
    assert.match(translated['interrupted-import-description'], /não pode ser retomada/);
    assert.match(translated['interrupted-import-description'], /incluindo tudo o que foi adicionado desde então/);
    assert.match(translated['interrupted-import-keep-confirm'], /Nada é removido/);
    assert.match(translated['interrupted-import-discard-confirm'], /removidos permanentemente/);
    assert.match(translated['interrupted-import-truncated'], /50 mais antigas/);
    assert.match(translated['interrupted-import-foreign-board'], /não foi alterado/);
    assert.match(translated['scrum-history-checkpoint-hint'], /só é proposta quando ninguém mais/);
    assert.match(translated['scrum-history-checkpoint-hint'], /sem alterar qualquer regist/);
    assert.match(translated['scrum-history-checkpoint-discard-confirm'], /já escreveu/);
    assert.notStrictEqual(translated['r-moved-forward'], translated['r-moved-back']);
    assert.match(translated['scrum-import-choose-file'], language === 'pt-BR' ? /arquivo/ : /ficheiro/);
    assert.match(translated['interrupted-import-counts'], language === 'pt-BR' ? /raias/ : /pistas/);
    assert.match(translated['sync-planning-sprint'], language === 'pt-BR' ? /planejamento/ : /planeamento/);
    for (const literal of ['{number}', '{identifier}', '[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}']) {
      assert.ok(translated['external-link-rules-description'].includes(literal), `${language}: preserve ${literal}`);
    }
    assert.ok(translated['external-link-identifier-aliases'].includes('TK=Task, IN=Incident'));
    for (const name of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) {
      assert.ok(translated['ldap-sync-now-nothing'].includes(name), `${language}:${name}`);
    }
    assert.match(translated['scrum-releases-select-help'], /várias versões/);
    assert.match(translated['scrum-releases-select-help'], /todas as versões/);
    assert.match(translated['stuck-sync-operation-description'], /compara novamente a lista com a sua origem/);
    assert.match(translated['stuck-sync-operation-discard-confirm'], /já aplicadas são mantidas/);
    assert.match(translated['stuck-sync-operation-discard-confirm'], /nunca são escritas/);
    assert.match(translated['stuck-sync-operation-replayable-now'], /não pode ser descartada/);
    assert.match(translated['stuck-sync-operation-replayable'], /não foi descartada/);
    assert.match(translated['stuck-sync-operation-truncated'], /50 mais antigas/);
    assert.match(translated['ldap-sync-now'], language === 'pt-BR' ? /usuários/ : /utilizadores/);
    assert.match(translated['import-board-instruction-orgmode'], language === 'pt-BR' ? /arquivo/ : /ficheiro/);
    for (const literal of ['TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED']) {
      assert.ok(translated['import-board-instruction-orgmode'].includes(literal), `${language}:${literal}`);
    }
    for (const literal of ['@labels', 'p1', 'p3', 'CSV']) {
      assert.ok(translated['import-board-instruction-todoist'].includes(literal), `${language}:${literal}`);
    }
    assert.match(translated['filter-preset-save'], language === 'pt-BR' ? /Salvar/ : /Guardar/);
    assert.match(translated['r-vars-people-hint'], language === 'pt-BR' ? /usuário.*raias/ : /utilizador.*pistas/);
  }
  console.log('upcomingPortugueseTranslationFill: all four locales preserve keys, tokens and regional terminology');
})().catch(error => { console.error(error); process.exitCode = 1; });
