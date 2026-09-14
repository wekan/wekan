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
assert.equal(locales.br['edit-wip-limit'], 'Kemmañ ar vevenn WIP');
assert.equal(locales.br['enable-wip-limit'], 'Gweredekaat ar vevenn WIP');
assert.equal(locales.br['setWipLimitPopup-title'], 'Termeniñ ar vevenn WIP');
assert.equal(locales.br['wipLimitErrorPopup-title'], 'Bevenn WIP didalvoudek');
assert.equal(locales.br['wip-limit-groups'], 'Strolladoù bevennoù WIP');
assert.doesNotMatch(locales.br['wip-limit-groups'], /Gweredekaat|Activer|Roll/);
assert.equal(locales.br['disable-webhook'], 'Diweredekaat ar webhook-mañ');
for (const key of ['edit-wip-limit', 'enable-wip-limit', 'setWipLimitPopup-title',
  'wipLimitErrorPopup-title', 'wip-limit-groups', 'disable-webhook']) {
  assert.doesNotMatch(locales.br[key], /Éditer|Activer|Définir|Limite.*invalide|Désactiver/);
}
assert.equal(locales.br.optional, 'Diret');
assert.equal(locales.br['wip-limit-group-name-placeholder'], 'Anv ar strollad (diret)');
assert.equal(locales.br.fullname, 'Anv klok');
assert.equal(locales.br.displayName, 'Anv da ziskwel');
assert.equal(locales.br.shortName, 'Anv berr');
assert.equal(new Set([locales.br.fullname, locales.br.displayName, locales.br.shortName]).size, 3);
for (const key of ['optional', 'wip-limit-group-name-placeholder',
  'fullname', 'displayName', 'shortName']) {
  assert.doesNotMatch(locales.br[key], /optionnel|Nom complet|Nom Court|Affichage/);
}
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

assert.equal(locales.br['custom-product-name'], 'Anv personelaet ar produ');
assert.doesNotMatch(locales.br['custom-product-name'], /Nom|personnalisé/);
assert.match(locales.br['custom-product-name'], /ar produ$/, 'preserve product qualifier');
assert.notEqual(locales.br['custom-product-name'], locales.br.fullname);

assert.equal(locales.br['repository-name'], 'Anv ar mirlec’h');
assert.equal(locales.br['no-repositories'], 'N’eus bet kavet mirlec’h ebet');
assert.equal(locales.br['create-repository'], 'Krouiñ ur mirlec’h');
for (const key of ['repository-name', 'no-repositories', 'create-repository']) {
  assert.doesNotMatch(locales.br[key], /Nom du|Aucun dépôt|Créer/);
  assert.match(locales.br[key], /mirlec’h/);
}
assert.equal(new Set(['repository-name', 'no-repositories', 'create-repository'].map(k => locales.br[k])).size, 3);

assert.equal(locales.br['operator-modified'], 'kemmet');
assert.equal(locales.br['predicate-modified'], 'kemmet');
assert.equal(locales.br['last-modified'], 'Kemm diwezhañ');
assert.equal(locales.br['list-label-modifiedAt'], 'Eur ar moned diwezhañ');
assert.notEqual(locales.br['last-modified'], locales.br['list-label-modifiedAt'], 'last access is distinct from modification');
for (const key of ['operator-modified', 'predicate-modified', 'last-modified', 'list-label-modifiedAt']) {
  assert.doesNotMatch(locales.br[key], /modifiée|Dernière|Dernier accès/);
}

for (const key of ['accessibility', 'accessibility-title', 'accessibility-content',
  'accessibility-page-enabled', 'accessibility-info-not-added-yet']) {
  assert.match(locales.br[key], /[Hh]aezadusted/, 'accessibility uses its noun, not the access verb');
  assert.doesNotMatch(locales.br[key], /haeziñ|Accessibilité|Titre d'accessibilité|Contenu d'accessibilité/);
}
assert.match(locales.br['accessibility-title'], /^Titl /);
assert.match(locales.br['accessibility-content'], /^Endalc’had /);
assert.match(locales.br['accessibility-page-enabled'], /gweredekaet$/);
assert.match(locales.br['accessibility-info-not-added-yet'], /^N’eo ket.*ouzhpennet.*c’hoazh$/);
assert.notEqual(locales.br['accessibility-title'], locales.br['accessibility-content']);

