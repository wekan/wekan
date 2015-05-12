// Template.cards.events({
//   // 'click .js-cancel': function(event, t) {
//   //   var composer = t.$('.card-composer');

//   //   // Keep the old value in memory to display it again next time
//   //   var inputCacheKey = "addCard-" + this.listId;
//   //   var oldValue = composer.find('.js-card-title').val();
//   //   InputsCache.set(inputCacheKey, oldValue);

//   //   // add composer hide class
//   //   composer.addClass('hide');
//   //   composer.find('.js-card-title').val('');

//   //   // remove hide open link class
//   //   $('.js-open-card-composer').removeClass('hide');
//   // },
//   'submit': function(evt, tpl) {
//     evt.preventDefault();
//     var textarea = $(evt.currentTarget).find('textarea');
//     var title = textarea.val();
//     var lastCard = tpl.find('.js-minicard:last-child');
//     var sort;
//     if (lastCard === null) {
//       sort = 0;
//     } else {
//       sort = Blaze.getData(lastCard).sort + 1;
//     }
//     // debugger

//     // Clear the form in-memory cache
//     // var inputCacheKey = "addCard-" + this.listId;
//     // InputsCache.set(inputCacheKey, '');

//     // title trim if not empty then
//     if ($.trim(title)) {
//       Cards.insert({
//         title: title,
//         listId: Template.currentData().listId,
//         boardId: Template.currentData().board._id,
//         sort: sort
//       }, function(err, _id) {
//         // In case the filter is active we need to add the newly
//         // inserted card in the list of exceptions -- cards that are
//         // not filtered. Otherwise the card will disappear instantly.
//         // See https://github.com/libreboard/libreboard/issues/80
//         Filter.addException(_id);
//       });

//       // empty and focus.
//       textarea.val('').focus();

//       // focus complete then scroll top
//       Utils.Scroll(tpl.find('.js-minicards')).top(1000, true);
//     }
//   }
// });

// Template.cards.events({
//   'click .member': Popup.open('cardMember')
// });

Template.cardMemberPopup.events({
  'click .js-remove-member': function() {
    Cards.update(this.cardId, {$pull: {members: this.userId}});
    Popup.close();
  }
});

Template.WindowActivityModule.events({
  'click .js-new-comment:not(.focus)': function(evt) {
    var $this = $(evt.currentTarget);
    $this.addClass('focus');
  },
  'submit #CommentForm': function(evt, t) {
    var text = t.$('.js-new-comment-input');
    if ($.trim(text.val())) {
      CardComments.insert({
        boardId: this.card.boardId,
        cardId: this.card._id,
        text: text.val()
      });
      text.val('');
      $('.focus').removeClass('focus');
    }
    evt.preventDefault();
  }
});

Template.WindowSidebarModule.events({
  'click .js-change-card-members': Popup.open('cardMembers'),
  'click .js-edit-labels': Popup.open('cardLabels'),
  'click .js-archive-card': function(evt) {
    // Update
    Cards.update(this.card._id, {
      $set: {
        archived: true
      }
    });
    evt.preventDefault();
  },
  'click .js-unarchive-card': function(evt) {
    Cards.update(this.card._id, {
      $set: {
        archived: false
      }
    });
    evt.preventDefault();
  },
  'click .js-delete-card': Popup.afterConfirm('cardDelete', function() {
    Cards.remove(this.card._id);

    // redirect board
    Utils.goBoardId(this.card.board()._id);
    Popup.close();
  }),
  'click .js-more-menu': Popup.open('cardMore'),
  'click .js-attach': Popup.open('cardAttachments')
});

Template.WindowAttachmentsModule.events({
  'click .js-attach': Popup.open('cardAttachments'),
  'click .js-confirm-delete': Popup.afterConfirm('attachmentDelete',
    function() {
      Attachments.remove(this._id);
      Popup.close();
    }
  ),
  // If we let this event bubble, Iron-Router will handle it and empty the
  // page content, see #101.
  'click .js-open-viewer, click .js-download': function(event) {
    event.stopPropagation();
  },
  'click .js-add-cover': function() {
    Cards.update(this.cardId, { $set: { coverId: this._id } });
  },
  'click .js-remove-cover': function() {
    Cards.update(this.cardId, { $unset: { coverId: '' } });
  }
});

