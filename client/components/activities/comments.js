let commentFormIsOpen = new ReactiveVar(false);

BlazeComponent.extendComponent({
  template() {
    return 'commentForm';
  },

  onDestroyed() {
    commentFormIsOpen.set(false);
  },

  commentFormIsOpen() {
    return commentFormIsOpen.get();
  },

  getInput() {
    return this.$('.js-new-comment-input');
  },

  events() {
    return [{
      'click .js-new-comment:not(.focus)': function() {
        commentFormIsOpen.set(true);
      },
      'submit .js-new-comment-form': function(evt) {
        let input = this.getInput();
        if ($.trim(input.val())) {
          CardComments.insert({
            boardId: this.boardId,
            cardId: this._id,
            text: input.val()
          });
          resetCommentInput(input);
          Tracker.flush();
          autosize.update(input);
        }
        evt.preventDefault();
      },
      // Pressing Ctrl+Enter should submit the form
      'keydown form textarea': function(evt) {
        if (evt.keyCode === 13 && (evt.metaKey || evt.ctrlKey)) {
          this.find('button[type=submit]').click();
        }
      }
    }];
  }
}).register('commentForm');

// XXX This should be a static method of the `commentForm` component
function resetCommentInput(input) {
  input.val('');
  input.blur();
  commentFormIsOpen.set(false);
}

// XXX This should handled a `onUpdated` callback of the `commentForm` component
// but since this callback doesn't exists, and `onRendered` is not called if the
// data is not destroyed and recreated, we simulate the desired callback using
// Tracker.autorun to register the component dependencies, and re-run when these
// dependencies are invalidated. A better component API would remove this hack.
Tracker.autorun(() => {
  Session.get('currentCard');
  Tracker.afterFlush(() => {
    autosize.update($('.js-new-comment-input'));
  });
})

EscapeActions.register('inlinedForm',
  function() {
    const draftKey = {
      fieldName: 'cardComment',
      docId: Session.get('currentCard')
    };
    let commentInput = $('.js-new-comment-input');
    if ($.trim(commentInput.val())) {
      UnsavedEdits.set(draftKey, commentInput.val());
    } else {
      UnsavedEdits.reset(draftKey);
    }
    resetCommentInput(commentInput);
  },
  function() { return commentFormIsOpen.get(); }, {
    noClickEscapeOn: '.js-new-comment'
  }
);