assert.equal(locales.br.modifiedAt, 'Kemmet da');
assert.equal(locales.br['last-modified-at'], 'Kemm diwezhañ da');
assert.equal(locales.br['last-activity'], 'Oberiantiz diwezhañ');
assert.equal(locales.br['last-run'], 'Erounezadur diwezhañ');
for (const key of ['modifiedAt', 'last-modified-at', 'last-activity', 'last-run']) {
  assert.doesNotMatch(locales.br[key], /Modifié|Dernière|activité|exécution/);
}
assert.equal(new Set(['modifiedAt', 'last-modified-at', 'last-activity', 'last-run'].map(k => locales.br[k])).size, 4);
assert.match(locales.br['last-modified-at'], /diwezhañ/, 'retain last-modification qualifier');

const wipActions = {
  apply: 'Arloañ',
  'wip-limit-group-add': 'Ouzhpennañ ur strollad bevennoù WIP',
  'wip-limit-group-select-swimlane': 'Dibab ur vandenn',
  'wip-limit-group-apply-swimlane': 'Arloañ ouzh ar vandenn',
};
for (const [key, value] of Object.entries(wipActions)) {
  assert.equal(locales.br[key], value);
  assert.doesNotMatch(value, /Appliquer|Activer|Sélectionner|tableau/);
}
assert.match(locales.br['wip-limit-group-add'], /strollad.*WIP/);
assert.notEqual(locales.br['wip-limit-group-add'], locales.br['enable-wip-limit']);
assert.notEqual(locales.br['wip-limit-group-select-swimlane'],
  locales.br['wip-limit-group-apply-swimlane']);
const sidebar = fs.readFileSync(path.join(root, 'client/components/sidebar/sidebar.jade'), 'utf8');
assert.match(sidebar, /option\(value=""\) \{\{_ 'wip-limit-group-select-swimlane'\}\}/);
assert.match(sidebar, /button\.js-wip-limit-group-apply-swimlane[^\n]*wip-limit-group-apply-swimlane/);
assert.match(sidebar, /input\.js-wip-limit-group-new-save[^\n]*wip-limit-group-add/);

// Native software vocabulary replaces French prose consistently across fields.
const nativeControls = {
  "details": "Munudoù",
  "cron-error-details": "Munudoù",
  "migration-progress-details": "Munudoù",
  "file": "Restr",
  "move-progress-file": "Restr",
  "text": "Testenn",
  "translation-text": "Testenn troet",
  "translation": "Troidigezh",
  "history": "Istor",
  "confirm": "Kadarnaat",
  "confirm-btn": "Kadarnaat",
  "subject": "Danvez",
  "server": "Servijer",
  "computer": "Urzhiataer"
};
for (const [key, value] of Object.entries(nativeControls)) {
  assert.equal(locales.br[key], value);
  assert.doesNotMatch(value, /Détails|Fichier|Texte|Traduction|Historique|Confirmer|Sujet|Serveur|Ordinateur/);
}
assert.equal(locales.br.details, locales.br['cron-error-details']);
assert.equal(locales.br.details, locales.br['migration-progress-details']);
assert.equal(locales.br.file, locales.br['move-progress-file']);
assert.equal(locales.br.confirm, locales.br['confirm-btn']);
assert.notEqual(locales.br.text, locales.br['translation-text']);

// OPLB color senses: shared French spelling does not invalidate Breton gris.
assert.equal(locales.br['color-darkgreen'], 'gwer teñval');
assert.equal(locales.br['color-gold'], 'aour');
assert.equal(locales.br['color-silver'], "arc'hant");
assert.equal(locales.br['color-gray'], 'gris');
assert.doesNotMatch(locales.br['color-darkgreen'], /vert|sklaer/);
assert.doesNotMatch(locales.br['color-gold'], /^or$/);
assert.doesNotMatch(locales.br['color-silver'], /^argent$/);
assert.equal(new Set(['darkgreen', 'gold', 'silver', 'gray'].map(color => locales.br['color-' + color])).size, 4);

