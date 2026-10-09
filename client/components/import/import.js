import { ReactiveCache } from '/imports/reactiveCache';
import { trelloGetMembersToMap } from './trelloMembersMapper';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { wekanGetMembersToMap } from './wekanMembersMapper';
import { csvGetMembersToMap } from './csvMembersMapper';
import { jiraGetMembersToMap } from './jiraMembersMapper';
import getSlug from 'limax';
import { UserSearchIndex } from '/models/users';
import { Utils } from '/client/lib/utils';
import { productNameOrDefault } from '/models/lib/productName';
import { BOARD_EXPORT_FIELDS } from '/models/lib/exportFields';
import {
  selection as importSelection,
  selectedFields,
  readExportFile,
} from '/client/components/boards/exportScope';
import { pruneImportDocument } from '/models/lib/importParts';
import { slimTaigaDump } from '/models/lib/taigaFormat';
import { expandFiles, documentForFile, isGeneralizedSource } from '/models/lib/importManyFiles';
import { IMPORT_SOURCES, importSource as importSourceSpec, acceptFor } from '/models/lib/importSources';
import { TAPi18n } from '/imports/i18n';
import TrelloImportJobs from '/models/trelloImportJobs';
import { csvMappingData, parseCsvImportText, startCsvMapping } from './csvMapping';

const { jiraEstimateCandidates, discoveredJiraEstimateMapping } = require('/models/lib/jiraEstimateMapping');

// Helper to find the closest ancestor template instance by name
function findParentTemplateInstance(childTemplateInstance, parentTemplateName) {
  let view = childTemplateInstance.view;
  while (view) {
    if (view.name === `Template.${parentTemplateName}` && view.templateInstance) {
      return view.templateInstance();
    }
    view = view.parentView;
  }
  return null;
}

function _prepareAdditionalData(dataObject) {
  const importSource = Session.get('importSource');
  let membersToMap;
  switch (importSource) {
    case 'trello':
      membersToMap = trelloGetMembersToMap(dataObject);
      break;
    case 'wekan':
      membersToMap = wekanGetMembersToMap(dataObject);
      break;
    case 'csv':
      membersToMap = csvGetMembersToMap(dataObject);
      break;
    case 'jira':
      membersToMap = jiraGetMembersToMap(dataObject);
      break;
    default:
      // The generalized importer's sources get their people from the
      // server's parser instead (mapPeopleOrImport).
      membersToMap = [];
      break;
  }
  return membersToMap;
}

// All Trello file/text imports are run on the server over HTTP instead of the
// DDP `importBoard` method. This matters for correctness, not just size: Meteor
// automatically re-sends an unacknowledged method call on every reconnect, so if
// an import is heavy (or the connection hiccups) the WebSocket can enter an
// endless drop/retry loop (the "Invalid frame header" flicker). An HTTP request
// is never auto-retried, and a .zip's attachment bytes never touch the realtime
// connection at all. The body is either a .zip File (application/zip) or a JSON
// string { board, membersMapping } (application/json).
async function postTrelloImport(body, contentType) {
  const token =
    (window.localStorage && window.localStorage.getItem('Meteor.loginToken')) || '';
  const resp = await fetch('/import-trello', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': contentType,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body,
  });
  let result = {};
  try {
    result = await resp.json();
  } catch (e) {
    result = {};
  }
  if (!resp.ok || result.error) {
    throw new Error(result.error || 'import-trello-failed');
  }
  return result;
}

// A WeKan .zip export (the document and its attachment files) imported as a
// NEW board: posted as it is to /api/import/zip?newBoard=1 (models/importZip.js),
// which opens it on the server under its limits. Returns the new board's id.
async function postWekanZipAsNewBoard(body, membersMode = 'placeholder') {
  const token =
    (window.localStorage && window.localStorage.getItem('Meteor.loginToken')) || '';
  const fields = selectedFields();
  const query = new URLSearchParams({ newBoard: '1', membersMode, ...(fields.length ? { fields: fields.join(',') } : {}) });
  const resp = await fetch(`/api/import/zip?${query.toString()}`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/zip',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body,
  });
  let result = {};
  try {
    result = await resp.json();
  } catch (e) {
    result = {};
  }
  if (!resp.ok || result.error || !result.boardId) {
    throw new Error(result.error || 'import-failed');
  }
  return result.boardId;
}

// A safe URL slug for an imported board. Trello exports name the board `name`,
// WeKan exports use `title`; getSlug (limax) throws on undefined, so guard it.
function boardSlug(data) {
  const raw = (data && (data.title || data.name)) || '';
  return (raw && getSlug(raw)) || 'imported-board';
}

// A WeKan export produced by a buggy older version (the `meta.boardId` exporter
// regression) contains empty swimlanes/lists/cards arrays. Importing it can only
// produce an empty board with a single Default swimlane, so detect that case and
// warn instead of silently creating an empty board.
function wekanExportIsEmpty(board) {
  const count = key => (Array.isArray(board && board[key]) ? board[key].length : 0);
  return count('swimlanes') === 0 && count('lists') === 0 && count('cards') === 0;
}

// Navigate to a freshly server-imported board. The HTTP import (unlike a DDP
// method) does not push the new board's documents to this client, so we first
// subscribe to the board and wait until its lists/swimlanes/cards are loaded
// into Minimongo — otherwise the board opens with an empty Swimlanes view until
// the page is reloaded. The subscription is left running so the data stays
// available when the board is reopened from All Boards in the same session. A
// timeout is the safety net in case the subscription never signals ready.
function goToImportedBoard(boardId, slug) {
  Session.set('importReport', null);
  let navigated = false;
  const go = () => {
    if (navigated) return;
    navigated = true;
    FlowRouter.go('board', { id: boardId, slug });
  };
  Meteor.subscribe('board', boardId, false, { onReady: go });
  Meteor.setTimeout(go, 5000);
}

