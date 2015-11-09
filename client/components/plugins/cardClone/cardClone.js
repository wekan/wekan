BlazeComponent.extendComponent({
  template() {
    return 'cardClone';
  },

  onCreated() {

  },

  onDestroyed() {

  },

  events() {
    const events = {
      [`${CSSEvents.animationend} .js-card-clone`]() {
        this.isLoaded.set(true);
      },
    };

    return [{
      ...events,
      'click .js-show-lists'() {
        if (Session.get('showLists')) {
          Session.set('showListsSel', undefined);
          Session.set('showLists', false);
        }
        else {
          Session.set('showListsSel', this.currentData()._id);
          Session.set('showLists', true);
        }
      },
      'click .js-clone-card'(evt) {
        evt.preventDefault();
        const toListId = this.currentData()._id;
        const toBoardId = this.currentData().boardId;
        const toSort = Cards.find({'listId': toListId, 'archived': false}).count();
        const toCard = Cards.findOne({'_id': Session.get('currentCard')});
        toCard._id = Meteor.Collection.ObjectID();
        toCard.listId = toListId;
        toCard.boardId = toBoardId;
        toCard.sort = toSort;
        const toCardId = Cards.insert(toCard);
        let text = `:zap: Cloned to [Card](${toCard.rootUrl()}/${toCardId})`;
        CardComments.insert({
          text,
          boardId: Session.get('currentBoard'),
          cardId: Session.get('currentCard'),
        });
        text = `:zap: Cloned from [Card](${toCard.rootUrl()}/${Session.get('currentCard')})`;
        CardComments.insert({
          text,
          boardId: toBoardId,
          cardId: toCardId,
        });
      },
    }];
  },

  showBoards() {
    if (Session.get('showBoards')) {
      return Boards.find({'archived': false}, {sort: {'modifiedAt': -1}, limit : 25});
    }
    else {
      return false;
    }
  },
  showLists() {
    if (Session.get('showLists') && Session.get('showListsSel')) {
      return Lists.find({'boardId': Session.get('showListsSel'), 'archived': false}, {sort: {'updatedAt': 1}, limit : 25});
    }
    else {
      return false;
    }
  },
}).register('cardClone');
