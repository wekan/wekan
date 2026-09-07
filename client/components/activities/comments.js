import { ReactiveCache } from '/imports/reactiveCache';
import CardComments, { canEditComment } from '/models/cardComments';
import { UnsavedEdits } from '/client/lib/unsavedEdits';
import { EscapeActions } from '/client/lib/escapeActions';
import { Utils } from '/client/lib/utils';
import autosize from 'autosize';

const commentFormIsOpen = new ReactiveVar(false);
// _id of the comment currently being replied to (threaded replies, issue #5907).
// Empty string means a new top-level comment.
const replyToCommentId = new ReactiveVar('');

// #5547: persist the comment draft (debounced) into UnsavedEdits while the user
// types, so a comment in progress survives closing the card, clicking outside
// it, or navigating away — the form prefills from {{getUnsavedValue
// 'cardComment' ...}} on the next open. Historical note: the click-open flag
// that armed the old escape-time draft save was removed in 2019 (3b3950369)
// because the escape handler CLEARED the visible text; since then nothing saved
// the draft at all, so any close of the card discarded the comment.
let commentDraftTimer = null;
let commentDraftPending = null; // { cardId, value }

function commentDraftWrite({ cardId, value }) {
  if (!cardId) return;
  const draftKey = { fieldName: 'cardComment', docId: cardId };
  if ((value || '').trim()) {
    UnsavedEdits.set(draftKey, value);
  } else {
    UnsavedEdits.reset(draftKey);
  }
}

function scheduleCommentDraftSave(cardId, value) {
  commentDraftPending = { cardId, value };
  if (commentDraftTimer) clearTimeout(commentDraftTimer);
  commentDraftTimer = setTimeout(() => {
    commentDraftTimer = null;
    const pending = commentDraftPending;
    commentDraftPending = null;
    if (pending) commentDraftWrite(pending);
  }, 300);
}

// Run a pending (debounced) save immediately — e.g. the card is closing.
function flushCommentDraftSave() {
  if (commentDraftTimer) {
    clearTimeout(commentDraftTimer);
    commentDraftTimer = null;
  }
  const pending = commentDraftPending;
  commentDraftPending = null;
  if (pending) commentDraftWrite(pending);
}

// Drop any pending save — the comment was submitted, so there is no draft.
function cancelCommentDraftSave() {
  if (commentDraftTimer) {
    clearTimeout(commentDraftTimer);
    commentDraftTimer = null;
  }
  commentDraftPending = null;
}

Template.commentForm.onDestroyed(function () {
  // #5547: the card can close without the escape handler ever running (the X
  // button, a route change); make sure the last keystrokes reach the draft.
  flushCommentDraftSave();
  commentFormIsOpen.set(false);
  $('.note-popover').hide();
});

Template.commentForm.helpers({
  commentFormIsOpen() {
    return commentFormIsOpen.get();
  },
  // The comment being replied to, if any, so the form can show an
  // "In reply to ..." banner with a way to cancel.
  replyToComment() {
    const id = replyToCommentId.get();
    return id ? ReactiveCache.getCardComment(id) : undefined;
  },
});

