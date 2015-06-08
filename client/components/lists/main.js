BlazeComponent.extendComponent({
  template: function() {
    return 'list';
  },

  // Proxies
  openForm: function(options) {
    this.componentChildren('listBody')[0].openForm(options);
  },

  onCreated: function() {
    this.newCardFormIsVisible = new ReactiveVar(true);
  },

  // XXX The jQuery UI sortable plugin is far from ideal here. First we include
  // all jQuery components but only use one. Second, it modifies the DOM itself,
  // resulting in Blaze abandoning reactive update of the nodes that have been
  // moved which result in bugs if multiple users use the board in real time. I
  // tried sortable:sortable but that was not better. And dragula is not
  // powerful enough for our use casesShould we “simply” write the drag&drop
  // code ourselves?
  onRendered: function() {
    var self = this;
    if (! Meteor.userId() || ! Meteor.user().isBoardMember())
      return;

    var boardComponent = self.componentParent();
    var itemsSelector = '.js-minicard:not(.placeholder, .js-composer)';
    var $cards = self.$('.js-minicards');
    $cards.sortable({
      connectWith: '.js-minicards',
      tolerance: 'pointer',
      appendTo: '.js-lists',
      helper: function(evt, item) {
        var helper = item.clone();
        if (MultiSelection.isActive()) {
          var andNOthers = $cards.find('.js-minicard.is-checked').length - 1;
          if (andNOthers > 0) {
            helper.append($(Blaze.toHTML(HTML.DIV(
              // XXX Super bad class name
              {'class': 'and-n-other'},
              // XXX Need to translate
              'and ' + andNOthers + ' other cards.'
            ))));
          }
        }
        return helper;
      },
      items: itemsSelector,
      placeholder: 'minicard-wrapper placeholder',
      start: function(evt, ui) {
        ui.placeholder.height(ui.helper.height());
        EscapeActions.executeUpTo('popup');
        boardComponent.setIsDragging(true);
      },
      stop: function(evt, ui) {
        // To attribute the new index number, we need to get the dom element
        // of the previous and the following card -- if any.
        var cardDomElement = ui.item.get(0);
        var prevCardDomElement = ui.item.prev('.js-minicard').get(0);
        var nextCardDomElement = ui.item.next('.js-minicard').get(0);
        var sort = Utils.getSortIndex(prevCardDomElement, nextCardDomElement);
        var listId = Blaze.getData(ui.item.parents('.list').get(0))._id;

        if (MultiSelection.isActive()) {
          Cards.find(MultiSelection.getMongoSelector()).forEach(function(c) {
            Cards.update(c._id, {
              $set: {
                listId: listId,
                sort: sort
              }
            });
          });
        } else {
          var cardId = Blaze.getData(cardDomElement)._id;
          Cards.update(cardId, {
            $set: {
              listId: listId,
              // XXX Using the same sort index for multiple cards is
              // unacceptable. Keep that only until we figure out if we want to
              // refactor the whole sorting mecanism or do something more basic.
              sort: sort
            }
          });
        }
        boardComponent.setIsDragging(false);
      }
    });

    // We want to re-run this function any time a card is added.
    self.autorun(function() {
      var currentBoardId = Tracker.nonreactive(function() {
        return Session.get('currentBoard');
      });
      Cards.find({ boardId: currentBoardId }).fetch();
      Tracker.afterFlush(function() {
        $cards.find(itemsSelector).droppable({
          hoverClass: 'draggable-hover-card',
          accept: '.js-member,.js-label',
          drop: function(event, ui) {
            var cardId = Blaze.getData(this)._id;
            var addToSet;

            if (ui.draggable.hasClass('js-member')) {
              var memberId = Blaze.getData(ui.draggable.get(0)).userId;
              addToSet = { members: memberId };
            } else {
              var labelId = Blaze.getData(ui.draggable.get(0))._id;
              addToSet = { labelIds: labelId };
            }
            Cards.update(cardId, { $addToSet: addToSet });
          }
        });
      });
    });
  }
}).register('list');
