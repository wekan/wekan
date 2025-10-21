import { ReactiveCache } from '/imports/reactiveCache';
import { BlazeComponent } from 'meteor/peerlibrary:blaze-components';

// const subManager = new SubsManager();

BlazeComponent.extendComponent({
  dueCardsView() {
    // eslint-disable-next-line no-console
    // console.log('sort:', Utils.dueCardsView());
    return Utils && Utils.dueCardsView ? Utils.dueCardsView() : 'me';
  },

  events() {
    return [
      {
        'click .js-due-cards-view-change': Popup.open('dueCardsViewChange'),
      },
    ];
  },
}).register('dueCardsHeaderBar');

Template.dueCards.helpers({
  userId() {
    return Meteor.userId();
  },
  dueCardsList() {
    const component = BlazeComponent.getComponentForElement(this);
    if (component && component.dueCardsList) {
      return component.dueCardsList();
    }
    return [];
  },
  hasResults() {
    const component = BlazeComponent.getComponentForElement(this);
    if (component && component.dueCardsList) {
      const cards = component.dueCardsList();
      return cards && cards.length > 0;
    }
    return false;
  },
  searching() {
    return false; // No longer using search, so always false
  },
  hasQueryErrors() {
    return false; // No longer using search, so always false
  },
  errorMessages() {
    return []; // No longer using search, so always empty
  },
});

BlazeComponent.extendComponent({
  events() {
    return [
      {
        'click .js-due-cards-view-me'() {
          if (Utils && Utils.setDueCardsView) {
            Utils.setDueCardsView('me');
          }
          Popup.back();
        },

        'click .js-due-cards-view-all'() {
          if (Utils && Utils.setDueCardsView) {
            Utils.setDueCardsView('all');
          }
          Popup.back();
        },
      },
    ];
  },
}).register('dueCardsViewChangePopup');

class DueCardsComponent extends BlazeComponent {
  onCreated() {
    super.onCreated();
    
    this._cachedCards = null;
    this._cachedTimestamp = null;
    this.subscriptionHandle = null;
    
    // Subscribe to the optimized due cards publication
    this.autorun(() => {
      const allUsers = this.dueCardsView() === 'all';
      if (this.subscriptionHandle) {
        this.subscriptionHandle.stop();
      }
      this.subscriptionHandle = Meteor.subscribe('dueCards', allUsers);
    });
  }

  onDestroyed() {
    super.onDestroyed();
    if (this.subscriptionHandle) {
      this.subscriptionHandle.stop();
    }
  }

  dueCardsView() {
    // eslint-disable-next-line no-console
    //console.log('sort:', Utils.dueCardsView());
    return Utils && Utils.dueCardsView ? Utils.dueCardsView() : 'me';
  }

  sortByBoard() {
    return this.dueCardsView() === 'board';
  }

  dueCardsList() {
    // Use cached results if available to avoid expensive re-sorting
    if (this._cachedCards && this._cachedTimestamp && (Date.now() - this._cachedTimestamp < 5000)) {
      return this._cachedCards;
    }

    // Get cards directly from the subscription (already sorted by the publication)
    const cards = ReactiveCache.getCards({
      type: 'cardType-card',
      archived: false,
      dueAt: { $exists: true, $nin: [null, ''] }
    });

    // Filter cards based on user view preference
    const allUsers = this.dueCardsView() === 'all';
    const currentUser = ReactiveCache.getCurrentUser();
    let filteredCards = cards;

    if (!allUsers && currentUser) {
      filteredCards = cards.filter(card => {
        return card.members && card.members.includes(currentUser._id) ||
               card.assignees && card.assignees.includes(currentUser._id) ||
               card.userId === currentUser._id;
      });
    }

    // Cache the results for 5 seconds to avoid re-filtering on every render
    this._cachedCards = filteredCards;
    this._cachedTimestamp = Date.now();

    return filteredCards;
  }
}

DueCardsComponent.register('dueCards');
