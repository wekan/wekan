BlazeComponent.extendComponent({
  template: function() {
    return 'cardDetails';
  },

  mixins: function() {
    return [Mixins.InfiniteScrolling];
  },

  calculateNextPeak: function() {
    var altitude = this.find('.js-card-details').scrollHeight;
    this.callFirstWith(this, 'setNextPeak', altitude);
  },

  reachNextPeak: function() {
    var activitiesComponent = this.componentChildren('activities')[0];
    activitiesComponent.loadNextPage();
  },

  onRendered: function() {
    var bodyBoardComponent = this.componentParent();
    var additionalMargin = 550;
    var $cardDetails = this.$(this.firstNode());
    var scollLeft = $cardDetails.offset().left + additionalMargin;
    bodyBoardComponent.scrollLeft(scollLeft);
  },

  onDestroyed: function() {
    this.componentParent().showOverlay.set(false);
  },

  updateCard: function(modifier) {
    Cards.update(this.data()._id, {
      $set: modifier
    });
  },

  events: function() {
    return [{
      'click .js-close-card-details': function() {
        Utils.goBoardId(this.data().boardId);
      },
      'click .js-move-card': Popup.open('moveCard'),
      'click .js-open-card-details-menu': Popup.open('cardDetailsActions'),
      'submit .js-card-description': function(evt) {
        evt.preventDefault();
        var description = this.currentComponent().getValue();
        this.updateCard({ description: description });
      },
      'submit .js-card-details-title': function(evt) {
        evt.preventDefault();
        var title = this.currentComponent().getValue();
        if ($.trim(title)) {
          this.updateCard({ title: title });
        }
      },
      'click .js-member': Popup.open('cardMember'),
      'click .js-add-members': Popup.open('cardMembers'),
      'click .js-add-labels': Popup.open('cardLabels'),
      'mouseenter .js-card-details': function() {
        this.componentParent().showOverlay.set(true);
      },
      'mouseleave .js-card-details': function(evt) {
        // We don't want to hide the overlay if the mouse is entering a pop-over
        var $pointedElement = $(evt.toElement || evt.relatedTarget);
        if ($pointedElement.closest('.pop-over').length === 0)
          this.componentParent().showOverlay.set(false);
      }
    }];
  }
}).register('cardDetails');

Template.cardDetailsActionsPopup.events({
  'click .js-members': Popup.open('cardMembers'),
  'click .js-labels': Popup.open('cardLabels'),
  'click .js-attachments': Popup.open('cardAttachments'),
  // 'click .js-copy': Popup.open(),
  'click .js-archive': function(evt) {
    evt.preventDefault();
    Cards.update(this._id, {
      $set: {
        archived: true
      }
    });
    Popup.close();
  }
});

Template.moveCardPopup.events({
  'click .js-select-list': function() {
    // XXX We should *not* get the currentCard from the global state, but
    // instead from a “component” state.
    var cardId = Session.get('currentCard');
    var newListId = this._id;
    Cards.update(cardId, {
      $set: {
        listId: newListId
      }
    });
    Popup.close();
  }
});
