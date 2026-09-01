import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';
import { TAPi18n } from '/imports/i18n';
import { ReactiveCache } from '/imports/reactiveCache';
import Attachments from '/models/attachments';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
import { formatDateTime } from '/imports/lib/dateUtils';
import { handleFileUpload } from '/client/components/cards/attachments';
const { notHelperBoardTitle } = require('/models/lib/helperBoards');

function writableDestinationBoards() {
  const userId = Meteor.userId();
  return Boards.find(
    {
      archived: false,
      type: 'board',
      personalInboxOwnerId: { $exists: false },
      title: notHelperBoardTitle(),
      members: { $elemMatch: { userId, isActive: true } },
    },
    { sort: { title: 1 } },
  )
    .fetch()
    .filter(board => {
      const member = (board.members || []).find(item => item.userId === userId);
      return Boolean(
        member &&
        member.isActive &&
        !member.isReadOnly &&
        !member.isReadAssignedOnly &&
        !member.isCommentOnly &&
        !member.isCommentAssignedOnly,
      );
    });
}

function listsForBoard(boardId) {
  if (!boardId) return [];
  return Lists.find(
    { boardId, archived: false },
    { sort: { sort: 1, title: 1 } },
  ).fetch();
}

function waitForCard(cardId) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const poll = () => {
      const card = ReactiveCache.getCard(cardId);
      if (card) {
        resolve(card);
        return;
      }
      attempts += 1;
      if (attempts >= 60) {
        reject(new Error('personal-inbox-card-not-published'));
        return;
      }
      Meteor.setTimeout(poll, 50);
    };
    poll();
  });
}

function waitForUploads(uploaders) {
  return Promise.all(
    uploaders.map(
      uploader =>
        new Promise(resolve => {
          let done = false;
          const finish = error => {
            if (done) return;
            done = true;
            resolve(error || null);
          };
          uploader.on('end', error => finish(error));
          uploader.on('error', error => finish(error));
        }),
    ),
  );
}

async function moveInboxCard(template, cardId, boardId, listId) {
  if (!cardId || !boardId || !listId) return;
  template.isBusy.set(true);
  template.status.set({
    type: 'progress',
    message: TAPi18n.__('personal-inbox-moving'),
  });
  try {
    await Meteor.callAsync('personalInbox.move', cardId, boardId, listId);
    template.status.set({
      type: 'success',
      message: TAPi18n.__('personal-inbox-moved'),
    });
  } catch (error) {
    template.status.set({
      type: 'error',
      message: error && error.reason
        ? error.reason
        : TAPi18n.__('personal-inbox-error'),
    });
  } finally {
    template.isBusy.set(false);
  }
}

Template.personalInbox.onCreated(function() {
  this.inboxBoardId = new ReactiveVar(null);
  this.isLoading = new ReactiveVar(true);
  this.isBusy = new ReactiveVar(false);
  this.status = new ReactiveVar(null);
  this.moveBoards = new ReactiveDict();
  this.draggedCardId = null;

  Meteor.callAsync('personalInbox.ensure')
    .then(ids => {
      this.inboxBoardId.set(ids.boardId);
      this.subscribe('personalInbox', {
        onReady: () => this.isLoading.set(false),
        onError: error => {
          this.status.set({
            type: 'error',
            message: error && error.reason
              ? error.reason
              : TAPi18n.__('personal-inbox-error'),
          });
          this.isLoading.set(false);
        },
      });
    })
    .catch(error => {
      this.status.set({
        type: 'error',
        message: error && error.reason
          ? error.reason
          : TAPi18n.__('personal-inbox-error'),
      });
      this.isLoading.set(false);
    });
});