// An import that completed with warnings stays on this page long enough to say
// what it could not bring over (server/methods/importReport.js); a clean one
// opens its board at once, as before.
function openOrReportImportedBoard(boardId, slug) {
  Meteor.call('importReportForBoard', boardId, (err, rows) => {
    if (!err && Array.isArray(rows) && rows.length) {
      Session.set('importReport', { boardId, slug, rows });
      return;
    }
    goToImportedBoard(boardId, slug);
  });
}

// Find a workspace node by name anywhere in the user's personal workspace tree.
function findWorkspaceByName(nodes, name) {
  for (const node of nodes || []) {
    if (node.name === name) return node;
    if (node.children) {
      const found = findWorkspaceByName(node.children, name);
      if (found) return found;
    }
  }
  return null;
}

// Assign an imported board to a personal workspace named `wsName`, creating the
// workspace (under an optional parent) only if one with that name doesn't exist.
function assignBoardToNamedWorkspace(boardId, wsName, parentId = null) {
  const user = ReactiveCache.getCurrentUser();
  const tree = (user && user.profile && user.profile.boardWorkspacesTree) || [];
  const existing = findWorkspaceByName(tree, wsName);
  if (existing) {
    Meteor.call('assignBoardToWorkspace', boardId, existing.id);
    return;
  }
  Meteor.call('createWorkspace', { parentId, name: wsName }, (err, node) => {
    if (!err && node) {
      Meteor.call('assignBoardToWorkspace', boardId, node.id);
    }
  });
}

