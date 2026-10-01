import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { TAPi18n } from '/imports/i18n';
import { Utils } from '/client/lib/utils';
import { dependencyVisibility, canEditBoardDependenciesHere, myDependencyLines } from '/client/lib/dependencyLayers';
import { collectDependencyLines, collectMyDependencyLines, exportDependenciesJson, exportDependenciesSvg }
  from '/client/lib/exportDependencies';
import { parseDependencyLines } from '/client/lib/importDependencies';

// #6732: Show My / Show Board Dependencies, Import and Export, at the top of
// Member Settings. Showing is each user's own choice; Board Dependencies are
// imported only by roles that may edit or move cards (the server checks again).

Template.memberDependencyMenuItems.helpers({
  showMyDependencies() {
    return dependencyVisibility().mine;
  },
  showBoardDependencies() {
    return dependencyVisibility().board;
  },
});

Template.memberDependencyMenuItems.events({
  'click .js-toggle-my-dependencies'(event) {
    event.preventDefault();
    Meteor.callAsync('setDependencyVisibility', 'mine', !dependencyVisibility().mine).catch(() => {});
  },
  'click .js-toggle-board-dependencies'(event) {
    event.preventDefault();
    Meteor.callAsync('setDependencyVisibility', 'board', !dependencyVisibility().board).catch(() => {});
  },
  'click .js-import-member-dependencies': Popup.open('importMemberDependencies'),
  'click .js-export-member-dependencies': Popup.open('exportMemberDependencies'),
});

Template.importMemberDependenciesPopup.onCreated(function () {
  this.fileText = new ReactiveVar('');
  this.importResult = new ReactiveVar('');
});

Template.importMemberDependenciesPopup.helpers({
  canEditBoardDependencies() {
    return canEditBoardDependenciesHere(Utils.getCurrentBoard());
  },
  importResult() {
    return Template.instance().importResult.get();
  },
});

Template.importMemberDependenciesPopup.events({
  'change .js-import-member-dependencies-file'(event, tpl) {
    const file = event.currentTarget.files && event.currentTarget.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => tpl.fileText.set(e.target.result || '');
    reader.readAsText(file);
  },
  async 'submit .js-import-member-dependencies-form'(event, tpl) {
    event.preventDefault();
    const board = Utils.getCurrentBoard();
    const chosen = tpl.find('input[name="dependency-layer"]:checked');
    const layer = chosen ? chosen.value : 'mine';
    const fileEl = tpl.find('.js-import-member-dependencies-file');
    const filename = fileEl && fileEl.files && fileEl.files[0] ? fileEl.files[0].name : '';
    const text = tpl.fileText.get() || tpl.find('.js-import-member-dependencies-text').value || '';
    let lines = [];
    try {
      lines = parseDependencyLines(text, filename);
    } catch (e) {
      tpl.importResult.set(TAPi18n.__('import-dependencies-parse-error'));
      return;
    }
    if (!board || lines.length === 0) {
      tpl.importResult.set(TAPi18n.__('import-dependencies-empty'));
      return;
    }
    try {
      const res = await Meteor.callAsync(layer === 'board' ? 'importBoardDependencies' : 'importMyDependencies',
        board._id, lines);
      tpl.importResult.set(TAPi18n.__('import-dependencies-merged',
        { imported: res.imported, skipped: res.skipped, unmatched: res.unmatched }));
    } catch (err) {
      tpl.importResult.set(err.error === 'not-authorized'
        ? TAPi18n.__('dependencies-board-edit-required') : (err.reason || err.message || String(err)));
    }
  },
});

function exportLayer(layer, format) {
  const board = Utils.getCurrentBoard();
  if (!board) return;
  const lines = layer === 'my'
    ? collectMyDependencyLines(board._id, myDependencyLines(board._id))
    : collectDependencyLines(board._id);
  (format === 'svg' ? exportDependenciesSvg : exportDependenciesJson)(board._id, lines, layer);
  Popup.close();
}

Template.exportMemberDependenciesPopup.events({
  'click .js-export-my-dependencies-json'(event) { event.preventDefault(); exportLayer('my', 'json'); },
  'click .js-export-my-dependencies-svg'(event) { event.preventDefault(); exportLayer('my', 'svg'); },
  'click .js-export-board-dependencies-json'(event) { event.preventDefault(); exportLayer('board', 'json'); },
  'click .js-export-board-dependencies-svg'(event) { event.preventDefault(); exportLayer('board', 'svg'); },
});