assert.equal(locales.br['color-white'], 'gwenn');
assert.doesNotMatch(locales.br['color-white'], /blanc|gris|arc'hant/);
assert.notEqual(locales.br['color-white'], locales.br['color-gray']);
assert.notEqual(locales.br['color-white'], locales.br['color-silver']);

// Native software vocabulary: return action, home, default, text and templates.
for (const [key, value] of Object.entries({"back":"Distreiñ","home":"Degemer","font-size-default":"Dre ziouer","custom-field-text":"Testenn","templates":"Patromoù","allboards.templates":"Patromoù"})) {
  assert.equal(locales.br[key], value);
  assert.doesNotMatch(locales.br[key], /Retour|Accueil|Défaut|Texte|Modèles/);
}
assert.equal(locales.br.templates, locales.br['allboards.templates']);
assert.equal(locales.br['custom-field-text'], locales.br.text);
assert.notEqual(locales.br.back, locales.br.home);

for (const [key, value] of Object.entries({"custom-field-dropdown-none":"(hini ebet)","custom-field-dropdown-unknown":"(dianav)","allboards.workspace-color":"Liv"})) {
  assert.equal(locales.br[key], value);
  assert.doesNotMatch(locales.br[key], /aucun|inconnu|Couleur/);
}
assert.notEqual(locales.br['custom-field-dropdown-none'], locales.br['custom-field-dropdown-unknown']);

for (const [key, value] of Object.entries({"cards-count-one":"Kartenn","cardType-card":"Kartenn","custom-field-number":"Niver"})) {
 assert.equal(locales.br[key], value);
 assert.doesNotMatch(locales.br[key], /Carte|Nombre/);
}
assert.equal(locales.br['cards-count-one'], locales.br['cardType-card']);
assert.notEqual(locales.br['custom-field-number'], locales.br['custom-field-text']);

for (const [key, value] of Object.entries({"preview":"Rakwelet","discard":"Nullañ","unset-color":"Dilemel","comment":"Ouzhpennañ un evezhiadenn"})) {
 assert.equal(locales.br[key], value);
 assert.doesNotMatch(locales.br[key], /Prévisualiser|corbeille|Enlever|Commenter/);
}
assert.notEqual(locales.br.comment, locales.br.comments);
assert.notEqual(locales.br.preview, locales.br.discard);

for (const [key, value] of Object.entries({"custom-field-checkbox":"Log askañ","custom-field-dropdown":"Roll diskenn","custom-field-dropdown-options":"Dibarzhioù ar roll","custom-fields":"Maeziennoù personelaet"})) {
 assert.equal(locales.br[key], value);
 assert.doesNotMatch(locales.br[key], /Case à cocher|Liste de choix|Options de liste|Champs personnalisés/);
}
assert.ok(locales.br['custom-field-dropdownMultiSelect'].startsWith(locales.br['custom-field-dropdown']));
assert.notEqual(locales.br['custom-field-dropdown'], locales.br['custom-field-checkbox']);

for (const [key, value] of Object.entries({"zoom-in":"Brasaat","zoom-out":"Bihanaat","zoom-level":"Live zoum"})) {
 assert.equal(locales.br[key], value);
 assert.doesNotMatch(locales.br[key], /Agrandir|Réduire|Niveau/);
}
assert.notEqual(locales.br['zoom-in'], locales.br['zoom-out']);
assert.ok(locales.br['enter-zoom-level'].includes(locales.br['zoom-level'].toLowerCase()));

assert.equal(locales.br['custom-field-currency'], 'Moneiz');
assert.equal(locales.br['custom-field-currency-option'], 'Kod moneiz');
assert.doesNotMatch(locales.br['custom-field-currency-option'], /Code|devise/);
assert.doesNotMatch(locales.br['custom-field-currency'], /Devise/);
assert.notEqual(locales.br['custom-field-currency'], locales.br['custom-field-currency-option']);

// The string formatter is distinct from an ordinary text field.
assert.equal(locales.br['custom-field-stringtemplate'], 'Patrom chadenn');
assert.doesNotMatch(locales.br['custom-field-stringtemplate'], /Modèle|chaîne/);
assert.notEqual(locales.br['custom-field-stringtemplate'], locales.br['custom-field-text']);
