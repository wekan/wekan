BlazeComponent.extendComponent({
  template() {
    return 'cardDetails';
  },

  mixins() {
    return [Mixins.InfiniteScrolling, Mixins.PerfectScrollbar];
  },

  calculateNextPeak() {
    const altitude = this.find('.js-card-details').scrollHeight;
    this.callFirstWith(this, 'setNextPeak', altitude);
  },

  reachNextPeak() {
    const activitiesComponent = this.componentChildren('activities')[0];
    activitiesComponent.loadNextPage();
  },

  onCreated() {
    this.isLoaded = new ReactiveVar(false);
    this.componentParent().showOverlay.set(true);
    this.componentParent().mouseHasEnterCardDetails = false;
  },

  scrollParentContainer() {
    const cardPanelWidth = 510;
    const bodyBoardComponent = this.componentParent();

    const $cardContainer = bodyBoardComponent.$('.js-lists');
    const $cardView = this.$(this.firstNode());
    const cardContainerScroll = $cardContainer.scrollLeft();
    const cardContainerWidth = $cardContainer.width();

    const cardViewStart = $cardView.offset().left;
    const cardViewEnd = cardViewStart + cardPanelWidth;

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

  onRendered() {
    this.scrollParentContainer();
  },

  onDestroyed() {
    this.componentParent().showOverlay.set(false);
  },

  updateCard(modifier) {
    Cards.update(this.data()._id, {
      $set: modifier,
    });
  },

  events() {
    const events = {
      [`${CSSEvents.animationend} .js-card-details`]() {
        this.isLoaded.set(true);
      },
    };

    return [_.extend(events, {
      'click .js-close-card-details'() {
        Utils.goBoardId(this.data().boardId);
      },
      'click .js-open-card-details-menu': Popup.open('cardDetailsActions'),
      'submit .js-card-description'(evt) {
        evt.preventDefault();
        const description = this.currentComponent().getValue();
        this.updateCard({ description });
      },
      'submit .js-card-details-title'(evt) {
        evt.preventDefault();
        const title = this.currentComponent().getValue();
        if ($.trim(title)) {
          this.updateCard({ title });
        }
      },
      'click .js-member': Popup.open('cardMember'),
      'click .js-add-members': Popup.open('cardMembers'),
      'click .js-add-labels': Popup.open('cardLabels'),
      'mouseenter .js-card-details'() {
        this.componentParent().showOverlay.set(true);
        this.componentParent().mouseHasEnterCardDetails = true;
      },
    })];
  },
}).register('cardDetails');

// We extends the normal InlinedForm component to support UnsavedEdits draft
// feature.
(class extends InlinedForm {
  _getUnsavedEditKey() {
    return {
      fieldName: 'cardDescription',
      // XXX Recovering the currentCard identifier form a session variable is
      // fragile because this variable may change for instance if the route
      // change. We should use some component props instead.
      docId: Session.get('currentCard'),
    };
  }

  close(isReset = false) {
    if (this.isOpen.get() && !isReset) {
      const draft = $.trim(this.getValue());
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
  'click .js-archive'(evt) {
    evt.preventDefault();
    Cards.update(this._id, {
      $set: {
        archived: true,
      },
    });
    Popup.close();
  },
  'click .js-more': Popup.open('cardMore'),
});

Template.moveCardPopup.events({
  'click .js-select-list'() {
    // XXX We should *not* get the currentCard from the global state, but
    // instead from a “component” state.
    const cardId = Session.get('currentCard');
    const newListId = this._id;
    Cards.update(cardId, {
      $set: {
        listId: newListId,
      },
    });
    Popup.close();
  },
});

Template.cardMorePopup.events({
  'click .js-delete': Popup.afterConfirm('cardDelete', () => {
    Popup.close();
    Cards.remove(this._id);
    Utils.goBoardId(this.board()._id);
  }),
});

// Close the card details pane by pressing escape
EscapeActions.register('detailsPane',
  () => { Utils.goBoardId(Session.get('currentBoard')); },
  () => { return !Session.equals('currentCard', null); }, {
    noClickEscapeOn: '.js-card-details,.board-sidebar,#header',
  }
);