Template.import.onCreated(function () {
  this.error = new ReactiveVar('');
  // A report belongs to the import that just finished, not to the next visit.
  Session.set('importReport', null);
  // #6506: import shows the "map members" step so imported members can be mapped to
  // EXISTING WeKan users (auto-suggested by username). It is OPTIONAL — a Skip button
  // (and the textarea "import without mapping" button) bypasses it. Whatever is not
  // mapped is brought in as a virtual (placeholder) user carrying its username / full
  // name — NOT collapsed onto the importing user — and a board admin can still map a
  // virtual member to an existing user later from the sidebar member-avatar popup.
  this.steps = ['importTextarea', 'importMapMembers'];
  this._currentStepIndex = new ReactiveVar(0);
  this.importedData = new ReactiveVar();
  this.membersToMap = new ReactiveVar([]);
  this.importSource = Session.get('importSource');
  // True while a Trello .zip package is being uploaded/imported server-side.
  this.zipImporting = new ReactiveVar(false);
  // "Import many boards": the file being imported, and what each file became.
  this.manyProgress = new ReactiveVar('');
  this.manyResults = new ReactiveVar(null);

  this.nextStep = () => {
    const nextStepIndex = this._currentStepIndex.get() + 1;
    if (nextStepIndex >= this.steps.length) {
      this.finishImport();
    } else {
      this._currentStepIndex.set(nextStepIndex);
    }
  };

  this.setError = (error) => {
    this.error.set(error);
  };

  // When skipMapping is true, the "map members" step is bypassed and the board
  // is imported immediately with whatever (possibly empty) mapping exists, so
  // members can be mapped later. This works for wekan, trello, csv and jira.
  this.importData = async (evt, dataSource, skipMapping = false) => {
    evt.preventDefault();
    // Who the file's people become (models/lib/importMembersMode.js): the
    // page's choice, or placeholders when the import skips the people step.
    this.membersMode = chosenMembersMode(skipMapping);
    // "Import many boards": files chosen there are imported, each as its own
    // board, instead of the single file or text above.
    const manyEl = this.find('.js-import-many-files');
    if (manyEl && manyEl.files && manyEl.files.length) {
      await this.importMany(dataSource, manyEl.files);
      return;
    }
    const advance = async () => {
      if (skipMapping || this.membersMode !== 'map') {
        await this.finishImport();
      } else {
        this.nextStep();
      }
    };
    // One way for every source (models/lib/importSources.js): the chosen
    // file, read as that source's import sends it (models/lib/importManyFiles.js
    // documentForFile, the same reader "Import many boards" uses), or else the
    // pasted text; then the few steps a source has of its own; then the people
    // step every source shares.
    const spec = importSourceSpec(dataSource) || {};
    this.setError('');
    // Trello's .zip package of many boards and their files has a route of its own.
    if (spec.package) {
      const zipEl = this.find('.js-import-zip-file');
      if (zipEl && zipEl.files && zipEl.files[0]) {
        await this.importTrelloZip(zipEl.files[0]);
        return;
      }
    }
    const fileEl = this.find('.js-import-file');
    const file = fileEl && fileEl.files && fileEl.files[0];
    let doc;
    try {
      if (file && spec.zipSend === 'own' && /\.zip$/i.test(file.name || '')) {
        // A WeKan .zip becomes a new board on the server, which unpacks it
        // and streams its attachments into storage.
        let boardId;
        try {
          boardId = await postWekanZipAsNewBoard(file, this.membersMode === 'me' ? 'me' : 'placeholder');
        } catch (e) {
          this.setError((e && e.message) || 'import-failed');
          return;
        }
        Session.set('fromBoard', null);
        openOrReportImportedBoard(boardId, '');
        return;
      }
      if (file) {
        doc = documentForFile(dataSource, file.name || '', new Uint8Array(await file.arrayBuffer()));
      } else {
        const text = (this.find('.js-import-json') || {}).value || '';
        if (!text.trim()) {
          this.setError('error-json-malformed');
          return;
        }
        doc = dataSource === 'csv' ? parseCsvImportText(text) : spec.send === 'text' ? text : JSON.parse(text);
      }
    } catch (e) {
      this.setError('error-json-malformed');
      return;
    }

    // CSV/TSV and Excel: which column is which field comes first
    // (csvMapping.js), the people after it for CSV.
    if (dataSource === 'csv') {
      if (!Array.isArray(doc) || !doc.length) {
        this.setError('error-csv-schema');
        return;
      }
      this.importedData.set(doc);
      this.membersToMap.set(_prepareAdditionalData(doc));
      await startCsvMapping(this, { rows: doc, membersStep: !skipMapping });
      return;
    }
    if (dataSource === 'excel') {
      this.importedData.set(doc);
      this.membersToMap.set([]);
      await startCsvMapping(this, { excelBase64: doc.excelBase64 });
      return;
    }
    // A broken or old WeKan export with no board content is refused rather
    // than made into an empty board (see wekanExportIsEmpty).
    if (dataSource === 'wekan' && wekanExportIsEmpty(doc)) {
      this.setError('error-import-empty-board');
      return;
    }
    if (dataSource === 'jira') {
      const estimateFieldId = this.find('.js-jira-estimate-field')?.value.trim();
      if (estimateFieldId) doc.wekanScrumMapping = { estimateFieldId,
        estimateUnit: this.find('.js-jira-estimate-unit')?.value.trim() };
    }
    // Trello: remember the target personal-workspace name for finishImport.
    this.workspaceName = '';
    if (dataSource === 'trello') {
      const wsEl = this.find('.js-import-workspace-name');
      this.workspaceName = wsEl && wsEl.value ? wsEl.value.trim() : '';
    }
    // A Taiga dump embeds every attachment as base64; they are not imported,
    // so they are not sent (models/lib/taigaFormat.js).
    if (dataSource === 'taiga') doc = slimTaigaDump(doc);
    this.importedData.set(doc);
    // The people: the generalized importer's are read by the server's parser
    // (mapPeopleOrImport); WeKan, Trello and Jira read their own.
    if (spec.creator === 'generalized') {
      await this.mapPeopleOrImport(dataSource, skipMapping);
      return;
    }
    this.membersToMap.set(_prepareAdditionalData(doc));
    await advance();
  };

  // Upload a Trello .zip package to the server, which extracts it (with
  // zip-bomb / path-traversal guards), imports every board and streams each
  // attachment to the Default storage, then go to All Boards.
  // The people step for every source of the generalized importer: when the
  // person importing chose to pick existing users, the file's people are read
  // by the server's parser (importBoard with previewPeople - nothing is
  // created) and offered in the map-members step; otherwise it imports now.
  this.mapPeopleOrImport = async (source, skipMapping) => {
    this.membersToMap.set([]);
    if (skipMapping || this.membersMode !== 'map') {
      await this.finishImport();
      return;
    }
    let people = [];
    try {
      people = await Meteor.callAsync('importBoard', pruneImportDocument(this.importedData.get(), selectedFields()),
        { previewPeople: true, importFields: selectedFields() }, source, null);
    } catch (e) {
      this.setError((e && (e.reason || e.error)) || 'error-json-malformed');
      return;
    }
    const members = (Array.isArray(people) ? people : []).map(person => ({
      id: person.key, username: person.key, fullName: person.name, wekanId: null,
    }));
    if (!members.length) {
      await this.finishImport();
      return;
    }
    this.membersToMap.set(members);
    this.nextStep();
  };

  // "Import many boards" (models/lib/importManyFiles.js): every chosen file,
  // or every file of a chosen .zip that is not itself one export, imported as
  // its own board through the same path a single import of it takes, without
  // member mapping. One that fails does not stop the others; the page lists
  // what each file became.
  this.importMany = async (source, fileList) => {
    this.setError('');
    this.manyResults.set(null);
    const chosen = [];
    for (const file of Array.from(fileList)) {
      chosen.push({ name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) });
    }
    const { files, skipped } = expandFiles(source, chosen);
    const results = skipped.map(reason => ({ name: reason, ok: false, error: '' }));
    const split = splitByProject(source);
    // One person at a time cannot be chosen for many files: their people are
    // placeholders, or all the person importing.
    const membersMode = chosenMembersMode(false) === 'me' ? 'me' : 'placeholder';
    for (let i = 0; i < files.length; i += 1) {
      const { name, bytes } = files[i];
      this.manyProgress.set(TAPi18n.__('import-many-progress', { done: i + 1, total: files.length, name }));
      try {
        let doc;
        if (source === 'wekan' && /\.zip$/i.test(name)) {
          // Unpacked on the server, with its attachment files.
          await postWekanZipAsNewBoard(bytes, membersMode);
          results.push({ name, ok: true, error: '' });
          continue;
        }
        if (source === 'wekan') {
          doc = await readExportFile(new File([bytes], name.split('/').pop()));
          if (wekanExportIsEmpty(doc)) throw new Error(TAPi18n.__('error-import-empty-board'));
        } else {
          doc = documentForFile(source, name, bytes);
        }
        if (source === 'taiga') doc = slimTaigaDump(doc);
        let boardId;
        if (source === 'trello') {
          const result = await postTrelloImport(JSON.stringify({ board: doc, membersMapping: {}, membersMode }), 'application/json');
          boardId = (result.boardIds || [])[0];
        } else {
          boardId = await Meteor.callAsync('importBoard', pruneImportDocument(doc, selectedFields()),
            { membersMapping: {}, membersMode, importFields: selectedFields(), ...(split ? { splitBy: 'swimlane' } : {}) }, source, null);
        }
        results.push({ name, ok: !!boardId, error: boardId ? '' : TAPi18n.__('error-json-malformed') });
      } catch (e) {
        results.push({ name, ok: false, error: String((e && (e.reason || e.error || e.message)) || e) });
      }
    }
    this.manyProgress.set('');
    this.manyResults.set(results);
  };

  this.importTrelloZip = async (zipFile) => {
    this.setError('');
    const wsEl = this.find('.js-import-workspace-name');
    const workspaceName = wsEl && wsEl.value ? wsEl.value.trim() : '';

    this.zipImporting.set(true);
    let result;
    try {
      result = await postTrelloImport(zipFile, 'application/zip');
    } catch (e) {
      this.zipImporting.set(false);
      this.setError((e && e.message) || 'import-trello-failed');
      return;
    }
    this.zipImporting.set(false);

    (result.boardIds || []).forEach(boardId => {
      if (workspaceName) {
        assignBoardToNamedWorkspace(boardId, workspaceName);
      }
    });
    Session.set('fromBoard', null);
    // Go to All Boards, where the newly imported boards appear.
    FlowRouter.go('home');
  };

  this.finishImport = async () => {
    // #6506: build the member mapping from the (optional) map-members step —
    // { importedMemberId: existingWekanUserId } for members the user mapped (or that
    // auto-matched by username). Members left unmapped, or skipped entirely, are sent
    // WITHOUT an entry: the server creator brings them in as virtual (placeholder)
    // users instead of collapsing them onto the importing user.
    const mappingById = {};
    (this.membersToMap.get() || []).forEach(member => {
      if (member && member.id && member.wekanId) {
        mappingById[member.id] = member.wekanId;
      }
    });
    const importedData = this.importedData.get();

    // Trello: import over HTTP (see postTrelloImport) so the realtime DDP
    // connection is never used for the board payload and can't enter the
    // drop/retry "Invalid frame header" flicker loop. Do NOT mutate the still-
    // mounted map-members template (e.g. clearing membersToMap) before
    // navigating away — that forces an empty re-render mid-teardown and can
    // throw "Can't select in removed DomRange". We navigate away, which
    // destroys the import templates.
    if (this.importSource === 'trello') {
      let result;
      try {
        result = await postTrelloImport(
          JSON.stringify({ board: importedData, membersMapping: mappingById, membersMode: this.membersMode || 'map' }),
          'application/json',
        );
      } catch (e) {
        this.setError((e && e.message) || 'import-trello-failed');
        return;
      }
      const boardId = (result.boardIds || [])[0];
      if (!boardId) {
        this.setError('import-trello-failed');
        return;
      }
      Session.set('fromBoard', null);
      if (this.workspaceName) {
        assignBoardToNamedWorkspace(boardId, this.workspaceName);
      }
      openOrReportImportedBoard(boardId, boardSlug(importedData));
      return;
    }

    // wekan / csv: DDP import, guarded by a client-side watchdog so a stalled or
    // hung import can never leave the spinner running forever — if the method has not
    // answered in WEKAN_IMPORT_TIMEOUT_MS (default 2 min) we surface a timeout error
    // and clear the spinner. The server bounds the import itself too (see importBoard).
    this.membersToMap.set([]);
    let settled = false;
    const timeoutMs = parseInt(window.WEKAN_IMPORT_TIMEOUT_MS, 10) || 120000;
    const watchdog = Meteor.setTimeout(() => {
      if (settled) return;
      settled = true;
      this.setError('import-timeout');
    }, timeoutMs);
    // #1173: the parts the page's checkboxes did not tick are taken OUT of the
    // document here, before any creator sees it. A creator that never sees a
    // comment cannot import one, which is how one selection works for five
    // sources without teaching each of them a selection of its own.
    Meteor.call(
      'importBoard',
      pruneImportDocument(importedData, selectedFields()),
      // The selection again, for the parts only a creator can leave out:
      // the Scrum planning external parsers find (models/kanboardCreator.js).
      { membersMapping: mappingById, importFields: selectedFields(), membersMode: this.membersMode || 'map', ...csvMappingData(this),
        ...(splitByProject(this.importSource) ? { splitBy: 'swimlane' } : {}) },
      this.importSource,
      Session.get('fromBoard'),
      (err, res) => {
        if (settled) return; // already timed out
        settled = true;
        Meteor.clearTimeout(watchdog);
        if (err) {
          this.setError(err.error);
        } else {
          Session.set('fromBoard', null);
            openOrReportImportedBoard(res, boardSlug(importedData));
        }
      },
    );
  };
});

