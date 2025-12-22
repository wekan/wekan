import { ReactiveCache } from '/imports/reactiveCache';
import { BlazeComponent } from 'meteor/peerlibrary:blaze-components';
import { TAPi18n } from '/imports/i18n';

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
    const component = BlazeComponent.getComponentForElement(this.firstNode);
    if (component && component.dueCardsList) {
      return component.dueCardsList();
    }
    return [];
  },
  hasResults() {
    const component = BlazeComponent.getComponentForElement(this.firstNode);
    if (component && component.hasResults) {
      return component.hasResults.get();
    }
    return false;
  },
  searching() {
    const component = BlazeComponent.getComponentForElement(this.firstNode);
    if (component && component.isLoading) {
      return component.isLoading.get();
    }
    return true; // Show loading by default
  },
  hasQueryErrors() {
    return false; // No longer using search, so always false
  },
  errorMessages() {
    return []; // No longer using search, so always empty
  },
  cardsCount() {
    const component = BlazeComponent.getComponentForElement(this.firstNode);
    if (component && component.cardsCount) {
      return component.cardsCount();
    }
    return 0;
  },
  resultsText() {
    const component = BlazeComponent.getComponentForElement(this.firstNode);
    if (component && component.resultsText) {
      return component.resultsText();
    }
    return '';
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
    this.isLoading = new ReactiveVar(true);
    this.hasResults = new ReactiveVar(false);
    this.searching = new ReactiveVar(false);
    
    // Subscribe to the optimized due cards publication
    this.autorun(() => {
      const allUsers = this.dueCardsView() === 'all';
      if (this.subscriptionHandle) {
        this.subscriptionHandle.stop();
      }
      this.subscriptionHandle = Meteor.subscribe('dueCards', allUsers);
      
      // Update loading state based on subscription
      this.autorun(() => {
        if (this.subscriptionHandle && this.subscriptionHandle.ready()) {
          if (process.env.DEBUG === 'true') {
            console.log('dueCards: subscription ready, loading data...');
          }
          this.isLoading.set(false);
          const cards = this.dueCardsList();
          this.hasResults.set(cards && cards.length > 0);
        } else {
          if (process.env.DEBUG === 'true') {
            console.log('dueCards: subscription not ready, showing loading...');
          }
          this.isLoading.set(true);
          this.hasResults.set(false);
        }
      });
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

  hasResults() {
    return this.hasResults.get();
  }

  cardsCount() {
    const cards = this.dueCardsList();
    return cards ? cards.length : 0;
  }

  resultsText() {
    const count = this.cardsCount();
    if (count === 1) {
      return TAPi18n.__('one-card-found');
    } else {
      // Get the translated text and manually replace %s with the count
      const baseText = TAPi18n.__('n-cards-found');
      const result = baseText.replace('%s', count);
      
      if (process.env.DEBUG === 'true') {
        console.log('dueCards: base text:', baseText, 'count:', count, 'result:', result);
      }
      return result;
    }
  }

  dueCardsList() {
    // Check if subscription is ready
    if (!this.subscriptionHandle || !this.subscriptionHandle.ready()) {
      if (process.env.DEBUG === 'true') {
        console.log('dueCards client: subscription not ready');
      }
      return [];
    }

    // Use cached results if available to avoid expensive re-sorting
    if (this._cachedCards && this._cachedTimestamp && (Date.now() - this._cachedTimestamp < 5000)) {
      if (process.env.DEBUG === 'true') {
        console.log('dueCards client: using cached results,', this._cachedCards.length, 'cards');
      }
      return this._cachedCards;
    }

    // Get cards directly from the subscription (already sorted by the publication)
    const cards = ReactiveCache.getCards({
      type: 'cardType-card',
      archived: false,
      dueAt: { $exists: true, $nin: [null, ''] }
    });

    if (process.env.DEBUG === 'true') {
      console.log('dueCards client: found', cards.length, 'cards with due dates');
      console.log('dueCards client: cards details:', cards.map(c => ({ 
        id: c._id, 
        title: c.title, 
        dueAt: c.dueAt, 
        boardId: c.boardId,
        members: c.members,
        assignees: c.assignees,
        userId: c.userId
      })));
    }

    // Filter cards based on user view preference
    const allUsers = this.dueCardsView() === 'all';
    const currentUser = ReactiveCache.getCurrentUser();
    let filteredCards = cards;

    if (process.env.DEBUG === 'true') {
      console.log('dueCards client: current user:', currentUser ? currentUser._id : 'none');
      console.log('dueCards client: showing all users:', allUsers);
    }

    if (!allUsers && currentUser) {
      filteredCards = cards.filter(card => {
        const isMember = card.members && card.members.includes(currentUser._id);
        const isAssignee = card.assignees && card.assignees.includes(currentUser._id);
        const isAuthor = card.userId === currentUser._id;
        const matches = isMember || isAssignee || isAuthor;
        
        if (process.env.DEBUG === 'true' && matches) {
          console.log('dueCards client: card matches user:', card.title, { isMember, isAssignee, isAuthor });
        }
        
        return matches;
      });
    }

    // Normalize dueAt to timestamps for stable client-side ordering
    const future = new Date('2100-12-31').getTime();
    const toTime = v => {
      if (v === null || v === undefined || v === '') return future;
      if (v instanceof Date) return v.getTime();
      const t = new Date(v);
      if (!isNaN(t.getTime())) return t.getTime();
      return future;
    };

    filteredCards.sort((a, b) => {
      const x = toTime(a.dueAt);
      const y = toTime(b.dueAt);
      if (x > y) return 1;
      if (x < y) return -1;
      return 0;
    });

    if (process.env.DEBUG === 'true') {
      console.log('dueCards client: filtered to', filteredCards.length, 'cards');
    }

    // Cache the results for 5 seconds to avoid re-filtering on every render
    this._cachedCards = filteredCards;
    this._cachedTimestamp = Date.now();

    // Update reactive variables
    this.hasResults.set(filteredCards && filteredCards.length > 0);
    this.isLoading.set(false);

    return filteredCards;
  }
}

DueCardsComponent.register('dueCards');
