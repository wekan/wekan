import { CardSearchPagedComponent } from '../../lib/cardSearch';

const subManager = new SubsManager();

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

    const queryParams = {
      has: [{ field: 'dueAt', exists: true }],
      limit: 5,
      skip: 0,
      sort: { name: 'dueAt', order: 'des' },
    };

    if (Utils.dueCardsView() !== 'all') {
      queryParams.users = [Meteor.user().username];
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
      const x = a.dueAt === null ? Date('2100-12-31') : a.dueAt;
      const y = b.dueAt === null ? Date('2100-12-31') : b.dueAt;

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
