const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const locales = {};

for (const language of ['br', 'lt', 'yi']) {
  const result = spawnSync(process.execPath, [fillScript, '--list', language], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '{}\n');
  locales[language] = JSON.parse(
    fs.readFileSync(
      path.join(root, `imports/i18n/data/${language}.i18n.json`),
      'utf8',
    ),
  );
}

assert.equal(locales.br['select-none'], 'Na ziuz hini ebet');
assert.equal(locales.br['email-address'], 'Chomlec’h postel');
assert.equal(locales.br['webhook-title'], 'Anv ar webhook');
assert.equal(locales.br['server-error'], 'Fazi ar servijer');
for (const key of ['email-address', 'webhook-title', 'server-error']) {
  assert.doesNotMatch(locales.br[key], /Adresse de courriel|Nom du|Erreur serveur/);
}
assert.equal(locales.lt['select-none'], 'Nieko nepasirinkti');
assert.equal(locales.yi['select-none'], 'גאָרנישט אויסקלייבן');
assert.match(locales.yi['office-logins'], /^[\u0590-\u05ff]+$/);

for (const locale of Object.values(locales)) {
  assert.match(locale['office-report-desc'], /IPv4.*IPv6/);
  assert.match(locale['api-no-calls'], /REST API.*WITH_API=true/);
}
assert.match(
  locales.br['globalSearch-instructions-operator-number'],
  /__operator_number__:<number>.*<number>/,
);

// Selection commands keep their distinct actions and reject the French seed.
assert.equal(locales.br['move-selection'], 'Dilec’hiañ an diuzad');
assert.equal(locales.br['copy-selection'], 'Eilañ an diuzad');
assert.notEqual(locales.br['move-selection'], locales.br['copy-selection']);
assert.equal(locales.br['filter-to-selection'], 'Ouzhpennañ ar c’hartennoù silet d’an diuzad');
assert.equal(locales.br['cardAttachmentsPopup-title'], 'Stagañ diouzh');
for (const key of ['move-selection', 'copy-selection', 'selection-color',
  'multi-selection', 'select-color', 'select-board', 'other-filters-label',
  'set-filter', 'cardAttachmentsPopup-title', 'filter-to-selection']) {
  assert.doesNotMatch(locales.br[key], /Déplacer|Copier|Couleur|Sélection|sélection|Autres filtres|Définir|Ajouter depuis|Filtre vers/);
}

assert.equal(locales.br['admin-people-filter-active'], locales.br['r-rule-enabled']);
assert.equal(locales.br['admin-people-filter-inactive'], locales.br['r-rule-disabled']);
assert.notEqual(locales.br['admin-people-filter-active'], locales.br['admin-people-filter-inactive']);
assert.equal(locales.br['step-validate-migration'], 'Kadarnaat an treuzkas roadennoù');
assert.equal(locales.br['shortcut-filter-my-cards'], 'Silañ ma c’hartennoù');
assert.equal(locales.br['shortcut-clear-filters'], 'Dilemel an holl siloù');
for (const key of ['shortcut-clear-filters', 'shortcut-filter-my-cards',
  'advanced-filter-label', 'step-validate-migration', 'admin-people-filter-show',
  'admin-people-filter-active', 'admin-people-filter-inactive', 'active']) {
  assert.doesNotMatch(locales.br[key], /Retirer|Filtrer|Filtre avancé|Valider|Afficher|Actif|Désactivé/);
}

assert.equal(locales.br['close'], 'Serriñ');
assert.equal(locales.br['sidebar-open'], 'Digeriñ ar varrenn gostez');
assert.equal(locales.br['sidebar-close'], 'Serriñ ar varrenn gostez');
assert.notEqual(locales.br['sidebar-open'], locales.br['sidebar-close']);
assert.equal(locales.br['moveChecklist'], 'Dilec’hiañ ar roll-gwiriañ');
assert.equal(locales.br['copyChecklist'], 'Eilañ ar roll-gwiriañ');
assert.notEqual(locales.br['moveChecklist'], locales.br['copyChecklist']);
assert.equal(locales.br['move-progress-cancel'], locales.br.cancel);
assert.equal(locales.br['r-import'], locales.br.import);
assert.match(locales.br['export-card-pdf'], / PDF$/);
assert.equal(locales.br['export-card'], locales.br['exportCardPopup-title']);
assert.equal(locales.br['chooseBoardSourcePopup-title'], locales.br['import-board-c']);
for (const key of ['close', 'close-board', 'close-card',
  'chooseBoardSourcePopup-title', 'import-board-c', 'r-import', 'export-card',
  'export-card-pdf', 'exportBoardPopup-title', 'exportCardPopup-title',
  'show-activities', 'show-on-card', 'sidebar-open', 'sidebar-close',
  'moveChecklist', 'copyChecklist', 'attachment-move', 'move-progress-cancel']) {
  assert.doesNotMatch(locales.br[key], /Fermer|Ouvrir|Importer|Exporter|Afficher|Déplacer|Copier|Annuler/);
}

