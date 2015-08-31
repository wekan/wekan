BlazeComponent.extendComponent({
  template: function() {
    return 'cardDetails';
  },

  mixins: function() {
    return [Mixins.InfiniteScrolling, Mixins.PerfectScrollbar];
  },

  calculateNextPeak: function() {
    var altitude = this.find('.js-card-details').scrollHeight;
    this.callFirstWith(this, 'setNextPeak', altitude);
  },

  reachNextPeak: function() {
    var activitiesComponent = this.componentChildren('activities')[0];
    activitiesComponent.loadNextPage();
  },

  onCreated: function() {
    this.isLoaded = new ReactiveVar(false);
    this.componentParent().showOverlay.set(true);
    this.componentParent().mouseHasEnterCardDetails = false;
  },

  scrollParentContainer: function() {
    const cardPanelWidth = 510;
    let bodyBoardComponent = this.componentParent();

    let $cardContainer = bodyBoardComponent.$('.js-lists');
    let $cardView = this.$(this.firstNode());
    let cardContainerScroll = $cardContainer.scrollLeft();
    let cardContainerWidth = $cardContainer.width();

    let cardViewStart = $cardView.offset().left;
    let cardViewEnd = cardViewStart + cardPanelWidth;

    let offset = false;
    if (cardViewStart < 0) {
      offset = cardViewStart;
    } else if(cardViewEnd > cardContainerWidth) {
      offset = cardViewEnd - cardContainerWidth;
    }

    if (offset) {
      bodyBoardComponent.scrollLeft(cardContainerScroll + offset);
    }
  },

  onRendered: function() {
    this.scrollParentContainer();
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
    var events = {
      [CSSEvents.animationend + ' .js-card-details']: function() {
        this.isLoaded.set(true);
      }
    };

    return [_.extend(events, {
      'click .js-close-card-details': function() {
        Utils.goBoardId(this.data().boardId);
      },
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
        this.componentParent().mouseHasEnterCardDetails = true;
      }
    })];
  }
}).register('cardDetails');

// We extends the normal InlinedForm component to support UnsavedEdits draft
// feature.
(class extends InlinedForm {
  _getUnsavedEditKey() {
    return {
      fieldName: 'cardDescription',
      docId: Session.get('currentCard'),
    }
  }

  close(isReset = false) {
    if (this.isOpen.get() && ! isReset) {
      let draft = $.trim(this.getValue());
      if (draft !== Cards.findOne(Session.get('currentCard')).description) {
        UnsavedEdits.set(this._getUnsavedEditKey(), this.getValue());
      }
    }
    super();
  }

  reset() {
    UnsavedEdits.reset(this._getUnsavedEditKey());
    this.close(true);
  }

  events() {
    const parentEvents = InlinedForm.prototype.events()[0];
    return [{
      ...parentEvents,
      'click .js-close-inlined-form': this.reset,
    }];
  }
}).register('inlinedCardDescription');

Template.cardDetailsActionsPopup.events({
  'click .js-members': Popup.open('cardMembers'),
  'click .js-labels': Popup.open('cardLabels'),
  'click .js-attachments': Popup.open('cardAttachments'),
  'click .js-move-card': Popup.open('moveCard'),
  // 'click .js-copy': Popup.open(),
  'click .js-archive': function(evt) {
    evt.preventDefault();
    Cards.update(this._id, {
      $set: {
        archived: true
      }
    });
    Popup.close();
  },
  'click .js-more': Popup.open('cardMore')
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

Template.cardMorePopup.events({
  'click .js-delete': Popup.afterConfirm('cardDelete', function() {
    Popup.close();
    Cards.remove(this._id);
    Utils.goBoardId(this.board()._id);
  })
});

// Close the card details pane by pressing escape
EscapeActions.register('detailsPane',
  function() { Utils.goBoardId(Session.get('currentBoard')); },
  function() { return ! Session.equals('currentCard', null); }, {
    noClickEscapeOn: '.js-card-details,.board-sidebar,#header'
  }
);
