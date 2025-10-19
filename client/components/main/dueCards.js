import { ReactiveCache } from '/imports/reactiveCache';
import { CardSearchPagedComponent } from '../../lib/cardSearch';
import {
  OPERATOR_HAS,
  OPERATOR_SORT,
  OPERATOR_USER,
  ORDER_ASCENDING,
  PREDICATE_DUE_AT,
} from '../../../config/search-const';
import { QueryParams } from '../../../config/query-classes';

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

class DueCardsComponent extends CardSearchPagedComponent {
  onCreated() {
    super.onCreated();
    
    // Add a small delay to ensure ReactiveCache is ready
    this.searchRetryCount = 0;
    this.maxRetries = 3;
    
    // Use a timeout to ensure the search runs after the component is fully initialized
    Meteor.setTimeout(() => {
      this.performSearch();
    }, 100);
  }
  
  performSearch() {
    if (process.env.DEBUG === 'true') {
      console.log('Performing due cards search, attempt:', this.searchRetryCount + 1);
    }
    
    // Check if user is authenticated
    const currentUser = ReactiveCache.getCurrentUser();
    if (!currentUser) {
      if (process.env.DEBUG === 'true') {
        console.log('User not authenticated, waiting...');
      }
      Meteor.setTimeout(() => {
        this.performSearch();
      }, 1000);
      return;
    }
    
    if (process.env.DEBUG === 'true') {
      console.log('User authenticated:', currentUser.username);
    }
    
    const queryParams = new QueryParams();
    queryParams.addPredicate(OPERATOR_HAS, {
      field: PREDICATE_DUE_AT,
      exists: true,
    });
    // queryParams[OPERATOR_LIMIT] = 5;
    queryParams.addPredicate(OPERATOR_SORT, {
      name: PREDICATE_DUE_AT,
      order: ORDER_ASCENDING,
    });

    // Note: User filtering is handled server-side based on board membership
    // The OPERATOR_USER filter is too restrictive as it only shows cards where
    // the user is assigned or a member of the card, not the board
    // if (Utils && Utils.dueCardsView && Utils.dueCardsView() !== 'all') {
    //   const currentUser = ReactiveCache.getCurrentUser();
    //   if (currentUser && currentUser.username) {
    //     queryParams.addPredicate(OPERATOR_USER, currentUser.username);
    //   }
    // }

    // Debug: Log the query parameters
    if (process.env.DEBUG === 'true') {
      console.log('Due cards query params:', queryParams.params);
      console.log('Due cards query text:', queryParams.text);
      console.log('Due cards has predicates:', queryParams.getPredicates('has'));
      console.log('Due cards sort predicates:', queryParams.getPredicates('sort'));
    }
    
    this.runGlobalSearch(queryParams);
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
    const results = this.getResults();
    console.log('results:', results);
    const cards = [];
    if (results) {
      results.forEach(card => {
        cards.push(card);
      });
    }

    cards.sort((a, b) => {
      const x = a.dueAt === null ? new Date('2100-12-31') : a.dueAt;
      const y = b.dueAt === null ? new Date('2100-12-31') : b.dueAt;

      if (x > y) return 1;
      else if (x < y) return -1;

      return 0;
    });

    // eslint-disable-next-line no-console
    console.log('cards:', cards);
    return cards;
  }
}

DueCardsComponent.register('dueCards');
