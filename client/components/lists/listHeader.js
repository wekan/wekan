BlazeComponent.extendComponent({
  template() {
    return 'listHeader';
  },

  editTitle(evt) {
    evt.preventDefault();
    const newTitle = this.childComponents('inlinedForm')[0].getValue().trim();
    const list = this.currentData();
    if (newTitle) {
      list.rename(newTitle.trim());
    }
  },

  events() {
    return [{
      'click .js-open-list-menu': Popup.open('listAction'),
      submit: this.editTitle,
    }];
  },
}).register('listHeader');

let currentListId = null;

Template.listActionPopup.onRendered(function() {
  currentListId = this.data._id;
});

Template.listActionPopup.events({
  'click .js-add-card'() {
    const listDom = document.getElementById(`js-list-${this._id}`);
    const listComponent = BlazeComponent.getComponentForElement(listDom);
    listComponent.openForm({ position: 'top' });
    Popup.close();
  },
  'click .js-list-subscribe'() {},
  'click .js-select-cards'() {
    const cardIds = this.allCards().map((card) => card._id);
    MultiSelection.add(cardIds);
    Popup.close();
  },
  'click .js-import-card-other-board': Popup.open('importCardFromOtherBoard'),
  'click .js-import-card': Popup.open('listImportCard'),
  'click .js-move-cards': Popup.open('listMoveCards'),
  'click .js-archive-cards': Popup.afterConfirm('listArchiveCards', function() {
    this.allCards().forEach((card) => {
      card.archive();
    });
    Popup.close();
  }),
  'click .js-list-settings': Popup.open('listSettings'),
  'click .js-close-list'(evt) {
    evt.preventDefault();
    this.archive();
    Popup.close();
  },
});

Template.listMoveCardsPopup.events({
  'click .js-select-list'() {
    const fromList = Template.parentData(2).data;
    const toList = this._id;
    fromList.allCards().forEach((card) => {
      card.move(toList);
    });
    Popup.close();
  },
});

BlazeComponent.extendComponent({
  template() {
    return 'importCardFromOtherBoardPopup';
  },

  boards() {
    return Boards.find({
      archived: false,
      'members.userId': Meteor.userId(),
    }, {
      sort: ['title'],
    });
  },

  events() {
    return [{
      'click .js-select-list-from-board'(...args) {
        const fromBoard = this.currentData();
        new SubsManager().subscribe('board', fromBoard._id);
        Popup.open('importCardFromOtherList').call(this, ...args);
      },
    }];
  },
}).register('importCardFromOtherBoardPopup');

BlazeComponent.extendComponent({
  template() {
    return 'importCardFromOtherListPopup';
  },

  lists() {
    const boardId = Template.parentData(2).data._id;
    return Lists.find({boardId}, { sort: ['sort'] });
  },

  events() {
    return [{
      'click .js-import-card-from-list'() {
        const toList = Lists.findOne(currentListId);
        const fromList = this.currentData();
        fromList.allCards().forEach((card) => {
          if(card.archived) return;
          Cards.insert({
            listId: toList._id,
            boardId: toList.board()._id,
            title: card.title,
            sort: card.sort,
            description: card.description,
            dueDate: card.dueDate,
            manHour: card.manHour,
            createdAt: card.createdAt,
          });
        });
        Popup.close();
      },
    }];
  },
}).register('importCardFromOtherListPopup');

BlazeComponent.extendComponent({
  template() {
    return 'listSettingsPopup';
  },

  allStatus() {
    return Lists.simpleSchema()._schema.status.allowedValues;
  },

  list() {
    return Lists.findOne(currentListId);
  },

  noStatus() {
    const curList = this.list();
    return (!curList.status);
  },

  select(to) {
    const lists = this.list();
    this.allStatus().forEach((st) => {
      if(st === to) lists.setStatus(st);
    });
  },

  events() {
    return [{
      'click .js-select-none'() {
        this.select(null);
      },
      'click .js-select-todo'() {
        this.select('todo');
      },
      'click .js-select-doing'() {
        this.select('doing');
      },
      'click .js-select-done'() {
        this.select('done');
      },
      'click .js-confirm-select'() {
        Popup.close();
      },
    }];
  },
}).register('listSettingsPopup');