// "One board per project" applies to the sources of the generalized
// importer only (models/lib/importSplit.js).
// The page's people choice (models/lib/importMembersMode.js); skipping the
// people step means placeholders.
function chosenMembersMode(skipMapping) {
  if (skipMapping) return Session.get('importMembersMode') === 'me' ? 'me' : 'placeholder';
  const mode = Session.get('importMembersMode');
  return ['map', 'placeholder', 'me'].includes(mode) ? mode : 'map';
}

function splitByProject(source) {
  return !!Session.get('importSplitByProject') && isGeneralizedSource(source);
}

// #1173: every import source, in one list, so the page says what it can read
// instead of the answer living in a menu somewhere else. The list, its order
// and what each source takes are models/lib/importSources.js; the WeKan entry
// is named for the PRODUCT NAME this instance is branded with, because "a
// previous export of ..." should say the name the person sees at the top of
// their screen.

Template.import.helpers({
  error() {
    return Template.instance().error;
  },
  manyProgress() {
    return Template.instance().manyProgress.get();
  },
  manyResults() {
    return Template.instance().manyResults.get();
  },
  importSources() {
    const setting = ReactiveCache.getCurrentSetting();
    const product = productNameOrDefault(setting && setting.productName);
    const current = Session.get('importSource');
    return IMPORT_SOURCES.map(source => ({
      key: source.key,
      // "a previous export of <Product name>", which for an unbranded WeKan is
      // "WeKan" and for a rebranded one is whatever it was rebranded to.
      name: source.product ? `${product} (JSON, .zip)` : source.name,
      selected: source.key === current,
    }));
  },
  hasImportSource() {
    return Boolean(Session.get('importSource'));
  },
  // The SAME selection the export popups use - one list, one meaning: on an
  // export it is what goes out, on an import it is what comes in.
  importParts() {
    return BOARD_EXPORT_FIELDS.map(({ field, label }) => ({
      field,
      label,
      checked: importSelection.get(field),
    }));
  },
  currentTemplate() {
    return Template.instance().steps[Template.instance()._currentStepIndex.get()];
  },
  zipImporting() {
    return Template.instance().zipImporting.get();
  },
  importReport() {
    return Session.get('importReport');
  },
});