Template.personalInbox.helpers({
  isLoading() {
    return Template.instance().isLoading.get();
  },
  isBusy() {
    return Template.instance().isBusy.get();
  },
  statusMessage() {
    const status = Template.instance().status.get();
    return status && status.message;
  },
  statusClass() {
    const status = Template.instance().status.get();
    return status ? `is-${status.type}` : '';
  },
  inboxCards() {
    const boardId = Template.instance().inboxBoardId.get();
    if (!boardId) return [];
    return Cards.find(
      { boardId, archived: false },
      { sort: { sort: 1, capturedAt: -1 } },
    ).fetch();
  },
  hasInboxCards() {
    const boardId = Template.instance().inboxBoardId.get();
    return Boolean(boardId && Cards.find({ boardId, archived: false }).count());
  },
  inboxCount() {
    const boardId = Template.instance().inboxBoardId.get();
    return boardId ? Cards.find({ boardId, archived: false }).count() : 0;
  },
  formatInboxDate(value) {
    return value ? formatDateTime(value) : '';
  },
  cardAttachments(cardId) {
    const cursor = Attachments.find(
      { 'meta.cardId': cardId },
      { sort: { uploadedAt: -1 } },
    );
    if (cursor && cursor.cursor) cursor.cursor.fetch();
    return cursor.each();
  },
  destinationBoards(cardId) {
    const template = Template.instance();
    const boards = writableDestinationBoards();
    const selected = template.moveBoards.get(cardId) || (boards[0] && boards[0]._id);
    return boards.map(board => ({ ...board, selected: board._id === selected }));
  },
  destinationLists(cardId) {
    const template = Template.instance();
    const boards = writableDestinationBoards();
    const boardId = template.moveBoards.get(cardId) || (boards[0] && boards[0]._id);
    return listsForBoard(boardId);
  },
  destinationTargets() {
    return writableDestinationBoards().flatMap(board =>
      listsForBoard(board._id).map(list => ({
        boardId: board._id,
        boardTitle: board.title,
        listId: list._id,
        listTitle: list.title,
      })),
    );
  },
  hasDestinationLists() {
    return writableDestinationBoards().some(board => listsForBoard(board._id).length > 0);
  },
});

Template.personalInbox.events({
  async 'submit .js-personal-inbox-capture'(event, template) {
    event.preventDefault();
    if (template.isBusy.get()) return;
    template.isBusy.set(true);
    template.status.set({
      type: 'progress',
      message: TAPi18n.__('personal-inbox-capturing'),
    });

    const form = event.currentTarget;
    const files = form.querySelector('.js-personal-inbox-attachment').files;
    try {
      const result = await Meteor.callAsync('personalInbox.capture', {
        title: form.querySelector('.js-personal-inbox-title').value,
        sourceUrl: form.querySelector('.js-personal-inbox-source-url').value,
        description: form.querySelector('.js-personal-inbox-description').value,
      });
      if (files && files.length) {
        const card = await waitForCard(result.cardId);
        const uploaders = await handleFileUpload(card, files, {
          skipClientPermissionCheck: true,
        });
        const errors = await waitForUploads(uploaders);
        if (errors.some(Boolean)) throw errors.find(Boolean);
      }
      form.reset();
      template.status.set({
        type: 'success',
        message: TAPi18n.__('personal-inbox-captured'),
      });
    } catch (error) {
      template.status.set({
        type: 'error',
        message: error && error.reason
          ? error.reason
          : TAPi18n.__('personal-inbox-error'),
      });
    } finally {
      template.isBusy.set(false);
    }
  },

  'change .js-personal-inbox-board'(event, template) {
    template.moveBoards.set(event.currentTarget.dataset.cardId, event.currentTarget.value);
  },

  async 'submit .js-personal-inbox-move'(event, template) {
    event.preventDefault();
    const form = event.currentTarget;
    await moveInboxCard(
      template,
      form.dataset.cardId,
      form.querySelector('.js-personal-inbox-board').value,
      form.querySelector('.js-personal-inbox-list').value,
    );
  },

  'dragstart .js-personal-inbox-card'(event, template) {
    template.draggedCardId = event.currentTarget.dataset.cardId;
    if (event.originalEvent && event.originalEvent.dataTransfer) {
      event.originalEvent.dataTransfer.effectAllowed = 'move';
      event.originalEvent.dataTransfer.setData('text/plain', template.draggedCardId);
    }
  },

  'dragover .js-personal-inbox-drop-target'(event) {
    event.preventDefault();
    if (event.originalEvent && event.originalEvent.dataTransfer) {
      event.originalEvent.dataTransfer.dropEffect = 'move';
    }
  },

  async 'drop .js-personal-inbox-drop-target'(event, template) {
    event.preventDefault();
    const transfer = event.originalEvent && event.originalEvent.dataTransfer;
    const cardId = (transfer && transfer.getData('text/plain')) || template.draggedCardId;
    await moveInboxCard(
      template,
      cardId,
      event.currentTarget.dataset.boardId,
      event.currentTarget.dataset.listId,
    );
    template.draggedCardId = null;
  },
});
