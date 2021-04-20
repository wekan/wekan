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
          Popup.close();
        },

        'click .js-due-cards-view-all'() {
          Utils.setDueCardsView('all');
          Popup.close();
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
      queryParams.addPredicate(OPERATOR_USER, Meteor.user().username);
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