Template.import.events({
  'click .js-import-many-all-boards'(event) {
    event.preventDefault();
    FlowRouter.go('home');
  },
  'click .js-open-imported-board'(event) {
    event.preventDefault();
    const report = Session.get('importReport');
    if (report) goToImportedBoard(report.boardId, report.slug);
  },
  'click .js-select-import-source'(event) {
    event.preventDefault();
    const source = event.currentTarget.dataset.source;
    // The address still names the source, so an import page can be linked and
    // the back button works - the picker sets it rather than replacing it.
    FlowRouter.go(`/import/${source}`);
  },
  'click .js-import-part-toggle'(event) {
    event.preventDefault();
    const field = event.currentTarget.dataset.field;
    importSelection.set(field, !importSelection.get(field));
  },
});

Template.importTextarea.helpers({
  isGeneralizedImport() {
    return isGeneralizedSource(Session.get('importSource'));
  },
  membersModes() {
    const current = chosenMembersMode(false);
    return [
      { mode: 'map', label: 'import-members-mode-map' },
      { mode: 'placeholder', label: 'import-members-mode-placeholder' },
      { mode: 'me', label: 'import-members-mode-me' },
    ].map(entry => ({ ...entry, checked: entry.mode === current }));
  },
  splitByProject() {
    return !!Session.get('importSplitByProject');
  },
  instruction() {
    const importSource = Session.get('importSource');
    const issueSourceConfig = {
      github: {
        sourceName: 'GitHub',
        endpoint: 'GET /repos/OWNER/REPO/issues',
      },
      gitlab: {
        sourceName: 'GitLab',
        endpoint: 'GET /projects/ID/issues',
      },
      gitea: {
        sourceName: 'Gitea',
        endpoint: 'GET /repos/OWNER/REPO/issues',
      },
      forgejo: {
        sourceName: 'Forgejo',
        endpoint: 'GET /repos/OWNER/REPO/issues',
      },
    };

    if (issueSourceConfig[importSource]) {
      const { sourceName, endpoint } = issueSourceConfig[importSource];
      return TAPi18n.__('import-board-instruction-issues', {
        sourceName,
        endpoint,
      });
    }

    return TAPi18n.__(`import-board-instruction-${importSource}`);
  },
  importPlaceHolder() {
    const importSource = Session.get('importSource');
    if (importSource === 'csv') {
      return 'import-csv-placeholder';
    } else {
      return 'import-json-placeholder';
    }
  },
  isTrelloImport() {
    return Session.get('importSource') === 'trello';
  },
  // #1173: a previous export of this WeKan, as a .json or as a .zip.
  // What the one file chooser accepts for this source, and whether its
  // export can be pasted (models/lib/importSources.js).
  importAccept() { return acceptFor(Session.get('importSource')); },
  importPaste() { return Boolean((importSourceSpec(Session.get('importSource')) || {}).paste); },
  isJiraImport() { return Session.get('importSource') === 'jira'; },
  // The numeric fields the pasted Jira export declares, to pick the estimate.
  jiraEstimateCandidates() { return Template.instance().jiraCandidates.get(); },
});

Template.importTextarea.onCreated(function () {
  this.jiraCandidates = new ReactiveVar([]);
});

Template.importTextarea.events({
  'input .js-import-json'(evt, tpl) {
    if (Session.get('importSource') !== 'jira') return;
    let data = null;
    try { data = JSON.parse(evt.currentTarget.value); } catch (e) { /* not complete yet */ }
    tpl.jiraCandidates.set(data ? jiraEstimateCandidates(data) : []);
    // The one story points field is what the import would choose anyway.
    const field = tpl.find('.js-jira-estimate-field');
    const discovered = data && discoveredJiraEstimateMapping(data);
    if (field && discovered && !field.value) {
      field.value = discovered.estimateFieldId;
      const unit = tpl.find('.js-jira-estimate-unit');
      if (unit && !unit.value) unit.value = discovered.estimateUnit;
    }
  },
  'click .js-import-members-mode'(evt) {
    evt.preventDefault();
    Session.set('importMembersMode', evt.currentTarget.getAttribute('data-mode'));
  },
  'click .js-import-split-toggle'(evt) {
    evt.preventDefault();
    Session.set('importSplitByProject', !Session.get('importSplitByProject'));
  },
  submit(evt, tpl) {
    const importTpl = findParentTemplateInstance(tpl, 'import');
    if (importTpl) {
      return importTpl.importData(evt, Session.get('importSource'));
    }
  },
  // Import immediately, skipping the "map members" step (members can be mapped
  // later). Works for wekan, trello and jira (and csv).
  'click .js-import-without-mapping'(evt, tpl) {
    const importTpl = findParentTemplateInstance(tpl, 'import');
    if (importTpl) {
      return importTpl.importData(evt, Session.get('importSource'), true);
    }
  },
});

// Module-level reference so popup children can access importMapMembers methods
let _importMapMembersTpl = null;

