import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import './boardDragSettings.jade';
import './boardDragSettings.css';
const { DRAG_SETTINGS, canDrag } = require('/models/lib/boardDragging');
Template.boardDragSettings.onCreated(function () { this.error = new ReactiveVar(''); });
Template.boardDragSettings.helpers({
  error() { return Template.instance().error; },
  rows() {
    const boardId = Session.get('currentBoard');
    const board = ReactiveCache.getBoard(boardId);
    const user = ReactiveCache.getCurrentUser();
    return DRAG_SETTINGS.filter(setting => setting.section === this.section).map(setting => ({
      ...setting, title: TAPi18n.__(setting.label), enabled: canDrag(board, setting.kind),
      disabled: !(user?.isAdmin || user?.isBoardAdmin(boardId)),
    }));
  },
});
Template.boardDragSettings.events({
  async 'change .js-board-drag-setting'(event, instance) {
    const input = event.currentTarget;
    const enabled = input.checked;
    input.disabled = true;
    instance.error.set('');
    try {
      await Meteor.callAsync('setBoardDragging', Session.get('currentBoard'), input.dataset.kind, enabled);
    } catch (error) {
      input.checked = !enabled;
      instance.error.set(error.reason || error.message);
    } finally { input.disabled = false; }
  },
});
