// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const locales = {};

for (const language of ['br', 'lt', 'yi']) {
  const result = spawnSync(process.execPath, [fillScript, '--completed-catalog', '--list', language], {
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
const lt = locales.lt;
const english = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
for (const key of Object.keys(english).filter(key => /^(interrupted-import-|stuck-sync-operation-|scrum-import-|sync-planning-|scrum-history-checkpoint-|ldap-sync-now)/.test(key))) {
  assert.notEqual(lt[key], english[key], key);
  assert.ok(lt[key].trim(), key);
}
assert.match(lt['interrupted-import-description'], /tęsti negalima/);
assert.match(lt['interrupted-import-description'], /įskaitant viską, kas pridėta vėliau/);
assert.match(lt['interrupted-import-keep-confirm'], /Niekas nepašalinama/);
assert.match(lt['interrupted-import-discard-confirm'], /pašalinti visam laikui/);
assert.match(lt['interrupted-import-foreign-board'], /ji nebuvo pakeista/);
assert.match(lt['interrupted-import-truncated'], /50 seniausių/);
assert.match(lt['stuck-sync-operation-description'], /jau pritaikyti pakeitimai išlieka/);
assert.match(lt['stuck-sync-operation-description'], /niekada neįrašomi/);
assert.match(lt['stuck-sync-operation-replayable-now'], /atmesti negalima/);
assert.match(lt['stuck-sync-operation-replayable'], /nebuvo atmesta/);
assert.match(lt['scrum-import-into-board-hint'], /niekada nedubliuojami/);
assert.match(lt['scrum-import-card-on-another-board'], /palikta nepakeista/);
assert.match(lt['scrum-import-sprint-finished'], /nebuvo perkelta/);
assert.match(lt['sync-planning-hint'], /pirmiausia pagal šaltinio ID, tada pagal pavadinimą/);
assert.match(lt['sync-planning-hint'], /pirmasis sinchronizavimas niekada nepašalina/);
assert.match(lt['scrum-history-checkpoint-hint'], /niekas kitas nepakeitė/);
assert.match(lt['scrum-history-checkpoint-hint'], /nepakeičiamas nė vienas įrašas/);
assert.match(lt['scrum-history-checkpoint-discard-confirm'], /jau įrašė/);
assert.match(lt['ldap-sync-now-nothing'], /LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS/);
assert.match(lt['ldap-sync-now-nothing'], /LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED/);
assert.ok(lt['external-link-rules-description'].includes('[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
assert.ok(lt['external-link-identifier-aliases'].includes('TK=Task, IN=Incident'));
assert.match(lt['r-moved-forward'], /pirmyn/);
assert.match(lt['r-moved-back'], /atgal/);
assert.match(lt['login-origin-mismatch'], /ROOT_URL/);
assert.match(lt['login-setting-env-only'], /tik serverio aplinka/);
(async () => {
  assert.deepEqual(Object.keys(lt), Object.keys(english));
  for (const key of Object.keys(english)) {
    assert.deepEqual(translationTokens(lt[key]), translationTokens(english[key]), key);
  }
  console.log('Lithuanian recovery decisions, source order and variable inventory pass');
})().catch(error => { console.error(error); process.exitCode = 1; });
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

const yiddishBlocklyControls = ["blockly-ALT_KEY", "blockly-BACKSPACE_KEY", "blockly-CANNOT_DELETE_VARIABLE_PROCEDURE", "blockly-CAPS_LOCK_KEY", "blockly-CHANGE_VALUE_TITLE", "blockly-CLEAN_UP", "blockly-CLOSE_BACKPACK", "blockly-COLLAPSED_WARNINGS_WARNING", "blockly-COLLAPSE_ALL", "blockly-COLLAPSE_BLOCK", "blockly-COLOUR_BLEND_COLOUR1", "blockly-COLOUR_BLEND_COLOUR2", "blockly-COLOUR_BLEND_RATIO", "blockly-COLOUR_BLEND_TITLE", "blockly-COLOUR_BLEND_TOOLTIP", "blockly-COLOUR_PICKER_TOOLTIP", "blockly-COLOUR_RANDOM_TITLE", "blockly-COLOUR_RANDOM_TOOLTIP", "blockly-COLOUR_RGB_BLUE", "blockly-COLOUR_RGB_GREEN", "blockly-COLOUR_RGB_RED", "blockly-COLOUR_RGB_TITLE", "blockly-COLOUR_RGB_TOOLTIP", "blockly-COMMAND_KEY", "blockly-CONTEXT_MENU_KEY", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_WARNING", "blockly-CONTROLS_FOREACH_TITLE", "blockly-CONTROLS_FOREACH_TOOLTIP", "blockly-CONTROLS_FOR_TITLE", "blockly-CONTROLS_FOR_TOOLTIP", "blockly-CONTROLS_IF_ELSEIF_TOOLTIP", "blockly-CONTROLS_IF_ELSE_TOOLTIP", "blockly-CONTROLS_IF_IF_TOOLTIP", "blockly-CONTROLS_IF_MSG_ELSE", "blockly-CONTROLS_IF_MSG_ELSEIF", "blockly-CONTROLS_IF_TOOLTIP_1", "blockly-CONTROLS_IF_TOOLTIP_2", "blockly-CONTROLS_IF_TOOLTIP_3", "blockly-CONTROLS_IF_TOOLTIP_4", "blockly-CONTROLS_REPEAT_TITLE", "blockly-CONTROLS_REPEAT_TOOLTIP", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_UNTIL", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_WHILE", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE", "blockly-CONTROL_KEY", "blockly-COPY_ALL_TO_BACKPACK", "blockly-COPY_SHORTCUT", "blockly-COPY_TO_BACKPACK", "blockly-CURRENT_BLOCK_ANNOUNCEMENT", "blockly-CUT_SHORTCUT", "blockly-DELETE_ALL_BLOCKS", "blockly-DELETE_BLOCK", "blockly-DELETE_VARIABLE", "blockly-DELETE_VARIABLE_CONFIRMATION", "blockly-DELETE_X_BLOCKS", "blockly-DISABLE_BLOCK", "blockly-DUPLICATE_BLOCK", "blockly-DUPLICATE_COMMENT", "blockly-EDIT_BLOCK_CONTENTS", "blockly-EMPTY_BACKPACK"];
for (const key of yiddishBlocklyControls) {
  assert.notEqual(locales.yi[key], english[key], key);
  assert.match(locales.yi[key], /[\u0590-\u05ff]/, key);
  assert.deepEqual(translationTokens(locales.yi[key]), translationTokens(english[key]), key);
}
assert.equal(locales.yi['blockly-COLOUR_RGB_BLUE'], 'בלוי');
assert.equal(locales.yi['blockly-COLOUR_RGB_GREEN'], 'גרין');
assert.equal(locales.yi['blockly-COLOUR_RGB_RED'], 'רויט');
assert.match(locales.yi['blockly-COLOUR_BLEND_TOOLTIP'], /0\.0 - 1\.0/);
assert.match(locales.yi['blockly-COLOUR_RGB_TOOLTIP'], /צווישן 0 און 100/);
assert.match(locales.yi['blockly-CANNOT_DELETE_VARIABLE_PROCEDURE'], /קען נישט אויסמעקן/);
assert.match(locales.yi['blockly-CONTROLS_FLOW_STATEMENTS_WARNING'], /נאָר אינעווייניק אין אַ שלייף/);
assert.match(locales.yi['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL'], /פֿאַלש/);
assert.match(locales.yi['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE'], /אמת/);
assert.notEqual(locales.yi['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL'], locales.yi['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE']);
assert.match(locales.yi['blockly-CONTROLS_IF_TOOLTIP_4'], /אויב קיין ווערט איז נישט אמת/);

const yiddishBlocklyFields = ["blockly-ENABLE_BLOCK", "blockly-END_KEY", "blockly-ENTER_KEY", "blockly-ESCAPE", "blockly-EXPAND_ALL", "blockly-EXPAND_BLOCK", "blockly-EXTERNAL_INPUTS", "blockly-FIELD_BITMAP_ARIA_VALUE", "blockly-FIELD_BITMAP_BUTTON_LABEL_CLEAR", "blockly-FIELD_BITMAP_BUTTON_LABEL_RANDOMIZE", "blockly-FIELD_BITMAP_PIXEL_LABEL", "blockly-FIELD_BITMAP_PIXEL_OFF", "blockly-FIELD_LABEL_EDIT_PREFIX", "blockly-FIELD_LABEL_EMPTY", "blockly-FIELD_LABEL_OPTION_INDEX", "blockly-FIELD_LABEL_VARIABLE", "blockly-FIELD_MULTILINEINPUT_FINISH_EDITING", "blockly-FIELD_MULTILINEINPUT_NEW_LINE", "blockly-HELP_PROMPT", "blockly-HOME_KEY", "blockly-ICON_LABEL_COMMENT_CLOSED", "blockly-ICON_LABEL_COMMENT_OPEN", "blockly-ICON_LABEL_DEFAULT", "blockly-ICON_LABEL_MUTATOR_CLOSED", "blockly-ICON_LABEL_MUTATOR_OPEN", "blockly-ICON_LABEL_WARNING_CLOSED", "blockly-ICON_LABEL_WARNING_OPEN", "blockly-INLINE_INPUTS", "blockly-INPUT_LABEL_CONDITION", "blockly-INPUT_LABEL_CONDITION_A", "blockly-INPUT_LABEL_CONDITION_B", "blockly-INPUT_LABEL_EMPTY", "blockly-INPUT_LABEL_END_STATEMENT", "blockly-INPUT_LABEL_INDEX", "blockly-INPUT_LABEL_LISTS_CREATE_WITH_ITEM", "blockly-INPUT_LABEL_LISTS_DELIMITER", "blockly-INPUT_LABEL_LISTS_END_POSITION", "blockly-INPUT_LABEL_LISTS_LIST_FROM_TEXT", "blockly-INPUT_LABEL_LISTS_POSITION", "blockly-INPUT_LABEL_LISTS_REPEAT_ITEM", "blockly-INPUT_LABEL_LISTS_REPEAT_NUM", "blockly-INPUT_LABEL_LISTS_START_POSITION", "blockly-INPUT_LABEL_LISTS_TEXT_FROM_LIST", "blockly-INPUT_LABEL_LISTS_TO_CHANGE", "blockly-INPUT_LABEL_LISTS_TO_CHECK", "blockly-INPUT_LABEL_LISTS_VALUE_TO_SET", "blockly-INPUT_LABEL_LOOP_BY", "blockly-INPUT_LABEL_LOOP_FROM", "blockly-INPUT_LABEL_LOOP_LIST", "blockly-INPUT_LABEL_LOOP_TIMES", "blockly-INPUT_LABEL_LOOP_TO", "blockly-INPUT_LABEL_MATH_CHANGE_BY", "blockly-INPUT_LABEL_MATH_CONSTRAIN_VALUE", "blockly-INPUT_LABEL_MATH_DIVIDEND", "blockly-INPUT_LABEL_MATH_DIVISOR", "blockly-INPUT_LABEL_NUMBER", "blockly-INPUT_LABEL_NUMBER_A", "blockly-INPUT_LABEL_NUMBER_ATAN2_X", "blockly-INPUT_LABEL_NUMBER_ATAN2_Y", "blockly-INPUT_LABEL_NUMBER_B", "blockly-INPUT_LABEL_NUMBER_LIST", "blockly-INPUT_LABEL_NUMBER_MAX", "blockly-INPUT_LABEL_NUMBER_MIN", "blockly-INPUT_LABEL_NUMBER_TO_CHECK", "blockly-INPUT_LABEL_STATEMENT"];
for (const key of yiddishBlocklyFields) {
  assert.notEqual(locales.yi[key], english[key], key);
  assert.match(locales.yi[key], /[\u0590-\u05ff]/, key);
  assert.deepEqual(translationTokens(locales.yi[key]), translationTokens(english[key]), key);
}
for (const [key, name] of [['END_KEY', 'End'], ['HOME_KEY', 'Home'], ['ENTER_KEY', 'Enter'], ['ESCAPE', 'Escape']]) {
  assert.ok(locales.yi[`blockly-${key}`].includes(name));
}
for (const type of ['COMMENT', 'WARNING']) {
  assert.match(locales.yi[`blockly-ICON_LABEL_${type}_CLOSED`], /עפֿענען/);
  assert.match(locales.yi[`blockly-ICON_LABEL_${type}_OPEN`], /פֿאַרמאַכן/);
}
assert.match(locales.yi['blockly-INPUT_LABEL_LISTS_START_POSITION'], /אָנהייב/);
assert.match(locales.yi['blockly-INPUT_LABEL_LISTS_END_POSITION'], /סוף/);
assert.match(locales.yi['blockly-INPUT_LABEL_LOOP_FROM'], /אָנהייב/);
assert.match(locales.yi['blockly-INPUT_LABEL_LOOP_TO'], /סוף/);
assert.match(locales.yi['blockly-INPUT_LABEL_NUMBER_ATAN2_X'], /^x/);
assert.match(locales.yi['blockly-INPUT_LABEL_NUMBER_ATAN2_Y'], /^y/);
assert.notEqual(locales.yi['blockly-INPUT_LABEL_MATH_DIVIDEND'], locales.yi['blockly-INPUT_LABEL_MATH_DIVISOR']);
assert.match(locales.yi['blockly-FIELD_BITMAP_PIXEL_LABEL'], /שורה %2, זייַל %3/);

const yiddishBlocklyLists = ["blockly-INPUT_LABEL_TEXT_APPEND", "blockly-INPUT_LABEL_TEXT_END_POSITION", "blockly-INPUT_LABEL_TEXT_JOIN_ITEM", "blockly-INPUT_LABEL_TEXT_POSITION", "blockly-INPUT_LABEL_TEXT_PROMPT_MESSAGE", "blockly-INPUT_LABEL_TEXT_START_POSITION", "blockly-INPUT_LABEL_TEXT_TO_CHANGE", "blockly-INPUT_LABEL_TEXT_TO_CHECK", "blockly-INPUT_LABEL_TEXT_TO_FIND", "blockly-INPUT_LABEL_TEXT_TO_REPLACE", "blockly-INPUT_LABEL_VALUE", "blockly-INPUT_LABEL_VALUE_A", "blockly-INPUT_LABEL_VALUE_B", "blockly-INPUT_LABEL_VARIABLES_SET", "blockly-INSERT_KEY", "blockly-KEYBOARD_NAV_BLOCK_NAVIGATION_HINT", "blockly-KEYBOARD_NAV_CONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_COPIED_HINT", "blockly-KEYBOARD_NAV_CUT_HINT", "blockly-KEYBOARD_NAV_FLYOUT_LABEL_HINT", "blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_WORKSPACE_NAVIGATION_HINT", "blockly-LISTS_CREATE_EMPTY_TITLE", "blockly-LISTS_CREATE_EMPTY_TOOLTIP", "blockly-LISTS_CREATE_WITH_CONTAINER_TITLE_ADD", "blockly-LISTS_CREATE_WITH_CONTAINER_TOOLTIP", "blockly-LISTS_CREATE_WITH_INPUT_WITH", "blockly-LISTS_CREATE_WITH_ITEM_TOOLTIP", "blockly-LISTS_CREATE_WITH_TOOLTIP", "blockly-LISTS_GET_INDEX_FIRST", "blockly-LISTS_GET_INDEX_FROM_END", "blockly-LISTS_GET_INDEX_GET", "blockly-LISTS_GET_INDEX_GET_REMOVE", "blockly-LISTS_GET_INDEX_LAST", "blockly-LISTS_GET_INDEX_RANDOM", "blockly-LISTS_GET_INDEX_REMOVE", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_RANDOM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_RANDOM", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_RANDOM", "blockly-LISTS_GET_SUBLIST_END_FROM_END", "blockly-LISTS_GET_SUBLIST_END_LAST"];
for (const key of yiddishBlocklyLists) {
  assert.notEqual(locales.yi[key], english[key], key);
  assert.match(locales.yi[key], /[\u0590-\u05ff]/, key);
  assert.deepEqual(translationTokens(locales.yi[key]), translationTokens(english[key]), key);
}
for (const position of ['FIRST', 'FROM', 'LAST', 'RANDOM']) {
  const prefix = 'blockly-LISTS_GET_INDEX_TOOLTIP_';
  assert.match(locales.yi[`${prefix}GET_${position}`], /גיט צוריק/);
  assert.doesNotMatch(locales.yi[`${prefix}GET_${position}`], /נעמט אַוועק/);
  assert.match(locales.yi[`${prefix}GET_REMOVE_${position}`], /נעמט אַוועק און גיט צוריק/);
  assert.match(locales.yi[`${prefix}REMOVE_${position}`], /נעמט אַוועק/);
  assert.doesNotMatch(locales.yi[`${prefix}REMOVE_${position}`], /גיט צוריק/);
}
assert.match(locales.yi['blockly-LISTS_GET_INDEX_TOOLTIP_GET_FIRST'], /ערשטן/);
assert.match(locales.yi['blockly-LISTS_GET_INDEX_TOOLTIP_GET_LAST'], /לעצטן/);
assert.match(locales.yi['blockly-LISTS_CREATE_EMPTY_TOOLTIP'], /לענג 0/);
assert.match(locales.yi['blockly-LISTS_GET_INDEX_FROM_END'], /# פֿונעם סוף/);
assert.match(locales.yi['blockly-KEYBOARD_NAV_COPIED_HINT'], /^קאָפּירט/);
assert.match(locales.yi['blockly-KEYBOARD_NAV_CUT_HINT'], /^אויסגעשניטן/);
assert.match(locales.yi['blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT'], /האַלט %1 געדריקט.*%2 צו באַשטעטיקן/);

const yiddishBlocklyListMutation = ["blockly-LISTS_GET_SUBLIST_START_FIRST", "blockly-LISTS_GET_SUBLIST_START_FROM_END", "blockly-LISTS_GET_SUBLIST_START_FROM_START", "blockly-LISTS_GET_SUBLIST_TOOLTIP", "blockly-LISTS_INDEX_FROM_END_TOOLTIP", "blockly-LISTS_INDEX_FROM_START_TOOLTIP", "blockly-LISTS_INDEX_OF_FIRST", "blockly-LISTS_INDEX_OF_LAST", "blockly-LISTS_INDEX_OF_TOOLTIP", "blockly-LISTS_INLIST", "blockly-LISTS_ISEMPTY_TITLE", "blockly-LISTS_ISEMPTY_TOOLTIP", "blockly-LISTS_LENGTH_TITLE", "blockly-LISTS_LENGTH_TOOLTIP", "blockly-LISTS_REPEAT_TITLE", "blockly-LISTS_REPEAT_TOOLTIP", "blockly-LISTS_REVERSE_MESSAGE0", "blockly-LISTS_REVERSE_TOOLTIP", "blockly-LISTS_SET_INDEX_INSERT", "blockly-LISTS_SET_INDEX_SET", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FIRST", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FROM", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_LAST", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_RANDOM", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_FIRST", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_FROM", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_LAST", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_RANDOM", "blockly-LISTS_SORT_ORDER_ASCENDING", "blockly-LISTS_SORT_ORDER_DESCENDING", "blockly-LISTS_SORT_TITLE", "blockly-LISTS_SORT_TOOLTIP", "blockly-LISTS_SORT_TYPE_IGNORECASE", "blockly-LISTS_SORT_TYPE_NUMERIC", "blockly-LISTS_SORT_TYPE_TEXT", "blockly-LISTS_SPLIT_LIST_FROM_TEXT", "blockly-LISTS_SPLIT_TEXT_FROM_LIST", "blockly-LISTS_SPLIT_TOOLTIP_JOIN", "blockly-LISTS_SPLIT_TOOLTIP_SPLIT", "blockly-LISTS_SPLIT_WITH_DELIMITER", "blockly-LOGIC_BOOLEAN_FALSE", "blockly-LOGIC_BOOLEAN_TOOLTIP", "blockly-LOGIC_BOOLEAN_TRUE", "blockly-LOGIC_COMPARE_EQ_ARIA", "blockly-LOGIC_COMPARE_GTE_ARIA"];
for (const key of yiddishBlocklyListMutation) {
  assert.notEqual(locales.yi[key], english[key], key);
  assert.match(locales.yi[key], /[\u0590-\u05ff]/, key);
  assert.deepEqual(translationTokens(locales.yi[key]), translationTokens(english[key]), key);
}
for (const position of ['FIRST', 'FROM', 'LAST', 'RANDOM']) {
  assert.match(locales.yi[`blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_${position}`], /לייגט/);
  assert.doesNotMatch(locales.yi[`blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_${position}`], /באַשטימט/);
  assert.match(locales.yi[`blockly-LISTS_SET_INDEX_TOOLTIP_SET_${position}`], /באַשטימט דעם ווערט/);
}
for (const key of ['LISTS_GET_SUBLIST_TOOLTIP', 'LISTS_REVERSE_TOOLTIP', 'LISTS_SORT_TOOLTIP']) {
  assert.match(locales.yi[`blockly-${key}`], /קאָפּיע/);
}
assert.match(locales.yi['blockly-LISTS_INDEX_FROM_END_TOOLTIP'], /לעצטער/);
assert.match(locales.yi['blockly-LISTS_INDEX_FROM_START_TOOLTIP'], /ערשטער/);
assert.match(locales.yi['blockly-LISTS_INDEX_OF_TOOLTIP'], /%1 אויב דער עלעמענט ווערט נישט געפֿונען/);
assert.match(locales.yi['blockly-LISTS_SORT_TYPE_IGNORECASE'], /גרויסע און קליינע אותיות/);
assert.equal(locales.yi['blockly-LOGIC_BOOLEAN_FALSE'], 'פֿאַלש');
assert.equal(locales.yi['blockly-LOGIC_BOOLEAN_TRUE'], 'אמת');
assert.match(locales.yi['blockly-LOGIC_COMPARE_GTE_ARIA'], /גרעסער ווי אָדער גלײַך צו/);

const yiddishBlocklyArithmetic = ["blockly-LOGIC_COMPARE_GT_ARIA", "blockly-LOGIC_COMPARE_LTE_ARIA", "blockly-LOGIC_COMPARE_LT_ARIA", "blockly-LOGIC_COMPARE_NEQ_ARIA", "blockly-LOGIC_COMPARE_TOOLTIP_EQ", "blockly-LOGIC_COMPARE_TOOLTIP_GT", "blockly-LOGIC_COMPARE_TOOLTIP_GTE", "blockly-LOGIC_COMPARE_TOOLTIP_LT", "blockly-LOGIC_COMPARE_TOOLTIP_LTE", "blockly-LOGIC_COMPARE_TOOLTIP_NEQ", "blockly-LOGIC_NEGATE_TITLE", "blockly-LOGIC_NEGATE_TOOLTIP", "blockly-LOGIC_NULL_TOOLTIP", "blockly-LOGIC_OPERATION_AND", "blockly-LOGIC_OPERATION_TOOLTIP_AND", "blockly-LOGIC_OPERATION_TOOLTIP_OR", "blockly-LOGIC_TERNARY_CONDITION", "blockly-LOGIC_TERNARY_IF_FALSE", "blockly-LOGIC_TERNARY_IF_TRUE", "blockly-LOGIC_TERNARY_TOOLTIP", "blockly-MATH_ADDITION_SYMBOL_ARIA", "blockly-MATH_ARITHMETIC_TOOLTIP_ADD", "blockly-MATH_ARITHMETIC_TOOLTIP_DIVIDE", "blockly-MATH_ARITHMETIC_TOOLTIP_MINUS", "blockly-MATH_ARITHMETIC_TOOLTIP_MULTIPLY", "blockly-MATH_ARITHMETIC_TOOLTIP_POWER", "blockly-MATH_ATAN2_TITLE", "blockly-MATH_ATAN2_TOOLTIP", "blockly-MATH_CHANGE_TITLE", "blockly-MATH_CHANGE_TOOLTIP", "blockly-MATH_CONSTANT_GOLDEN_RATIO_ARIA", "blockly-MATH_CONSTANT_INFINITY_ARIA", "blockly-MATH_CONSTANT_SQRT1_2_ARIA", "blockly-MATH_CONSTANT_SQRT2_ARIA", "blockly-MATH_CONSTANT_TOOLTIP", "blockly-MATH_CONSTRAIN_TITLE", "blockly-MATH_CONSTRAIN_TOOLTIP", "blockly-MATH_DIVISION_SYMBOL_ARIA", "blockly-MATH_IS_DIVISIBLE_BY", "blockly-MATH_IS_EVEN", "blockly-MATH_IS_NEGATIVE", "blockly-MATH_IS_ODD", "blockly-MATH_IS_POSITIVE", "blockly-MATH_IS_PRIME", "blockly-MATH_IS_TOOLTIP"];
for (const key of yiddishBlocklyArithmetic) {
  assert.notEqual(locales.yi[key], english[key], key);
  assert.match(locales.yi[key], /[\u0590-\u05ff]/, key);
  assert.deepEqual(translationTokens(locales.yi[key]), translationTokens(english[key]), key);
}
for (const comparison of ['GT', 'LT']) {
  assert.doesNotMatch(locales.yi[`blockly-LOGIC_COMPARE_TOOLTIP_${comparison}`], /אָדער גלײַך/);
  assert.match(locales.yi[`blockly-LOGIC_COMPARE_TOOLTIP_${comparison}E`], /אָדער גלײַך/);
}
assert.match(locales.yi['blockly-LOGIC_OPERATION_TOOLTIP_AND'], /ביידע/);
assert.match(locales.yi['blockly-LOGIC_OPERATION_TOOLTIP_OR'], /כאָטש איינע/);
assert.match(locales.yi['blockly-MATH_CONSTRAIN_TOOLTIP'], /אַרײַנגערעכנט די גרענעצן אַליין/);
assert.match(locales.yi['blockly-LOGIC_NULL_TOOLTIP'], /null/);
assert.match(locales.yi['blockly-MATH_ATAN2_TITLE'], /atan2.*X:%1 Y:%2/);
assert.match(locales.yi['blockly-MATH_ATAN2_TOOLTIP'], /\(X, Y\).*גראַדן פֿון -180 ביז 180/);
for (const literal of ['π (3.141…)', 'e (2.718…)', 'φ (1.618…)', 'sqrt(2) (1.414…)', 'sqrt(½) (0.707…)', '∞']) {
  assert.ok(locales.yi['blockly-MATH_CONSTANT_TOOLTIP'].includes(literal));
}
for (const label of ['LOGIC_TERNARY_CONDITION', 'LOGIC_TERNARY_IF_TRUE', 'LOGIC_TERNARY_IF_FALSE']) {
  assert.ok(locales.yi['blockly-LOGIC_TERNARY_TOOLTIP'].includes(locales.yi[`blockly-${label}`]));
}

const yiddishBlocklyStatistics = ["blockly-MATH_IS_WHOLE", "blockly-MATH_MODULO_TITLE", "blockly-MATH_MODULO_TOOLTIP", "blockly-MATH_MULTIPLICATION_SYMBOL_ARIA", "blockly-MATH_NUMBER_TOOLTIP", "blockly-MATH_ONLIST_OPERATOR_AVERAGE", "blockly-MATH_ONLIST_OPERATOR_MAX", "blockly-MATH_ONLIST_OPERATOR_MAX_ARIA", "blockly-MATH_ONLIST_OPERATOR_MEDIAN", "blockly-MATH_ONLIST_OPERATOR_MIN", "blockly-MATH_ONLIST_OPERATOR_MIN_ARIA", "blockly-MATH_ONLIST_OPERATOR_MODE", "blockly-MATH_ONLIST_OPERATOR_RANDOM", "blockly-MATH_ONLIST_OPERATOR_STD_DEV", "blockly-MATH_ONLIST_OPERATOR_SUM", "blockly-MATH_ONLIST_TOOLTIP_AVERAGE", "blockly-MATH_ONLIST_TOOLTIP_MAX", "blockly-MATH_ONLIST_TOOLTIP_MEDIAN", "blockly-MATH_ONLIST_TOOLTIP_MIN", "blockly-MATH_ONLIST_TOOLTIP_MODE", "blockly-MATH_ONLIST_TOOLTIP_RANDOM", "blockly-MATH_ONLIST_TOOLTIP_STD_DEV", "blockly-MATH_ONLIST_TOOLTIP_SUM", "blockly-MATH_POWER_SYMBOL_ARIA", "blockly-MATH_RANDOM_FLOAT_TITLE_RANDOM", "blockly-MATH_RANDOM_FLOAT_TOOLTIP", "blockly-MATH_RANDOM_INT_TITLE", "blockly-MATH_RANDOM_INT_TOOLTIP", "blockly-MATH_ROUND_OPERATOR_ROUND", "blockly-MATH_ROUND_OPERATOR_ROUNDDOWN", "blockly-MATH_ROUND_OPERATOR_ROUNDUP", "blockly-MATH_ROUND_TOOLTIP", "blockly-MATH_SINGLE_OP_ABSOLUTE", "blockly-MATH_SINGLE_OP_ABSOLUTE_ARIA", "blockly-MATH_SINGLE_OP_EXP_ARIA", "blockly-MATH_SINGLE_OP_LN_ARIA", "blockly-MATH_SINGLE_OP_LOG10_ARIA", "blockly-MATH_SINGLE_OP_NEG_ARIA", "blockly-MATH_SINGLE_OP_POW10_ARIA", "blockly-MATH_SINGLE_OP_ROOT", "blockly-MATH_SINGLE_TOOLTIP_ABS", "blockly-MATH_SINGLE_TOOLTIP_EXP", "blockly-MATH_SINGLE_TOOLTIP_LN", "blockly-MATH_SINGLE_TOOLTIP_LOG10", "blockly-MATH_SINGLE_TOOLTIP_NEG"];
for (const key of yiddishBlocklyStatistics) {
  assert.notEqual(locales.yi[key], english[key], key);
  assert.match(locales.yi[key], /[\u0590-\u05ff]/, key);
  assert.deepEqual(translationTokens(locales.yi[key]), translationTokens(english[key]), key);
}
assert.match(locales.yi['blockly-MATH_RANDOM_FLOAT_TOOLTIP'], /0\.0 \(אַרײַנגערעכנט\).*1\.0 \(נישט אַרײַנגערעכנט\)/);
assert.match(locales.yi['blockly-MATH_RANDOM_INT_TOOLTIP'], /אַרײַנגערעכנט ביידע גרענעצן/);
assert.match(locales.yi['blockly-MATH_ROUND_OPERATOR_ROUNDDOWN'], /אַראָפּ/);
assert.match(locales.yi['blockly-MATH_ROUND_OPERATOR_ROUNDUP'], /אַרויף/);
assert.match(locales.yi['blockly-MATH_ONLIST_TOOLTIP_MAX'], /גרעסטע/);
assert.match(locales.yi['blockly-MATH_ONLIST_TOOLTIP_MIN'], /קלענסטע/);
assert.match(locales.yi['blockly-MATH_ONLIST_TOOLTIP_MODE'], /אַ רשימה.*אָפֿטסטע/);
assert.match(locales.yi['blockly-MATH_ONLIST_TOOLTIP_AVERAGE'], /אַריטמעטישן מיטל/);
assert.match(locales.yi['blockly-MATH_ONLIST_TOOLTIP_MEDIAN'], /מעדיאַן/);
assert.match(locales.yi['blockly-MATH_MODULO_TITLE'], /%1 ÷ %2/);
assert.match(locales.yi['blockly-MATH_SINGLE_TOOLTIP_EXP'], / e /);
assert.match(locales.yi['blockly-MATH_SINGLE_TOOLTIP_LOG10'], /באַזע 10/);
assert.match(locales.yi['blockly-MATH_SINGLE_TOOLTIP_NEG'], /פֿאַרקערטן סימן/);

const yiddishBlocklyFunctions = ["blockly-MATH_SINGLE_TOOLTIP_POW10", "blockly-MATH_SINGLE_TOOLTIP_ROOT", "blockly-MATH_SUBTRACTION_SYMBOL_ARIA", "blockly-MATH_TRIG_ACOS_ARIA", "blockly-MATH_TRIG_ASIN_ARIA", "blockly-MATH_TRIG_ATAN_ARIA", "blockly-MATH_TRIG_COS_ARIA", "blockly-MATH_TRIG_SIN_ARIA", "blockly-MATH_TRIG_TAN_ARIA", "blockly-MATH_TRIG_TOOLTIP_ACOS", "blockly-MATH_TRIG_TOOLTIP_ASIN", "blockly-MATH_TRIG_TOOLTIP_ATAN", "blockly-MATH_TRIG_TOOLTIP_COS", "blockly-MATH_TRIG_TOOLTIP_SIN", "blockly-MATH_TRIG_TOOLTIP_TAN", "blockly-MINIMAP_ARIA_LABEL", "blockly-MOVE_BLOCK", "blockly-NEW_COLOUR_VARIABLE", "blockly-NEW_NUMBER_VARIABLE", "blockly-NEW_STRING_VARIABLE", "blockly-NEW_VARIABLE", "blockly-NEW_VARIABLE_TITLE", "blockly-NEW_VARIABLE_TYPE_TITLE", "blockly-NO_PARENT_ANNOUNCEMENT", "blockly-OPEN_BACKPACK", "blockly-OPEN_TRASH", "blockly-OPTION_KEY", "blockly-PAGE_DOWN_KEY", "blockly-PAGE_UP_KEY", "blockly-PARENT_BLOCKS_ANNOUNCEMENT", "blockly-PASTE_ALL_FROM_BACKPACK", "blockly-PASTE_SHORTCUT", "blockly-PAUSE_KEY", "blockly-PROCEDURES_ALLOW_STATEMENTS", "blockly-PROCEDURES_BEFORE_PARAMS", "blockly-PROCEDURES_CALLNORETURN_TOOLTIP", "blockly-PROCEDURES_CALLRETURN_TOOLTIP", "blockly-PROCEDURES_CALL_BEFORE_PARAMS", "blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING", "blockly-PROCEDURES_CREATE_DO", "blockly-PROCEDURES_DEFNORETURN_COMMENT", "blockly-PROCEDURES_DEFNORETURN_PROCEDURE", "blockly-PROCEDURES_DEFNORETURN_TOOLTIP", "blockly-PROCEDURES_DEFRETURN_RETURN", "blockly-PROCEDURES_DEFRETURN_TOOLTIP"];
for (const key of yiddishBlocklyFunctions) {
  assert.notEqual(locales.yi[key], english[key], key);
  assert.match(locales.yi[key], /[\u0590-\u05ff]/, key);
  assert.deepEqual(translationTokens(locales.yi[key]), translationTokens(english[key]), key);
}
for (const operation of ['COS', 'SIN', 'TAN']) {
  assert.match(locales.yi[`blockly-MATH_TRIG_TOOLTIP_${operation}`], /גראַדן \(נישט ראַדיאַנען\)/);
  assert.notEqual(locales.yi[`blockly-MATH_TRIG_${operation}_ARIA`], locales.yi[`blockly-MATH_TRIG_A${operation}_ARIA`]);
}
assert.match(locales.yi['blockly-PROCEDURES_DEFNORETURN_TOOLTIP'], /אָן אַ רעזולטאַט/);
assert.match(locales.yi['blockly-PROCEDURES_DEFRETURN_TOOLTIP'], /מיט אַ רעזולטאַט/);
assert.match(locales.yi['blockly-PROCEDURES_CALLRETURN_TOOLTIP'], /ניצט איר רעזולטאַט/);
assert.doesNotMatch(locales.yi['blockly-PROCEDURES_CALLNORETURN_TOOLTIP'], /ניצט איר רעזולטאַט/);
assert.match(locales.yi['blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING'], /קען נישט.*אויסגעשלאָסן/);
assert.match(locales.yi['blockly-NO_PARENT_ANNOUNCEMENT'], /נישט קיין עלטערן/);
assert.match(locales.yi['blockly-PAGE_DOWN_KEY'], /אַראָפּ.*Page Down/);
assert.match(locales.yi['blockly-PAGE_UP_KEY'], /אַרויף.*Page Up/);
assert.match(locales.yi['blockly-MATH_SINGLE_TOOLTIP_POW10'], /10/);
