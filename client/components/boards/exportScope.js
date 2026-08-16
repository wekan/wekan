// ITS OWN TEMPLATE FIRST. This module is imported by sidebar.js, by
// cardDetails.js and by the import page, and any of them can be evaluated
// before client/features/boards.js gets to the .jade - at which point
// `Template.exportScopeBody` is undefined and `.helpers()` on it throws at
// module scope. That does not break this popup, it breaks THE WHOLE BUNDLE:
// evaluation stops, every template registered after it never registers, and
// the sign-in page comes up with "no template passwordInput found".
//
// A component whose .js is imported by other components cannot rely on the
// central import order in client/features/*.js. Importing the template here
// makes the order a fact rather than a hope; the module cache means the second
// import costs nothing.
import './exportScope.jade';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { Accounts } from 'meteor/accounts-base';
import { BOARD_EXPORT_FIELDS } from '/models/lib/exportFields';
import { exportLocaleParams } from '/client/lib/exportLocale';

// The "what do you want in it" half of an export, for a board, a swimlane or a
// list (#1173 "Add Feature: Print Board with Params").
//
// One body, used by three popups. A board export, a swimlane export and a list
// export differ by ONE query parameter - which cards are in scope - so writing
// the checkbox list and the two download links three times would be three places
// for a section to go missing from. `exportScopeBody` is included by each popup
// with its own scope, and everything else is shared.
//
// The SELECTION is shared too, and deliberately: it is module-level, so ticking
// "no attachments, no comments" once applies to the next export as well, in the
// same session. Somebody printing a board rarely wants a different shape for
// each list of it.

const selection = new ReactiveDict();
BOARD_EXPORT_FIELDS.forEach(({ field }) => selection.set(field, true));

// `card-details` is what makes an export the card layout rather than the
// spreadsheet table; it starts on, like everything else.
selection.set('card-details', true);

function selectedFields() {
  return ['card-details', ...BOARD_EXPORT_FIELDS.map(({ field }) => field)]
    .filter((field, index, all) => all.indexOf(field) === index)
    .filter(field => selection.get(field));
}

// The scope a popup was opened with: {} for a board, {swimlaneId} or {listId}
// for the other two.
function currentScope() {
  const data = Template.currentData() || {};
  const scope = {};
  if (data.swimlaneId) scope.swimlaneId = data.swimlaneId;
  if (data.listId) scope.listId = data.listId;
  return scope;
}

// ONE url builder for every format and every scope. A second one would be a
// second place for a query parameter to go missing from - which is how the card
// popup's checkboxes ended up driving the Excel download and not the PDF.
// A CARD has export routes of its own - /lists/:listId/cards/:cardId/exportPDF
// and exportExcel - which produce the one card rather than a board document with
// one card in it. They are the same renderers underneath, so the popup uses them
// when it is a card being exported and the board routes otherwise, instead of
// there being two ways to ask for the same file.
function routeFor(path) {
  const data = Template.currentData() || {};
  if (!data.cardId || !data.listId) return path;
  if (path.endsWith('exportPDF')) {
    return '/api/boards/:boardId/lists/:listId/cards/:cardId/exportPDF';
  }
  if (path.endsWith('exportExcel')) {
    return '/api/boards/:boardId/lists/:listId/cards/:cardId/exportExcel';
  }
  return path;
}

function exportUrl(path, extra = {}) {
  const boardId = Session.get('currentBoard');
  const data = Template.currentData() || {};
  const route = routeFor(path);
  const params = { boardId };
  if (route.includes(':listId')) params.listId = data.listId;
  if (route.includes(':cardId')) params.cardId = data.cardId;
  return FlowRouter.path(route, params, {
    authToken: Accounts._storedLoginToken(),
    fields: selectedFields().join(','),
    ...currentScope(),
    ...exportLocaleParams(),
    ...extra,
  });
}

// The import half's state. Module-level like the selection, because the popup is
// destroyed and recreated as it is reopened and a half-finished import should
// still be able to say how it went.
const importState = new ReactiveDict();
importState.set('busy', false);
importState.set('error', '');
importState.set('done', '');

