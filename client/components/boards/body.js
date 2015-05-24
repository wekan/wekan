// XXX This event list must be abstracted somewhere else.
var endTransitionEvents = [
  'webkitTransitionEnd',
  'otransitionend',
  'oTransitionEnd',
  'msTransitionEnd',
  'transitionend'
].join(' ');

BlazeComponent.extendComponent({
  template: function() {
    return 'boardComponent';
  },

  openNewListForm: function() {
    this.componentChildren('addListForm')[0].open();
  },

  showNewCardForms: function(value) {
    _.each(this.componentChildren('list'), function(listComponent) {
      listComponent.showNewCardForm(value);
    });
  },

  scrollLeft: function() {
    // TODO
  },

  currentCardIsInThisList: function() {
    var currentCard = Cards.findOne(Session.get('currentCard'));
    var listId = this.currentData()._id;
    return currentCard && currentCard.listId === listId;
  },

  onRendered: function() {
    var self = this;

    self.scrollLeft();

    var lists = this.find('.js-lists');

    // We want to animate the card details window closing. We rely on CSS
    // transition for the actual animation.
    lists._uihooks = {
      removeElement: function(node) {
        var removeNode = function() {
          node.parentNode.removeChild(node);
        };
        if ($(node).hasClass('js-card-detail')) {
          $(node).css({
            flex: '0',
            padding: 0
          });
          $(lists).one(endTransitionEvents, function() {
            removeNode();
          });
        } else {
          removeNode();
        }
      }
    };

    if (! Meteor.user().isBoardMember())
      return;

    self.$(lists).sortable({
      tolerance: 'pointer',
      appendTo: '.js-lists',
      helper: 'clone',
      items: '.js-list:not(.add-list)',
      placeholder: 'list placeholder',
      start: function(event, ui) {
        $('.list.placeholder').height(ui.item.height());
        Popup.close();
      },
      stop: function() {
        self.$('.js-lists').find('.js-list:not(.add-list)').each(
          function(i, list) {
            var data = Blaze.getData(list);
            Lists.update(data._id, {
              $set: {
                sort: i
              }
            });
          }
        );
      }
    });

    // If there is no data in the board (ie, no lists) we autofocus the list
    // creation form by clicking on the corresponding element.
    if (self.data().lists().count() === 0) {
      this.openNewListForm();
    }
  },

  sidebarSize: function() {
    var sidebar = this.componentChildren('boardSidebar')[0];
    if (sidebar && sidebar.isOpen())
      return 'next-sidebar';
  }
}).register('boardComponent');

BlazeComponent.extendComponent({
  template: function() {
    return 'addListForm';
  },

  // Proxy
  open: function() {
    this.componentChildren('inlinedForm')[0].open();
  },

  events: function() {
    return [{
      submit: function(evt) {
        evt.preventDefault();
        var title = this.find('.list-name-input');
        if ($.trim(title.value)) {
          Lists.insert({
            title: title.value,
            boardId: Session.get('currentBoard'),
            sort: $('.list').length
          });

          title.value = '';
        }
      }
    }];
  }
}).register('addListForm');