Template.importMapMembers.onCreated(function () {
  _importMapMembersTpl = this;
  this.usersLoaded = new ReactiveVar(false);

  this.members = () => {
    const importTpl = findParentTemplateInstance(this, 'import');
    return importTpl ? importTpl.membersToMap.get() : [];
  };

  this._refreshMembers = (listOfMembers) => {
    const importTpl = findParentTemplateInstance(this, 'import');
    if (importTpl) {
      importTpl.membersToMap.set(listOfMembers);
    }
  };

  this._setPropertyForMember = (property, value, memberId, unset = false) => {
    const listOfMembers = this.members();
    let finder = null;
    if (memberId) {
      finder = member => member.id === memberId;
    } else {
      finder = member => member.selected;
    }
    listOfMembers.forEach(member => {
      if (finder(member)) {
        if (value !== null) {
          member[property] = value;
        } else {
          delete member[property];
        }
        if (!unset) {
          // we shortcut if we don't care about unsetting the others
          return false;
        }
      } else if (unset) {
        delete member[property];
      }
      return true;
    });
    // Session.get gives us a copy, we have to set it back so it sticks
    this._refreshMembers(listOfMembers);
  };

  this.setSelectedMember = (memberId) => {
    return this._setPropertyForMember('selected', true, memberId, true);
  };

  this.getMember = (memberId = null) => {
    const allMembers = this.members();
    let finder = null;
    if (memberId) {
      finder = user => user.id === memberId;
    } else {
      finder = user => user.selected;
    }
    return allMembers.find(finder);
  };

  this.mapSelectedMember = (wekanId) => {
    return this._setPropertyForMember('wekanId', wekanId, null);
  };

  this.unmapMember = (memberId) => {
    return this._setPropertyForMember('wekanId', null, memberId);
  };

  this.autorun(() => {
    const handle = this.subscribe(
      'user-miniprofile',
      this.members().map(member => {
        return member.username;
      }),
    );
    Tracker.nonreactive(() => {
      Tracker.autorun(() => {
        if (
          handle.ready() &&
          !this.usersLoaded.get() &&
          this.members().length
        ) {
          this._refreshMembers(
            this.members().map(member => {
              if (!member.wekanId) {
                let user = ReactiveCache.getUser({ username: member.username });
                if (!user) {
                  user = ReactiveCache.getUser({ importUsernames: member.username });
                }
                if (user) {
                  member.wekanId = user._id;
                }
              }
              return member;
            }),
          );
        }
        this.usersLoaded.set(handle.ready());
      });
    });
  });
});

Template.importMapMembers.onDestroyed(function () {
  if (_importMapMembersTpl === this) {
    _importMapMembersTpl = null;
  }
});

Template.importMapMembers.helpers({
  usersLoaded() {
    return Template.instance().usersLoaded;
  },
  members() {
    return Template.instance().members();
  },
});

Template.importMapMembers.events({
  submit(evt, tpl) {
    evt.preventDefault();
    const importTpl = findParentTemplateInstance(tpl, 'import');
    if (importTpl) {
      importTpl.nextStep();
    }
  },
  // Import now without finishing member mapping; only members already mapped
  // (if any) are applied, the rest can be mapped later.
  'click .js-import-skip-mapping'(evt, tpl) {
    evt.preventDefault();
    const importTpl = findParentTemplateInstance(tpl, 'import');
    if (importTpl) {
      importTpl.finishImport();
    }
  },
  'click .js-select-member'(evt, tpl) {
    const memberToMap = Template.currentData();
    if (memberToMap.wekan) {
      // todo xxx ask for confirmation?
      tpl.unmapMember(memberToMap.id);
    } else {
      tpl.setSelectedMember(memberToMap.id);
      Popup.open('importMapMembersAdd')(evt);
    }
  },
});

// Global reactive variables for import member popup
const importMemberPopupState = {
  searching: new ReactiveVar(false),
  searchResults: new ReactiveVar([]),
  noResults: new ReactiveVar(false),
  searchTimeout: null,
};

Template.importMapMembersAddPopup.onCreated(function () {
  this.searching = importMemberPopupState.searching;
  this.searchResults = importMemberPopupState.searchResults;
  this.noResults = importMemberPopupState.noResults;
  this.searchTimeout = null;

  this.searching.set(false);
  this.searchResults.set([]);
  this.noResults.set(false);
});

Template.importMapMembersAddPopup.onRendered(function () {
  // Guard against the DOM range being gone (e.g. the popup was closed during a
  // re-render) — calling find/$ then throws "Can't select in removed DomRange".
  if (this.view && this.view.isDestroyed) return;
  const input = this.find('.js-search-member-input');
  if (input) input.focus();
});

Template.importMapMembersAddPopup.onDestroyed(function () {
  if (this.searchTimeout) {
    clearTimeout(this.searchTimeout);
  }
  this.searching.set(false);
});

function importPerformSearch(tpl, query) {
  if (!query || query.length < 2) {
    tpl.searchResults.set([]);
    tpl.noResults.set(false);
    return;
  }

  tpl.searching.set(true);
  tpl.noResults.set(false);

  const results = UserSearchIndex.search(query, { limit: 20 }).fetch();
  tpl.searchResults.set(results);
  tpl.searching.set(false);

  if (results.length === 0) {
    tpl.noResults.set(true);
  }
}

// Map the currently-selected imported member to a WeKan user and close the popup.
function importMapToUser(wekanId) {
  if (wekanId && _importMapMembersTpl) {
    _importMapMembersTpl.mapSelectedMember(wekanId);
  }
  Popup.back();
}

Template.importMapMembersAddPopup.events({
  'click .js-select-import'(event) {
    // Map to the WeKan user _id carried on the .js-select-import anchor's data-id.
    // Reading it from the anchor (event.currentTarget) is robust to the click
    // landing on a child node (the avatar or the name span), where
    // Template.currentData() is undefined and `.­_id` threw "Cannot read properties
    // of undefined (reading '_id')" (#6508). (`data-id` is set to {{_id}} in the
    // template; the earlier fix from `__originalId` to `_id` was correct but read
    // the wrong context.)
    const id = event.currentTarget.getAttribute('data-id');
    if (id) importMapToUser(id);
  },
  // Enter selects the first (highlighted) search result, so a name can be assigned
  // by keyboard without a mouse click.
  'keydown .js-search-member-input'(event, tpl) {
    if (event.keyCode === 13) {
      event.preventDefault();
      const results = tpl.searchResults.get();
      if (results && results.length) {
        importMapToUser(results[0]._id);
      }
    }
  },
  'keyup .js-search-member-input'(event, tpl) {
    if (event.keyCode === 13) {
      return; // handled on keydown
    }
    const query = event.target.value.trim();

    if (tpl.searchTimeout) {
      clearTimeout(tpl.searchTimeout);
    }

    tpl.searchTimeout = setTimeout(() => {
      importPerformSearch(tpl, query);
    }, 300);
  },
});