// A WeKan export is either the document itself or a .zip with the document
// inside it. Reading the .zip in the BROWSER is what keeps the server out of it:
// the method takes the same object either way, so there is one import path and
// not two.
async function readExportFile(file) {
  const name = String(file.name || '').toLowerCase();
  if (!name.endsWith('.zip')) {
    // A .json already carries its attachments as base64 under `file`, which is
    // what the importer reads.
    return JSON.parse(await file.text());
  }

  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(file);
  const entry = zip.file('wekan.json') || zip.file(/wekan\.json$/)[0];
  if (!entry) throw new Error('import-not-wekan-export');
  const doc = JSON.parse(await entry.async('string'));

  // The FILES beside the document. The export writes them as
  // `attachments/<attachmentId>-<name>`, and the id is what ties a file back to
  // its metadata row - two attachments called "photo.png" are two entries.
  //
  // They go onto the SAME `file` field a .json export uses, so the server has
  // one import path rather than one per container. That is also the tradeoff to
  // know about: the archive is unpacked in the browser and sent as base64, so a
  // .zip full of large attachments costs memory on the way in. It is the shape
  // the board import has always used, and the reason to reach for a .zip is
  // still the same - the JSON of a board with many attachments may be too large
  // for one string, while its archive is not.
  const byId = new Map(
    (Array.isArray(doc.attachments) ? doc.attachments : [])
      .filter(attachment => attachment && attachment._id)
      .map(attachment => [attachment._id, attachment]),
  );
  const files = zip.file(/^attachments\//);
  for (const archived of files || []) {
    const base = archived.name.slice('attachments/'.length);
    const dash = base.indexOf('-');
    const attachmentId = dash === -1 ? base : base.slice(0, dash);
    const attachment = byId.get(attachmentId);
    // A file whose row is not in the document is one the selection left out, or
    // a hand-made archive: skipping it is better than inventing a row for it.
    if (!attachment) continue;
    attachment.file = await archived.async('base64');
  }
  return doc;
}

// A .json is small enough to travel as a document: it is parsed here and sent
// over DDP, which is the path the per-menu import has always used.
function importJsonDocument(doc, target) {
  return new Promise((resolve, reject) => {
    Meteor.call('importScoped', target, doc, selectedFields(),
      (err, res) => (err ? reject(err) : resolve(res)));
  });
}

// POST the archive itself to /api/import/zip. `fetch` streams a File body, so
// the browser does not hold a copy either.
async function uploadZipImport(file, target) {
  const params = new URLSearchParams({
    authToken: Accounts._storedLoginToken() || '',
    boardId: target.boardId,
    fields: selectedFields().join(','),
  });
  for (const key of ['swimlaneId', 'listId', 'cardId', 'checklistId']) {
    if (target[key]) params.set(key, target[key]);
  }
  const response = await fetch(`/api/import/zip?${params.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/zip' },
    body: file,
  });
  const answer = await response.json().catch(() => ({}));
  if (!response.ok || !answer.ok) {
    throw new Error(answer.error || 'import-scoped-failed');
  }
  return answer.counts;
}

// EVERY format this popup offers, in one table, for every scope.
//
// It was two markups: the board popup wrote its own list of nineteen formats in
// sidebar.jade under four subheadings, and the swimlane / list / card popups
// wrote five in exportScope.jade - so "the export popup" meant two different
// menus with two different looks, and a format added to one was missing from
// the other. One table, rendered by one template, is the answer to both.
//
// `scopes: ['board']` marks a format that only makes sense for a whole board -
// the HTML archive, the dependency graph, the CSV columns, and the exports
// written for another tool. Everything else is offered wherever the popup is,
// because `exportUrl` already carries the scope: a swimlane, a list and a card
// each differ from a board by a query parameter, not by a route.
//
// An entry is either a LINK (`path`, downloaded straight from the API) or an
// ACTION (`action`, a class an event handler is bound to). Nothing else varies.
const BOARD_ONLY = ['board'];
const EXPORT_FORMAT_GROUPS = [
  {
    key: 'files',
    entries: [
      { key: 'pdf', icon: 'fa-file-pdf-o', label: 'PDF', path: 'exportPDF', ext: 'pdf' },
      { key: 'excel', icon: 'fa-file-excel-o', label: 'Excel', path: 'exportExcel', ext: 'xlsx' },
      { key: 'html', icon: 'fa-archive', label: 'HTML', action: 'html-export-board', scopes: BOARD_ONLY },
    ],
  },
  {
    key: 'dependencies',
    headingKey: 'card-dependencies',
    scopes: BOARD_ONLY,
    entries: [
      { key: 'dep-json', icon: 'fa-link', label: 'JSON', action: 'js-export-dependencies-json' },
      { key: 'dep-svg', icon: 'fa-link', label: 'SVG', action: 'js-export-dependencies-svg' },
    ],
  },
  {
    key: 'csv',
    heading: 'CSV',
    scopes: BOARD_ONLY,
    entries: [
      { key: 'csv', icon: 'fa-upload', label: '(,)', path: 'export/csv', ext: 'csv', query: { delimiter: ',' } },
      { key: 'scsv', icon: 'fa-upload', label: '(;)', path: 'export/csv', ext: 'csv', query: { delimiter: ';' } },
      { key: 'tsv', icon: 'fa-upload', label: 'TSV', path: 'export/csv', ext: 'tsv', query: { delimiter: '\t' } },
    ],
  },
  {
    key: 'json',
    heading: 'JSON',
    entries: [
      { key: 'json', icon: 'fa-file-code-o', label: 'JSON', path: 'export', ext: 'json' },
      {
        key: 'json-no-attachments',
        icon: 'fa-file-code-o',
        labelKey: 'export-board-without-attachments',
        labelPrefix: 'JSON',
        path: 'export',
        ext: 'json',
        query: { attachments: 'false' },
      },
      {
        key: 'zip',
        icon: 'fa-file-archive-o',
        labelKey: 'attachments',
        labelPrefix: '.zip',
        path: 'exportZip',
        ext: 'zip',
      },
      { key: 'kanboard', icon: 'fa-upload', label: 'Kanboard', path: 'export/kanboard', ext: 'json', scopes: BOARD_ONLY },
      ...[
        ['trello', 'Trello'], ['jira', 'Jira'], ['deck', 'NextCloud Deck'],
        ['openproject', 'OpenProject'], ['github', 'GitHub'], ['gitlab', 'GitLab'],
        ['gitea', 'Gitea'], ['forgejo', 'Forgejo'], ['asana', 'Asana'],
        ['zenkit', 'Zenkit'],
      ].map(([format, label]) => ({
        key: format,
        icon: 'fa-upload',
        label,
        path: `export/${format}`,
        ext: 'json',
        scopes: BOARD_ONLY,
      })),
    ],
  },
];

// Is this popup a whole board, or a swimlane / list / card inside one?
function isBoardScope() {
  const data = Template.currentData() || {};
  // checklistId too: the checklist popup is a scope of its own, and a scope
  // that is not named here would be read as "a whole board" and offered the
  // HTML archive, the dependency graph and the CSV columns of one.
  return !data.swimlaneId && !data.listId && !data.cardId && !data.checklistId;
}

function entryApplies(entry) {
  return !entry.scopes || entry.scopes.includes('board') === isBoardScope();
}

// The table above, resolved for the scope this popup was opened with: each entry
// carries its URL; the response supplies its localized, scope-aware filename.
// A group whose every entry is out of scope is dropped, heading and all.
function resolvedFormatGroups() {
  return EXPORT_FORMAT_GROUPS
    .filter(group => !group.scopes || group.scopes.includes('board') === isBoardScope())
    .map(group => ({
      key: group.key,
      heading: group.headingKey ? TAPi18n.__(group.headingKey) : group.heading || '',
      entries: group.entries.filter(entryApplies).map(entry => ({
        ...entry,
        label: entry.labelKey
          ? `${entry.labelPrefix} (${TAPi18n.__(entry.labelKey)})`
          : entry.label,
        url: entry.path ? exportUrl(`/api/boards/:boardId/${entry.path}`, entry.query || {}) : '',
      })),
    }))
    .filter(group => group.entries.length);
}

// Import writes to the board, so unlike export it is offered only to somebody
// who may change it. A named function rather than a helper body, because the
// menus that offer the Import row have to ask the same question - four copies of
// four permission checks is how one of them ends up offering a row that then
// refuses to do anything.
function canImportIntoBoard() {
  const user = ReactiveCache.getCurrentUser();
  return Boolean(user && !user.isWorker && !user.isCommentOnly
    && !user.isReadOnly && !user.isReadAssignedOnly);
}
Template.registerHelper('canImportIntoBoard', canImportIntoBoard);

const scopeHelpers = {
  canImport() {
    return canImportIntoBoard();
  },
  // Which half of the popup this is. One body, two modes: EXPORT shows the
  // formats to download, IMPORT shows the file to read - and both keep the
  // "what to include" pane, because that selection means the same thing in
  // both directions (#1173).
  isImportMode() {
    const data = Template.currentData() || {};
    return data.mode === 'import';
  },
  importBusy() { return importState.get('busy'); },
  importError() { return importState.get('error'); },
  importDone() { return importState.get('done'); },
  exportFields() {
    return BOARD_EXPORT_FIELDS.map(({ field, label }) => ({
      field,
      label,
      checked: selection.get(field),
    }));
  },
  cardDetailsChecked() {
    return selection.get('card-details');
  },
  // Every format, resolved for this popup's scope - see EXPORT_FORMAT_GROUPS.
  // #5870's "JSON without the base64 attachment data" is one of them, offered
  // wherever an export is offered rather than only on the board menu.
  formatGroups() {
    return resolvedFormatGroups();
  },
};

// One helper object, registered on both halves: the checkbox list is its own
// template so the layout can put it in a pane, and it asks the same questions.
Template.exportScopeBody.helpers(scopeHelpers);
Template.exportScopeSelect.helpers(scopeHelpers);

// THE TOGGLES, BOUND ON THE DOCUMENT - and deliberately not as a template event
// map.
//
// #6586 comment 5308548585: "I can't select/deselect those arrows here", and
// then "clicking a checked option, like labels, does not uncheck it". The
// handlers were a `Template.exportScopeBody.events({...})` map, and a click on a
// row did nothing. Registering the same map on `exportScopeSelect` as well - the
// template that actually draws the rows - did not help either: the fix was
// built, shipped in both the release and the development bundle, and the list
// still could not be changed.
//
// What IS known, from the built bundle: the templates are registered, their
// helpers run (the rows render, with their labels and their state), and both
// event maps are attached. The click simply never arrives. This list is drawn
// inside five different popups, each rendered by Popup into its own Blaze view
// tree, so rather than keep guessing which link in that chain drops the event,
// the toggle is bound where nothing can: one delegated handler on the document,
// the same mechanism client/lib/escapeActions.js uses to catch clicks inside
// popups.
//
// ONE binding, not one per template - two would toggle twice and cancel out,
// which is the same "nothing happens" from a different direction.
//
// The display stays reactive through `selection`, which is what draws the
// checkbox, so nothing here touches the DOM by hand.
function toggleSelection(field) {
  if (!field) return;
  selection.set(field, !selection.get(field));
}

// A NATIVE listener, in the CAPTURE phase, and no jQuery.
//
// Capture, because it runs on the way DOWN to the row: a `stopPropagation()`
// anywhere between the row and the document - which is one of the things that
// could have been eating this click - cannot prevent it. And native, because a
// `window.jQuery` that turned out to be undefined would fail silently, which is
// indistinguishable from the bug being fixed.
Meteor.startup(() => {
  if (typeof document === 'undefined') return;
  document.addEventListener('click', event => {
    const target = event.target && event.target.closest
      ? event.target.closest('.js-export-field-toggle, .js-export-card-details-toggle')
      : null;
    if (!target) return;
    // The popup stays open: choosing five sections should not be five reopens.
    event.preventDefault();
    toggleSelection(target.classList.contains('js-export-card-details-toggle')
      ? 'card-details'
      : (target.dataset && target.dataset.field));
  }, true);
});

Template.exportScopeBody.events({
  async 'change .js-import-file'(event) {
    const file = event.currentTarget.files && event.currentTarget.files[0];
    if (!file) return;
    const data = Template.currentData() || {};
    const target = {
      boardId: Session.get('currentBoard'),
      ...currentScope(),
    };
    // A card's menu imports below THAT card, so the target is the card the popup
    // was opened on - the same id the export side uses as its scope.
    if (data.cardId) target.cardId = data.cardId;

    importState.set('error', '');
    importState.set('done', '');
    importState.set('busy', true);
    try {
      const counts = String(file.name || '').toLowerCase().endsWith('.zip')
        // A .zip goes to the server AS A FILE. Unpacking it here and sending
        // base64 over DDP is what made a large archive expensive: 2 GB of
        // attachments became 2.7 GB in one message. The route streams it to
        // disk, reads the archive's directory, and pipes one attachment at a
        // time into storage.
        ? await uploadZipImport(file, target)
        : await importJsonDocument(await readExportFile(file), target);
      importState.set('done', Object.entries(counts || {})
        .filter(([, n]) => n > 0)
        .map(([what, n]) => `${n} ${what}`)
        .join(', ') || '0');
    } catch (error) {
      const message = error && error.message === 'import-not-wekan-export'
        ? 'import-not-wekan-export'
        : 'import-scoped-failed';
      importState.set('error', message);
      // The reason, for somebody reading the console - the popup has room for a
      // sentence, not for a stack.
      console.error('scoped import failed', error);
    } finally {
      importState.set('busy', false);
      event.currentTarget.value = '';
    }
  },
});

// `exportUrlFor` is what the board popup uses to build the same URLs with the
// same selection - one query string, built in one place, whichever popup asks.
export {
  selectedFields,
  selection,
  readExportFile,
  exportUrl as exportUrlFor,
};
