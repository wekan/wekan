import { ReactiveCache } from '/imports/reactiveCache';

const commentFormIsOpen = new ReactiveVar(false);

BlazeComponent.extendComponent({
  onDestroyed() {
    commentFormIsOpen.set(false);
    $('.note-popover').hide();
  },

  commentFormIsOpen() {
    return commentFormIsOpen.get();
  },

  getInput() {
    return this.$('.js-new-comment-input');
  },

  events() {
    return [
      {
        'submit .js-new-comment-form'(evt) {
          const input = this.getInput();
          const text = input.val().trim();
          const card = this.currentData();
          let boardId = card.boardId;
          let cardId = card._id;
          if (card.isLinkedCard()) {
            boardId = ReactiveCache.getCard(card.linkedId).boardId;
            cardId = card.linkedId;
          } else if (card.isLinkedBoard()) {
            boardId = card.linkedId;
          }
          if (text) {
            CardComments.insert({
              text,
              boardId,
              cardId,
            });
            resetCommentInput(input);
            Tracker.flush();
            autosize.update(input);
            input.trigger('submitted');
          }
          evt.preventDefault();
        },
        // Pressing Ctrl+Enter should submit the form
        'keydown form textarea'(evt) {
          if (evt.keyCode === 13 && (evt.metaKey || evt.ctrlKey)) {
            this.find('button[type=submit]').click();
          }
        },
      },
    ];
  },
}).register('commentForm');

BlazeComponent.extendComponent({
  getComments() {
    const ret = this.data().comments();
    return ret;
  },
}).register("comments");

BlazeComponent.extendComponent({
  events() {
    return [
      {
        'click .js-delete-comment': Popup.afterConfirm('deleteComment', () => {
          const commentId = this.data()._id;
          CardComments.remove(commentId);
          Popup.back();
        }),
        'submit .js-edit-comment'(evt) {
          evt.preventDefault();
          const commentText = this.currentComponent()
            .getValue()
            .trim();
          const commentId = this.data()._id;
          if (commentText) {
            CardComments.update(commentId, {
              $set: {
                text: commentText,
              },
            });
          }
        },
      },
    ];
  },
}).register("comment");

// XXX This should be a static method of the `commentForm` component
function resetCommentInput(input) {
  input.val(''); // without manually trigger, input event won't be fired
  input.blur();
  commentFormIsOpen.set(false);
}

// XXX This should handled a `onUpdated` callback of the `commentForm` component
// but since this callback doesn't exists, and `onRendered` is not called if the
// data is not destroyed and recreated, we simulate the desired callback using
// Tracker.autorun to register the component dependencies, and re-run when these
// dependencies are invalidated. A better component API would remove this hack.
Tracker.autorun(() => {
  Utils.getCurrentCardId();
  Tracker.afterFlush(() => {
    autosize.update($('.js-new-comment-input'));
  });
});

EscapeActions.register(
  'inlinedForm',
  () => {
    const draftKey = {
      fieldName: 'cardComment',
      docId: Utils.getCurrentCardId(),
    };
    const commentInput = $('.js-new-comment-input');
    const draft = commentInput.val().trim();
    if (draft) {
      UnsavedEdits.set(draftKey, draft);
    } else {
      UnsavedEdits.reset(draftKey);
    }
    resetCommentInput(commentInput);
  },
  () => {
    return commentFormIsOpen.get();
  },
  {
    noClickEscapeOn: '.js-new-comment',
  },
);