Template.importMapMembersAddPopup.helpers({
  searchResults() {
    return importMemberPopupState.searchResults.get();
  },
  searching() {
    return importMemberPopupState.searching;
  },
  noResults() {
    return importMemberPopupState.noResults;
  },
});

// ---------------------------------------------------------------------------
// Live Trello API import: key/token -> list workspaces & boards -> import
// selected boards (with attachments) server-side, placing each under a
// personal workspace named after its Trello workspace.
// ---------------------------------------------------------------------------

function flattenWorkspaceTree(nodes, depth = 0, acc = []) {
  (nodes || []).forEach(node => {
    acc.push({ id: node.id, label: `${'— '.repeat(depth)}${node.name}` });
    if (node.children && node.children.length) {
      flattenWorkspaceTree(node.children, depth + 1, acc);
    }
  });
  return acc;
}

// Build the copy-paste-friendly error text for a job: the error log plus a
// summary line per failed board.
function jobErrorText(job) {
  if (!job) return '';
  const lines = [];
  (job.errorLog || []).forEach(line => lines.push(line));
  return lines.join('\n');
}

Template.importTrelloApi.onCreated(function () {
  this.error = new ReactiveVar('');
  this.loading = new ReactiveVar(false);
  this.workspaces = new ReactiveVar([]);
  this.copied = new ReactiveVar(false);
  // Board selection state: map of trelloBoardId -> true. Tracked here (rather
  // than via DOM checkboxes) because the UI uses animated .materialCheckBox
  // elements, not native inputs.
  this.selectedBoards = new ReactiveVar({});
  // The import itself runs server-side as a persisted job; watch it reactively
  // so progress survives navigating away and back.
  this.subscribe('trelloImportJobs');
});

// Collect every board id across all listed workspaces.
function allBoardIds(workspaces) {
  const ids = {};
  (workspaces || []).forEach(ws => {
    (ws.boards || []).forEach(b => {
      ids[b.id] = true;
    });
  });
  return ids;
}

Template.importTrelloApi.helpers({
  error() {
    return Template.instance().error;
  },
  loading() {
    return Template.instance().loading;
  },
  copied() {
    return Template.instance().copied;
  },
  hasWorkspaces() {
    return Template.instance().workspaces.get().length > 0;
  },
  workspaceList() {
    return Template.instance().workspaces.get();
  },
  boardSelected() {
    return !!Template.instance().selectedBoards.get()[this.id];
  },
  workspaceSelected() {
    const sel = Template.instance().selectedBoards.get();
    const boards = this.boards || [];
    return boards.length > 0 && boards.every(b => sel[b.id]);
  },
  flatWorkspaceNodes() {
    const user = ReactiveCache.getCurrentUser();
    const tree = (user && user.profile && user.profile.boardWorkspacesTree) || [];
    return flattenWorkspaceTree(tree);
  },
  credsSaved() {
    const user = ReactiveCache.getCurrentUser();
    return !!(user && user.profile && user.profile.trelloApiSaved);
  },

  // --- current background job ---
  currentJob() {
    return TrelloImportJobs.findOne({}, { sort: { createdAt: -1 } });
  },
  jobIsRunning() {
    const job = TrelloImportJobs.findOne({}, { sort: { createdAt: -1 } });
    return job && job.status === 'running';
  },
  jobCanResume() {
    const job = TrelloImportJobs.findOne({}, { sort: { createdAt: -1 } });
    return job && (job.status === 'paused' || job.status === 'error');
  },
  jobIsFinished() {
    const job = TrelloImportJobs.findOne({}, { sort: { createdAt: -1 } });
    return job && (job.status === 'done' || job.status === 'cancelled');
  },
  canStartImport() {
    // Don't start a second import while one is active (running/paused/error),
    // which would create a hidden concurrent job.
    const job = TrelloImportJobs.findOne({}, { sort: { createdAt: -1 } });
    return !job || job.status === 'done' || job.status === 'cancelled';
  },
  jobProgressText() {
    const job = TrelloImportJobs.findOne({}, { sort: { createdAt: -1 } });
    if (!job) return '';
    return `${job.currentIndex} / ${job.total}`;
  },
  jobProgressPercent() {
    const job = TrelloImportJobs.findOne({}, { sort: { createdAt: -1 } });
    if (!job || !job.total) return 0;
    return Math.round((job.currentIndex / job.total) * 100);
  },
  jobResults() {
    const job = TrelloImportJobs.findOne({}, { sort: { createdAt: -1 } });
    return (job && job.results) || [];
  },
  jobHasErrors() {
    const job = TrelloImportJobs.findOne({}, { sort: { createdAt: -1 } });
    return !!(job && job.errorLog && job.errorLog.length);
  },
  jobErrorText() {
    return jobErrorText(TrelloImportJobs.findOne({}, { sort: { createdAt: -1 } }));
  },
});

