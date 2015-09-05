var commentFormIsOpen = new ReactiveVar(false);

Template.commentForm.helpers({
  commentFormIsOpen: function() {
    return commentFormIsOpen.get();
  }
});

Template.commentForm.events({
  'click .js-new-comment:not(.focus)': function() {
    commentFormIsOpen.set(true);
  },
  'submit .js-new-comment-form': function(evt, tpl) {
    var input = tpl.$('.js-new-comment-input');
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
        boardId: this.boardId,
        cardId: this._id,
        text: input.val()
      });
      input.val('');
      input.blur();
      commentFormIsOpen.set(false);
      Tracker.flush();
      autosize.update(input);
    }
    evt.preventDefault();
  },
  // Pressing Ctrl+Enter should submit the form
  'keydown form textarea': function(evt, tpl) {
    if (evt.keyCode === 13 && (evt.metaKey || evt.ctrlKey)) {
      tpl.find('button[type=submit]').click();
    }
  }
});

Template.commentForm.onDestroyed(function() {
  commentFormIsOpen.set(false);
});

EscapeActions.register('inlinedForm',
  function() {
    commentFormIsOpen.set(false);
    $('.js-new-comment-input').blur();
  },
  function() { return commentFormIsOpen.get(); }, {
    noClickEscapeOn: '.js-new-comment'
  }
);
