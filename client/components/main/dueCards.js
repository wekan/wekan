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
    return Utils.dueCardsView();
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
          Utils.setDueCardsView('me');
          Popup.back();
        },

        'click .js-due-cards-view-all'() {
          Utils.setDueCardsView('all');
          Popup.back();
        },
      },
    ];
  },
}).register('dueCardsViewChangePopup');

class DueCardsComponent extends CardSearchPagedComponent {
  onCreated() {
    super.onCreated();

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

    if (Utils.dueCardsView() !== 'all') {
      queryParams.addPredicate(OPERATOR_USER, ReactiveCache.getCurrentUser().username);
    }

    this.runGlobalSearch(queryParams);
  }

  dueCardsView() {
    // eslint-disable-next-line no-console
    //console.log('sort:', Utils.dueCardsView());
    return Utils.dueCardsView();
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
      // Normalize dueAt values to timestamps so comparisons are stable.
      // Accept Date objects, ISO strings, or missing values.
      const future = new Date('2100-12-31').getTime();
      const toTime = v => {
        if (v === null || v === undefined || v === '') return future;
        if (v instanceof Date) return v.getTime();
        // try to parse string/number into Date
        const t = new Date(v);
        if (!isNaN(t.getTime())) return t.getTime();
        return future;
      };

      const x = toTime(a.dueAt);
      const y = toTime(b.dueAt);

      if (x > y) return 1;
      if (x < y) return -1;
      return 0;
    });

    // eslint-disable-next-line no-console
    console.log('cards:', cards);
    return cards;
  }
}

DueCardsComponent.register('dueCards');
