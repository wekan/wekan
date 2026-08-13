import { ReactiveDict } from 'meteor/reactive-dict';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { Session } from 'meteor/session';
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

function scopeTitle() {
  const data = Template.currentData() || {};
  return data.title || 'export';
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

function exportFilename(extension) {
  const name = String(scopeTitle())
    .replace(/[^a-z0-9._-]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'export';
  return `${name}.${extension}`;
}

Template.exportScopeBody.helpers({
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
  exportUrlPDF() {
    return exportUrl('/api/boards/:boardId/exportPDF');
  },
  exportUrlExcel() {
    return exportUrl('/api/boards/:boardId/exportExcel');
  },
  exportUrlJson() {
    return exportUrl('/api/boards/:boardId/export');
  },
  // The same document without the base64 file data - #5870's option, offered
  // wherever an export is offered rather than only on the board menu.
  exportUrlJsonNoAttachments() {
    return exportUrl('/api/boards/:boardId/export', { attachments: 'false' });
  },
  exportUrlZip() {
    return exportUrl('/api/boards/:boardId/exportZip');
  },
  exportFilenameJson() {
    return exportFilename('json');
  },
  exportFilenameZip() {
    return exportFilename('zip');
  },
  exportFilenamePDF() {
    return exportFilename('pdf');
  },
  exportFilenameExcel() {
    return exportFilename('xlsx');
  },
});

Template.exportScopeBody.events({
  'click .js-export-field-toggle'(event) {
    // The popup stays open: choosing five sections should not be five reopens.
    event.preventDefault();
    const field = event.currentTarget.dataset.field;
    selection.set(field, !selection.get(field));
  },
  'click .js-export-card-details-toggle'(event) {
    event.preventDefault();
    selection.set('card-details', !selection.get('card-details'));
  },
});

export { selectedFields, selection };
