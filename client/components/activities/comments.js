const commentFormIsOpen = new ReactiveVar(false);

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

  onRendered() {
    // if( Session.get('currentCommentCard') === this.currentData()._id )
    //   this.getInput().value = Session.get('currentComment');
  },
  events() {
    return [{
      'click .js-new-comment:not(.focus)'() {
        commentFormIsOpen.set(true);
      },
      'submit .js-new-comment-form'(evt) {
        const input = this.getInput();
        if(!(Meteor.userId())) {
          Session.set('currentCommentCard',this.currentData()._id);
          Session.set('currentComment',input.val());
          evt.preventDefault();
          FlowRouter.go("atSignIn");
          return;
        }
        if ($.trim(input.val())) {
          if( ! Meteor.user().isBoardMember() )
            Boards.update(this.boardId, {
              $push: {
                members: {
                  userId: Meteor.userId(),
                  isAdmin: false,
                  isActive: true
                }
              }
            });
          CardComments.insert({
            boardId: this.currentData().boardId,
            cardId: this.currentData()._id,
            text: input.val(),
          });
          //Session.set('currentComment', null);
          resetCommentInput(input);
          Tracker.flush();
          autosize.update(input);
        }
        evt.preventDefault();
      },
      // Pressing Ctrl+Enter should submit the form
      'keydown form textarea'(evt) {
        if (evt.keyCode === 13 && (evt.metaKey || evt.ctrlKey)) {
          this.find('button[type=submit]').click();
        }
      },
    }];
  },
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
});

EscapeActions.register('inlinedForm',
  () => {
    const draftKey = {
      fieldName: 'cardComment',
      docId: Session.get('currentCard'),
    };
    const commentInput = $('.js-new-comment-input');
    if ($.trim(commentInput.val())) {
      if(Meteor.userId())
        UnsavedEdits.set(draftKey, commentInput.val());
      else
        SessionUnsavedEdits.set(draftKey, commentInput.val());
    } else {
      UnsavedEdits.reset(draftKey);
      SessionUnsavedEdits.reset(draftKey);
    }
    resetCommentInput(commentInput);
  },
  () => { return commentFormIsOpen.get(); }, {
    noClickEscapeOn: '.js-new-comment',
  }
);
