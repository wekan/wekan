import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { Utils } from '/client/lib/utils';
import { filterAndSortDueCards } from '/client/components/main/dueCardsLogic';

// const subManager = new SubsManager();

Template.dueCardsHeaderBar.helpers({
  dueCardsView() {
    // eslint-disable-next-line no-console
    // console.log('sort:', Utils.dueCardsView());
    return Utils && Utils.dueCardsView ? Utils.dueCardsView() : 'me';
  },
});

Template.dueCardsHeaderBar.events({
  'click .js-due-cards-view-change': Popup.open('dueCardsViewChange'),
});

Template.dueCards.onCreated(function () {
  this._cachedCards = null;
  this._cachedTimestamp = null;
  this.subscriptionHandle = null;
  this.isLoading = new ReactiveVar(true);
  this.hasResults = new ReactiveVar(false);
  this.searching = new ReactiveVar(false);

  const tpl = this;

  function dueCardsView() {
    return Utils && Utils.dueCardsView ? Utils.dueCardsView() : 'me';
  }

  function dueCardsList() {
    // Check if subscription is ready
    if (!tpl.subscriptionHandle || !tpl.subscriptionHandle.ready()) {
      if (process.env.DEBUG === 'true') {
        console.log('dueCards client: subscription not ready');
      }
      return [];
    }

    // Use cached results if available to avoid expensive re-sorting
    if (tpl._cachedCards && tpl._cachedTimestamp && (Date.now() - tpl._cachedTimestamp < 5000)) {
      if (process.env.DEBUG === 'true') {
        console.log('dueCards client: using cached results,', tpl._cachedCards.length, 'cards');
      }
      return tpl._cachedCards;
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
    const allUsers = dueCardsView() === 'all';
    const currentUser = ReactiveCache.getCurrentUser();

    if (process.env.DEBUG === 'true') {
      console.log('dueCards client: current user:', currentUser ? currentUser._id : 'none');
      console.log('dueCards client: showing all users:', allUsers);
    }

    // Filter (by user unless "all") and sort ascending by due date. No cap is
    // applied so every due card is shown (issues #5999 / #5930).
    const filteredCards = filterAndSortDueCards(cards, {
      allUsers,
      userId: currentUser ? currentUser._id : null,
    });

    if (process.env.DEBUG === 'true') {
      console.log('dueCards client: filtered to', filteredCards.length, 'cards');
    }

    // Cache the results for 5 seconds to avoid re-filtering on every render
    tpl._cachedCards = filteredCards;
    tpl._cachedTimestamp = Date.now();

    // Update reactive variables
    tpl.hasResults.set(filteredCards && filteredCards.length > 0);
    tpl.isLoading.set(false);

    return filteredCards;
  }

  // Store dueCardsList on the instance so helpers can call it
  this.dueCardsList = dueCardsList;
  this.dueCardsView = dueCardsView;

  // Subscribe to the optimized due cards publication
  this.autorun(() => {
    const allUsers = dueCardsView() === 'all';
    if (tpl.subscriptionHandle) {
      tpl.subscriptionHandle.stop();
    }
    tpl.subscriptionHandle = Meteor.subscribe('dueCards', allUsers);

    // Update loading state based on subscription
    tpl.autorun(() => {
      if (tpl.subscriptionHandle && tpl.subscriptionHandle.ready()) {
        if (process.env.DEBUG === 'true') {
          console.log('dueCards: subscription ready, loading data...');
        }
        tpl.isLoading.set(false);
        const cards = dueCardsList();
        tpl.hasResults.set(cards && cards.length > 0);
      } else {
        if (process.env.DEBUG === 'true') {
          console.log('dueCards: subscription not ready, showing loading...');
        }
        tpl.isLoading.set(true);
        tpl.hasResults.set(false);
      }
    });
  });
});

Template.dueCards.onDestroyed(function () {
  if (this.subscriptionHandle) {
    this.subscriptionHandle.stop();
  }
});

Template.dueCards.helpers({
  userId() {
    return Meteor.userId();
  },
  // Return ReactiveVar so jade can use .get pattern
  searching() {
    return Template.instance().isLoading;
  },
  hasResults() {
    return Template.instance().hasResults;
  },
  hasQueryErrors() {
    return new ReactiveVar(false);
  },
  errorMessages() {
    return [];
  },
  dueCardsList() {
    const tpl = Template.instance();
    return tpl.dueCardsList ? tpl.dueCardsList() : [];
  },
  resultsText() {
    const tpl = Template.instance();
    const cards = tpl.dueCardsList ? tpl.dueCardsList() : [];
    const count = cards ? cards.length : 0;
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
  },
});

Template.dueCardsViewChangePopup.events({
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
});