Template.commentForm.events({
  // #5547: arm the escape handler below (it saves the draft and closes the
  // form); this flag had no setter since 2019, so the handler never ran.
  'focus .js-new-comment-input'() {
    commentFormIsOpen.set(true);
  },
  // #5547: keep the draft continuously saved (debounced) while typing.
  'input .js-new-comment-input'(evt) {
    scheduleCommentDraftSave(Utils.getCurrentCardId(), evt.currentTarget.value);
  },
  'submit .js-new-comment-form'(evt, tpl) {
    const input = tpl.$('.js-new-comment-input');
    const text = input.val().trim();
    const card = Template.currentData();
    let boardId = card.boardId;
    let cardId = card._id;
    if (card.isLinkedCard()) {
      boardId = ReactiveCache.getCard(card.linkedId).boardId;
      cardId = card.linkedId;
    } else if (card.isLinkedBoard()) {
      boardId = card.linkedId;
    }
    if (text) {
      const parentId = replyToCommentId.get();
      CardComments.insert({
        text,
        boardId,
        cardId,
        parentId: parentId || '',
      });
      // #5547: the comment is saved — cancel any debounced draft save still in
      // flight and remove the stored draft so it does not resurface next open.
      cancelCommentDraftSave();
      UnsavedEdits.reset({
        fieldName: 'cardComment',
        docId: Utils.getCurrentCardId(),
      });
      replyToCommentId.set('');
      resetCommentInput(input);
      Tracker.flush();
      autosize.update(input);
      input.trigger('submitted');
    }
    evt.preventDefault();
  },
  'click .js-cancel-reply'(evt) {
    evt.preventDefault();
    replyToCommentId.set('');
  },
  // Pressing Ctrl+Enter should submit the form
  'keydown form textarea'(evt, tpl) {
    if (evt.keyCode === 13 && (evt.metaKey || evt.ctrlKey)) {
      tpl.find('button[type=submit]').click();
    }
  },
});

Template.comments.helpers({
  getComments() {
    const data = Template.currentData();
    if (!data || typeof data.comments !== 'function') return [];
    return data.comments();
  },
});

Template.comment.helpers({
  // Whether the current user may edit/delete this comment, honouring the
  // board's restrictCommentEditing setting (issue #5906). Mirrors the
  // server-side enforcement so the UI hides buttons the server would reject.
  canEditThisComment() {
    const user = ReactiveCache.getCurrentUser();
    if (!user) return false;
    const isAuthor = user._id === this.userId;
    const board = ReactiveCache.getBoard(this.boardId);
    const isBoardAdmin = !!board && board.hasAdmin(user._id);
    const restrictCommentEditing = !!board && !!board.restrictCommentEditing;
    return canEditComment({ isAuthor, isBoardAdmin, restrictCommentEditing });
  },
  // The parent comment this one replies to, or undefined.
  parentComment() {
    return this.parentId ? ReactiveCache.getCardComment(this.parentId) : undefined;
  },
});

Template.comment.events({
  'click .js-reply-comment'(evt) {
    evt.preventDefault();
    replyToCommentId.set(this._id);
    // Open and focus the new-comment form.
    const input = $('.js-new-comment-input');
    input.click();
    Tracker.afterFlush(() => {
      $('.js-new-comment-input').focus();
    });
  },
  'click .js-delete-comment': Popup.afterConfirm('deleteComment', function () {
    const commentId = this._id;
    // #3252: only remove if the doc is still in the local cache. Under heavy
    // archive/delete churn the comment can already be evicted from Minimongo,
    // and CardComments.remove() of a missing _id throws "Removed nonexistent
    // document" on the client.
    if (commentId && CardComments.findOne(commentId)) {
      CardComments.remove(commentId);
    }
    Popup.back();
  }),
  'submit .js-edit-comment'(evt, tpl) {
    evt.preventDefault();
    const textarea = tpl.find('.js-edit-comment textarea,input[type=text]');
    const commentText = textarea && textarea.value ? textarea.value.trim() : '';
    const commentId = tpl.data._id;
    if (commentText) {
      CardComments.update(commentId, {
        $set: {
          text: commentText,
        },
      });
    }
  },
});

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
    const draft = (commentInput.val() || '').trim();
    cancelCommentDraftSave();
    if (draft) {
      UnsavedEdits.set(draftKey, draft);
    } else {
      UnsavedEdits.reset(draftKey);
    }
    // #5547: do NOT clear the input — clearing it on every click outside the
    // comment box is exactly the "comment text disappearing" bug that got this
    // handler disarmed in 2019 (3b3950369). The draft is saved above; if the
    // card stays open, the text stays visible; if the card closes, the next
    // open prefills the form from the draft.
    commentInput.blur();
    commentFormIsOpen.set(false);
  },
  () => {
    return commentFormIsOpen.get();
  },
  {
    noClickEscapeOn: '.js-new-comment',
  },
);
