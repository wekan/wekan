BlazeComponent.extendComponent({
  template: function() {
    return 'list';
  },

  // Proxies
  openForm: function(options) {
    this.componentChildren('listBody')[0].openForm(options);
  },

  showNewCardForm: function(value) {
    this.componentChildren('listBody')[0].showNewCardForm(value);
  },

  onCreated: function() {
    this.newCardFormIsVisible = new ReactiveVar(true);
  },

  // XXX The jQuery UI sortable plugin is far from ideal here. First we include
  // all jQuery components but only use one. Second, it modifies the DOM itself,
  // resulting in Blaze abandoning reactive update of the nodes that have been
  // moved which result in bugs if multiple users use the board in real time.
  // I tried sortable:sortable but that was not better. Should we “simply” write
  // the drag&drop code ourselves?
  onRendered: function() {
    if (Meteor.user().isBoardMember()) {
      var boardComponent = this.componentParent();
      var $cards = this.$('.js-minicards');
      $cards.sortable({
        connectWith: '.js-minicards',
        tolerance: 'pointer',
        appendTo: '.js-lists',
        helper: 'clone',
        items: '.js-minicard:not(.placeholder, .hide, .js-composer)',
        placeholder: 'minicard placeholder',
        start: function(event, ui) {
          $('.minicard.placeholder').height(ui.item.height());
          Popup.close();
          boardComponent.showNewCardForms(false);
        },
        stop: function(event, ui) {
          // To attribute the new index number, we need to get the dom element
          // of the previous and the following card -- if any.
          var cardDomElement = ui.item.get(0);
          var prevCardDomElement = ui.item.prev('.js-minicard').get(0);
          var nextCardDomElement = ui.item.next('.js-minicard').get(0);
          var sort = Utils.getSortIndex(prevCardDomElement, nextCardDomElement);
          var cardId = Blaze.getData(cardDomElement)._id;
          var listId = Blaze.getData(ui.item.parents('.list').get(0))._id;
          Cards.update(cardId, {
            $set: {
              listId: listId,
              sort: sort
            }
          });
          boardComponent.showNewCardForms(true);
        }
      }).disableSelection();

      Utils.liveEvent('mouseover', function($el) {
        $el.find('.js-member-droppable').droppable({
          hoverClass: 'draggable-hover-card',
          accept: '.js-member',
          drop: function(event, ui) {
            var memberId = Blaze.getData(ui.draggable.get(0)).userId;
            var cardId = Blaze.getData(this)._id;
            Cards.update(cardId, {$addToSet: {members: memberId}});
          }
        });

        $el.find('.js-member-droppable').droppable({
          hoverClass: 'draggable-hover-card',
          accept: '.js-label',
          drop: function(event, ui) {
            var labelId = Blaze.getData(ui.draggable.get(0))._id;
            var cardId = Blaze.getData(this)._id;
            Cards.update(cardId, {$addToSet: {labelIds: labelId}});
          }
        });
      });
    }
  }
}).register('list');