assert.equal(locales.br['moveCardToBottom-title'], 'Dilec’hiañ d’an traoñ');
assert.equal(locales.br['moveCardToTop-title'], 'Dilec’hiañ d’al lein');
assert.notEqual(locales.br['moveCardToBottom-title'], locales.br['moveCardToTop-title']);
assert.equal(locales.br['linkCardToNewBoard'], 'Krouiñ un daolenn diwar ar gartenn-mañ');
assert.equal(locales.br['create-account'], 'Krouiñ ur gont');
assert.equal(locales.br['create-task'], 'Krouiñ un trevell');
assert.equal(locales.br['task'], 'Trevell');
assert.equal(locales.br['export-card-subtasks'], locales.br.subtasks);
assert.equal(locales.br['move-swimlane'], 'Dilec’hiañ ar vandenn');
assert.equal(locales.br['copy-swimlane'], 'Eilañ ar vandenn');
assert.notEqual(locales.br['move-swimlane'], locales.br['copy-swimlane']);
for (const key of ['label-create', 'linkCardToNewBoard',
  'moveCardToBottom-title', 'moveCardToTop-title', 'r-move-card-to',
  'r-create-card', 'create-task', 'move-swimlane', 'create-account', 'task',
  'copy-swimlane', 'accounts', 'export-card-subtasks',
  'add-existing-card-as-subtask-empty']) {
  assert.doesNotMatch(locales.br[key], /Créer|Déplacer|Tâche|Couloir|Comptes|Sous-tâches|Aucune carte/);
}

assert.equal(locales.br['board-view-swimlanes'], locales.br.swimlanes);
assert.equal(locales.br['accounts-lockout-status'], locales.br.status);
assert.equal(locales.br['accounts-lockout-locked-users'], 'Implijerien stanket');
assert.equal(locales.br['accounts-lockout-unlock-all'], 'Distankañ an holl implijerien');
assert.equal(locales.br['swimlane-title-not-found'], "Bandenn '%s' n’eo ket bet kavet.");
assert.equal(locales.br['default-subtasks-board'], 'Is-trevelloù evit taolenn __board__');
for (const key of ['board-view-swimlanes', 'swimlaneActionPopup-title',
  'no-archived-swimlanes', 'card-templates-swimlane', 'board-templates-swimlane',
  'subtaskActionsPopup-title', 'has-swimlanes', 'swimlane-title-not-found',
  'default-subtasks-board', 'accounts-lockout-locked-users',
  'accounts-lockout-status', 'accounts-lockout-unlock-all', 'no-archived-cards',
  'no-archived-lists', 'listActionPopup-title']) {
  assert.doesNotMatch(locales.br[key], /Couloir|couloir|Actions|Modèles|Sous-tâches|sous-tâche|Aucun|Aucune|Utilisateurs|Statut|déverrouiller/);
}

assert.equal(locales.br.error, 'Fazi');
assert.equal(locales.br.errors, 'Fazioù');
assert.equal(locales.br['migration-progress-status'], locales.br.status);
assert.equal(locales.br['problems-status-title'], locales.br.status);
assert.equal(locales.br['migration-complete'], locales.br.completed);
assert.equal(locales.br.complete, locales.br.completed);
assert.equal(new Set(['pending', 'migration-running', 'migration-complete',
  'migration-failed'].map(key => locales.br[key])).size, 4,
  'waiting, running, completed and failed remain distinct');
assert.equal(locales.br['accounts-lockout-failed-attempts'], 'Taolioù kennaskañ c’hwitet');
for (const key of ['accounts-lockout-failed-attempts', 'cron-migration-errors',
  'migration-failed', 'migration-progress-status', 'errors', 'error',
  'problems-status-title', 'cron-no-errors', 'migration-complete',
  'migration-running', 'pending', 'complete', 'no-cards-found', 'no-issues-found']) {
  assert.doesNotMatch(locales.br[key], /Tentatives|Erreurs|Erreur|échec|Statut|Aucune|Aucun|Terminé|En cours/);
}

assert.equal(locales.br['board-view-cal'], 'Deiziadur');
assert.equal(locales.br['board-view-lists'], 'Rolloù');
assert.equal(locales.br['board-view-table'], locales.br.board);
assert.equal(locales.br['board-view-collapse'], locales.br.collapse);
assert.equal(locales.br.collapse, 'Plegañ');
assert.equal(locales.br.uncollapse, 'Displegañ');
assert.notEqual(locales.br.collapse, locales.br.uncollapse);
assert.equal(locales.br.comments, 'Evezhiadennoù');
assert.equal(locales.br['no-comments'], 'Evezhiadenn ebet');
for (const key of ['board-view', 'board-view-cal', 'board-view-lists',
  'board-view-table', 'board-view-collapse', 'collapse', 'uncollapse',
  'comments', 'no-comments']) {
  assert.doesNotMatch(locales.br[key], /Vue du|Calendrier|Listes|Tableau|Réduire|Développer|Commentaires|Aucun commentaire/);
}
for (const key of ['board-view-gantt', 'board-view-gantt-frappe',
  'board-view-gantt-dhtmlx']) {
  assert.match(locales.br[key], /Gantt$/, 'proper chart/vendor names stay literal');
}
