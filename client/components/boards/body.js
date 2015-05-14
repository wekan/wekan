BlazeComponent.extendComponent({
  template: function() {
    return 'boardComponent';
  },

  openNewListForm: function() {
    this.componentChildren('addListForm')[0].open();
  },

  scrollLeft: function() {
    // TODO
  },

  onRendered: function() {
    var self = this;

    self.scrollLeft();

    if (Meteor.user().isBoardMember()) {
      self.$('.js-lists').sortable({
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
    }
  },

  sidebarSize: function() {
    var sidebar = this.componentChildren('boardSidebar')[0];
    if (Session.get('currentCard') !== null)
      return 'next-large-sidebar';
    else if (sidebar && sidebar.isOpen())
      return 'next-small-sidebar';
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
