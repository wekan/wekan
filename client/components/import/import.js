import { ReactiveCache } from '/imports/reactiveCache';
import { trelloGetMembersToMap } from './trelloMembersMapper';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { wekanGetMembersToMap } from './wekanMembersMapper';
import { csvGetMembersToMap } from './csvMembersMapper';
import { jiraGetMembersToMap } from './jiraMembersMapper';
import { kanboardGetMembersToMap } from './kanboardMembersMapper';
import getSlug from 'limax';
import { UserSearchIndex } from '/models/users';
import { Utils } from '/client/lib/utils';
import { TAPi18n } from '/imports/i18n';
import TrelloImportJobs from '/models/trelloImportJobs';

const Papa = require('papaparse');

Template.importHeaderBar.helpers({
  title() {
    const sourceNameByKey = {
      trello: 'Trello',
      wekan: 'JSON',
      csv: 'CSV-TSV',
      excel: 'Excel',
      jira: 'Jira',
      kanboard: 'Kanboard',
      deck: 'NextCloud Deck',
      openproject: 'OpenProject',
      github: 'GitHub',
      gitlab: 'GitLab',
      gitea: 'Gitea',
      forgejo: 'Forgejo',
      asana: 'Asana',
      zenkit: 'Zenkit',
    };
    const sourceName = sourceNameByKey[Session.get('importSource')] || 'JSON';
    return `${TAPi18n.__('import')} / ${sourceName}`;
  },
});

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
    case 'kanboard':
      membersToMap = kanboardGetMembersToMap(dataObject);
      break;
    default:
      // NextCloud Deck / OpenProject / GitHub / GitLab / Gitea / Forgejo:
      // these are imported without member mapping (members can be mapped later).
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
  let navigated = false;
  const go = () => {
    if (navigated) return;
    navigated = true;
    FlowRouter.go('board', { id: boardId, slug });
  };
  Meteor.subscribe('board', boardId, false, { onReady: go });
  Meteor.setTimeout(go, 5000);
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
  this.steps = ['importTextarea', 'importMapMembers'];
  this._currentStepIndex = new ReactiveVar(0);
  this.importedData = new ReactiveVar();
  this.membersToMap = new ReactiveVar([]);
  this.importSource = Session.get('importSource');
  // True while a Trello .zip package is being uploaded/imported server-side.
  this.zipImporting = new ReactiveVar(false);

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
    const advance = async () => {
      if (skipMapping) {
        await this.finishImport();
      } else {
        this.nextStep();
      }
    };
    // Excel (.xlsx): the file is parsed on the server (with exceljs) into rows
    // and imported through the CSV creator. Member mapping is skipped (members
    // can be mapped later), so we read the file to base64 and import directly.
    if (dataSource === 'excel') {
      const el = this.find('.js-import-excel-file');
      if (!el || !el.files || !el.files[0]) {
        this.setError('error-json-malformed');
        return;
      }
      const buf = await el.files[0].arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      this.importedData.set({ excelBase64: window.btoa(binary) });
      this.membersToMap.set([]);
      await this.finishImport();
      return;
    }
    if (dataSource === 'csv') {
      const input = this.find('.js-import-json').value;
      const csv = input.indexOf('\t') > 0 ? input.replace(/(\t)/g, ',') : input;
      const ret = Papa.parse(csv);
      if (ret && ret.data && ret.data.length) this.importedData.set(ret.data);
      else throw new Meteor.Error('error-csv-schema');
      const membersToMap = _prepareAdditionalData(ret.data);
      this.membersToMap.set(membersToMap);
      await advance();
      return;
    }
    // Trello: a .zip package (one or more board .json files plus per-board
    // attachment subdirectories from the Trello Attachments Downloader) imports
    // all of its boards at once, through a separate field from the single .json.
    if (dataSource === 'trello') {
      const zipEl = this.find('.js-import-zip-file');
      if (zipEl && zipEl.files && zipEl.files[0]) {
        await this.importTrelloZip(zipEl.files[0]);
        return;
      }
    }
    try {
      // A single board: JSON may come from an uploaded .json file (large Trello
      // exports are awkward to paste) or from the textarea.
      let input = this.find('.js-import-json').value;
      const jsonFileEl = this.find('.js-import-json-file');
      if (jsonFileEl && jsonFileEl.files && jsonFileEl.files[0]) {
        input = await jsonFileEl.files[0].text();
      }
      const dataObject = JSON.parse(input);
      // Guard against importing a broken/old WeKan export that has no board
      // content (see wekanExportIsEmpty): warn the user to re-export rather than
      // silently creating an empty board with only a Default swimlane.
      if (this.importSource === 'wekan' && wekanExportIsEmpty(dataObject)) {
        this.setError('error-import-empty-board');
        return;
      }
      this.setError('');

      // Trello: remember the target personal-workspace name for finishImport.
      this.workspaceName = '';
      if (dataSource === 'trello') {
        const wsEl = this.find('.js-import-workspace-name');
        this.workspaceName = wsEl && wsEl.value ? wsEl.value.trim() : '';
      }

      this.importedData.set(dataObject);
      const membersToMap = _prepareAdditionalData(dataObject);
      // store members data and mapping in Session
      // (we go deep and 2-way, so storing in data context is not a viable option)
      this.membersToMap.set(membersToMap);
      await advance();
    } catch (e) {
      this.setError('error-json-malformed');
    }
  };

  // Upload a Trello .zip package to the server, which extracts it (with
  // zip-bomb / path-traversal guards), imports every board and streams each
  // attachment to the Default storage, then go to All Boards.
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
    const membersMapping = this.membersToMap.get();
    const mappingById = {};
    if (membersMapping) {
      membersMapping.forEach(member => {
        if (member.wekanId) {
          mappingById[member.id] = member.wekanId;
        }
      });
    }
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
          JSON.stringify({ board: importedData, membersMapping: mappingById }),
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
      goToImportedBoard(boardId, boardSlug(importedData));
      return;
    }

    // wekan / csv: unchanged DDP import.
    this.membersToMap.set([]);
    Meteor.call(
      'importBoard',
      importedData,
      { membersMapping: mappingById },
      this.importSource,
      Session.get('fromBoard'),
      (err, res) => {
        if (err) {
          this.setError(err.error);
        } else {
          Session.set('fromBoard', null);
            goToImportedBoard(res, boardSlug(importedData));
        }
      },
    );
  };
});

Template.import.helpers({
  error() {
    return Template.instance().error;
  },
  currentTemplate() {
    return Template.instance().steps[Template.instance()._currentStepIndex.get()];
  },
  zipImporting() {
    return Template.instance().zipImporting.get();
  },
});

Template.importTextarea.helpers({
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
  isExcelImport() {
    return Session.get('importSource') === 'excel';
  },
});

Template.importTextarea.events({
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

Template.importMapMembersAddPopup.events({
  'click .js-select-import'(event, tpl) {
    if (_importMapMembersTpl) {
      _importMapMembersTpl.mapSelectedMember(Template.currentData().__originalId);
    }
    Popup.back();
  },
  'keyup .js-search-member-input'(event, tpl) {
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
