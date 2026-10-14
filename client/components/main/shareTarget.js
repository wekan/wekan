import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';

const { sharedCard } = require('/models/lib/shareTarget');

// #1293: the page Share → WeKan opens on a phone.
function shared() {
  return {
    title: FlowRouter.getQueryParam('title') || '',
    text: FlowRouter.getQueryParam('text') || '',
    url: FlowRouter.getQueryParam('url') || '',
  };
}

Template.shareTarget.onCreated(function () {
  this.boardId = new ReactiveVar('');
  this.message = new ReactiveVar('');
  this.subscribe('boards');
  this.autorun(() => {
    const boardId = this.boardId.get();
    if (boardId) this.subscribe('board', boardId, false);
  });
});

Template.shareTarget.helpers({
  preview() { return sharedCard(shared()); },
  // Boards the member may add cards to; the server checks the list too.
  writableBoards() {
    const user = ReactiveCache.getCurrentUser();
    if (!user) return [];
    return ReactiveCache.getBoards({ archived: false, type: { $ne: 'template-container' }, members: { $elemMatch: {
      userId: user._id, isActive: true, isReadOnly: { $ne: true }, isCommentOnly: { $ne: true },
      isNoComments: { $ne: true }, isReadAssignedOnly: { $ne: true } } } }, { sort: { title: 1 } });
  },
  isSelectedBoard() { return this._id === Template.instance().boardId.get(); },
  noBoard() { return !Template.instance().boardId.get(); },
  boardLists() {
    const boardId = Template.instance().boardId.get();
    return boardId ? ReactiveCache.getLists({ boardId, archived: false }, { sort: { sort: 1 } }) : [];
  },
  message() { return Template.instance().message.get(); },
});

Template.shareTarget.events({
  'change .js-share-target-board'(event, tpl) {
    tpl.boardId.set(event.currentTarget.value);
  },
  async 'submit .js-share-target-form, click .js-share-target-create'(event, tpl) {
    event.preventDefault();
    const boardId = tpl.boardId.get();
    const listId = tpl.$('.js-share-target-list').val();
    if (!boardId || !listId) return;
    try {
      const result = await Meteor.callAsync('shareTargetCreateCard', { boardId, listId, ...shared() });
      FlowRouter.go('card', { boardId: result.boardId, slug: result.slug, cardId: result.cardId });
    } catch (error) {
      tpl.message.set(TAPi18n.__(error.error) || error.reason || error.message);
    }
  },
});