Template.importTrelloApi.events({
  'click .js-trello-save-creds'(evt, tpl) {
    evt.preventDefault();
    const key = tpl.find('.js-trello-key').value.trim();
    const token = tpl.find('.js-trello-token').value.trim();
    if (!key || !token) {
      tpl.error.set('trello-api-credentials-required');
      return;
    }
    tpl.error.set('');
    Meteor.call('saveTrelloCredentials', key, token, err => {
      if (err) {
        tpl.error.set(err.reason || err.error || 'trello-api-error');
        return;
      }
      // Don't keep the token sitting in the browser; it now lives server-side.
      tpl.find('.js-trello-key').value = '';
      tpl.find('.js-trello-token').value = '';
    });
  },
  'click .js-trello-delete-creds'(evt, tpl) {
    evt.preventDefault();
    tpl.error.set('');
    Meteor.call('deleteTrelloCredentials', err => {
      if (err) tpl.error.set(err.reason || err.error || 'trello-api-error');
    });
    tpl.find('.js-trello-key').value = '';
    tpl.find('.js-trello-token').value = '';
  },
  'click .js-trello-list-workspaces'(evt, tpl) {
    evt.preventDefault();
    // key/token may be empty when saved credentials exist; the server falls
    // back to the saved ones and returns an error if neither is available.
    const key = tpl.find('.js-trello-key').value.trim();
    const token = tpl.find('.js-trello-token').value.trim();
    tpl.error.set('');
    tpl.loading.set(true);
    Meteor.call('trelloListWorkspaces', key, token, (err, res) => {
      tpl.loading.set(false);
      if (err) {
        tpl.error.set(err.reason || err.error || 'trello-api-error');
        tpl.workspaces.set([]);
        tpl.selectedBoards.set({});
      } else {
        const workspaces = res || [];
        tpl.workspaces.set(workspaces);
        // Preselect all boards by default.
        tpl.selectedBoards.set(allBoardIds(workspaces));
      }
    });
  },
  // Toggle a single board's animated checkbox.
  'click .js-toggle-board'(evt, tpl) {
    evt.preventDefault();
    const id = this.id;
    const sel = { ...tpl.selectedBoards.get() };
    if (sel[id]) {
      delete sel[id];
    } else {
      sel[id] = true;
    }
    tpl.selectedBoards.set(sel);
  },
  // Toggle all boards in a workspace: if all are selected, clear them; else
  // select them all.
  'click .js-toggle-workspace'(evt, tpl) {
    evt.preventDefault();
    const boards = this.boards || [];
    const sel = { ...tpl.selectedBoards.get() };
    const allSelected = boards.length > 0 && boards.every(b => sel[b.id]);
    boards.forEach(b => {
      if (allSelected) {
        delete sel[b.id];
      } else {
        sel[b.id] = true;
      }
    });
    tpl.selectedBoards.set(sel);
  },
  'click .js-trello-select-all'(evt, tpl) {
    evt.preventDefault();
    tpl.selectedBoards.set(allBoardIds(tpl.workspaces.get()));
  },
  'click .js-trello-unselect-all'(evt, tpl) {
    evt.preventDefault();
    tpl.selectedBoards.set({});
  },
  'click .js-trello-import-selected'(evt, tpl) {
    evt.preventDefault();
    const key = tpl.find('.js-trello-key').value.trim();
    const token = tpl.find('.js-trello-token').value.trim();
    const sel = tpl.selectedBoards.get();
    const boardIds = Object.keys(sel).filter(id => sel[id]);
    if (!boardIds.length) {
      tpl.error.set('trello-select-boards');
      return;
    }
    const parentEl = tpl.find('.js-trello-parent-workspace');
    const parentId = parentEl && parentEl.value ? parentEl.value : null;

    tpl.error.set('');
    // Start the server-side job; progress shows up via the subscription. The
    // user is free to navigate away and come back.
    Meteor.call('trelloStartImport', key, token, boardIds, parentId, err => {
      if (err) {
        tpl.error.set(err.reason || err.error || 'trello-api-error');
      }
    });
  },
  'click .js-trello-resume'(evt, tpl) {
    evt.preventDefault();
    const job = TrelloImportJobs.findOne({}, { sort: { createdAt: -1 } });
    if (!job) return;
    const key = tpl.find('.js-trello-key').value.trim();
    const token = tpl.find('.js-trello-token').value.trim();
    if (!key || !token) {
      tpl.error.set('trello-api-credentials-required');
      return;
    }
    tpl.error.set('');
    Meteor.call('trelloResumeImport', job._id, key, token, err => {
      if (err) tpl.error.set(err.reason || err.error || 'trello-api-error');
    });
  },
  'click .js-trello-cancel'(evt, tpl) {
    evt.preventDefault();
    const job = TrelloImportJobs.findOne({}, { sort: { createdAt: -1 } });
    if (!job) return;
    Meteor.call('trelloCancelImport', job._id, false);
  },
  'click .js-trello-cancel-delete'(evt, tpl) {
    evt.preventDefault();
    const job = TrelloImportJobs.findOne({}, { sort: { createdAt: -1 } });
    if (!job) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm(TAPi18n.__('trello-cancel-delete-confirm'))) return;
    Meteor.call('trelloCancelImport', job._id, true);
  },
  'click .js-trello-clear'(evt, tpl) {
    evt.preventDefault();
    const job = TrelloImportJobs.findOne({}, { sort: { createdAt: -1 } });
    if (!job) return;
    Meteor.call('trelloClearImportJob', job._id, false);
  },
  'click .js-trello-copy-errors'(evt, tpl) {
    evt.preventDefault();
    const job = TrelloImportJobs.findOne({}, { sort: { createdAt: -1 } });
    const text = jobErrorText(job);
    if (!text) return;
    const done = () => {
      tpl.copied.set(true);
      setTimeout(() => tpl.copied.set(false), 2000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, () => {
        // Fall back to selecting the textarea so the user can copy manually.
        const ta = tpl.find('.js-trello-errors-text');
        if (ta) {
          ta.focus();
          ta.select();
        }
      });
    } else {
      const ta = tpl.find('.js-trello-errors-text');
      if (ta) {
        ta.focus();
        ta.select();
        try {
          document.execCommand('copy');
          done();
        } catch (e) {
          // user can copy manually from the selected textarea
        }
      }
    }
  },
});