Template.cardMembersPopup.events({
  'click .js-select-member': function(evt) {
    var cardId = Template.parentData(2).data._id;
    var memberId = this.userId;
    var operation;
    if (Cards.find({ _id: cardId, members: memberId}).count() === 0)
      operation = '$addToSet';
    else
      operation = '$pull';

    var query = {};
    query[operation] = {
      members: memberId
    };
    Cards.update(cardId, query);
    evt.preventDefault();
  }
});

Template.cardLabelsPopup.events({
  'click .js-select-label': function(evt) {
    var cardId = Template.parentData(2).data._id;
    var labelId = this._id;
    var operation;
    if (Cards.find({ _id: cardId, labelIds: labelId}).count() === 0)
      operation = '$addToSet';
    else
      operation = '$pull';

    var query = {};
    query[operation] = {
      labelIds: labelId
    };
    Cards.update(cardId, query);
    evt.preventDefault();
  },
  'click .js-edit-label': Popup.open('editLabel'),
  'click .js-add-label': Popup.open('createLabel')
});

Template.formLabel.events({
  'click .js-palette-color': function(evt) {
    var $this = $(evt.currentTarget);

    // hide selected ll colors
    $('.js-palette-select').addClass('hide');

    // show select color
    $this.find('.js-palette-select').removeClass('hide');
  }
});

Template.createLabelPopup.events({
  // Create the new label
  'submit .create-label': function(evt, tpl) {
    var name = tpl.$('#labelName').val().trim();
    var boardId = Session.get('currentBoard');
    var selectLabelDom = tpl.$('.js-palette-select:not(.hide)').get(0);
    var selectLabel = Blaze.getData(selectLabelDom);
    Boards.update(boardId, {
      $push: {
        labels: {
          _id: Random.id(6),
          name: name,
          color: selectLabel.color
        }
      }
    });
    Popup.back();
    evt.preventDefault();
  }
});

Template.editLabelPopup.events({
  'click .js-delete-label': Popup.afterConfirm('deleteLabel', function() {
    var boardId = Session.get('currentBoard');
    Boards.update(boardId, {
      $pull: {
        labels: {
          _id: this._id
        }
      }
    });
    Popup.back(2);
  }),
  'submit .edit-label': function(evt, tpl) {
    var name = tpl.$('#labelName').val().trim();
    var boardId = Session.get('currentBoard');
    var getLabel = Utils.getLabelIndex(boardId, this._id);
    var selectLabelDom = tpl.$('.js-palette-select:not(.hide)').get(0);
    var selectLabel = Blaze.getData(selectLabelDom);
    var $set = {};

    // set label index
    $set[getLabel.key('name')] = name;

    // set color
    $set[getLabel.key('color')] = selectLabel.color;

    // update
    Boards.update(boardId, { $set: $set });

    // return to the previous popup view trigger
    Popup.back();

    evt.preventDefault();
  },
  'click .js-select-label': function() {
    Cards.remove(this.cardId);

    // redirect board
    Utils.goBoardId(this.boardId);
  }
});

Template.cardMorePopup.events({
  'click .js-delete': Popup.afterConfirm('cardDelete', function() {
    Cards.remove(this.card._id);

    // redirect board
    Utils.goBoardId(this.card.board()._id);
  })
});

Template.cardAttachmentsPopup.events({
  'change .js-attach-file': function(evt) {
    var card = this.card;
    FS.Utility.eachFile(evt, function(f) {
      var file = new FS.File(f);

      // set Ids
      file.boardId = card.boardId;
      file.cardId  = card._id;

      // upload file
      Attachments.insert(file);

      Popup.close();
    });
  },
  'click .js-computer-upload': function(evt, t) {
    t.find('.js-attach-file').click();
    evt.preventDefault();
  }
});
