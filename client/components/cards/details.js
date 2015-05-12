BlazeComponent.extendComponent({
  template: function() {
    return 'cardSidebar';
  },

  mixins: function() {
    return [Mixins.InfiniteScrolling];
  },

  calculateNextPeak: function() {
    var altitude = this.find('.js-card-sidebar-content').scrollHeight;
    this.callFirstWith(this, 'setNextPeak', altitude);
  },

  reachNextPeak: function() {
    var activitiesComponent = this.componentChildren('activities')[0];
    activitiesComponent.loadNextPage();
  },

  events: function() {
    return [{
      'click .js-move-card': Popup.open('moveCard'),
      'submit .js-card-description': function(evt) {
        evt.preventDefault();
        var cardId = Session.get('currentCard');
        var form = this.componentChildren('inlinedForm')[0];
        var newDescription = form.getValue();
        Cards.update(cardId, {
          $set: {
            description: newDescription
          }
        });
        form.close();
      },
      'click .js-close-card-detail': function() {
        Utils.goBoardId(Session.get('currentBoard'));
      },
      'click .editable .js-card-title': function(event, t) {
        var editable = t.$('.card-detail-title');

        // add class editing and focus
        $('.editing').removeClass('editing');
        editable.addClass('editing');
        editable.find('#title').focus();
      },
      'click .js-edit-desc': function(event, t) {
        var editable = t.$('.card-detail-item');

        // editing remove based and add current editing.
        $('.editing').removeClass('editing');
        editable.addClass('editing');
        editable.find('#desc').focus();

        event.preventDefault();
      },
      'click .js-cancel-edit': function(event, t) {
        // remove editing hide.
        $('.editing').removeClass('editing');
      },
      'submit #WindowTitleEdit': function(event, t) {
        var title = t.find('#title').value;
        if ($.trim(title)) {
          Cards.update(this.card._id, {
            $set: {
              title: title
            }
          }, function (err, res) {
            if (!err) $('.editing').removeClass('editing');
          });
        }

        event.preventDefault();
      },
      'submit #WindowDescEdit': function(event, t) {
        Cards.update(this.card._id, {
          $set: {
            description: t.find('#desc').value
          }
        }, function(err) {
          if (!err) $('.editing').removeClass('editing');
        });
        event.preventDefault();
      },
      'click .member': Popup.open('cardMember'),
      'click .js-details-edit-members': Popup.open('cardMembers'),
      'click .js-details-edit-labels': Popup.open('cardLabels')
    }];
  }
}).register('cardSidebar');

Template.moveCardPopup.events({
  'click .js-select-list': function() {
    // XXX We should *not* get the currentCard from the global state, but
    // instead from a “component” state.
    var cardId = Session.get('currentCard');
    var newListId = this._id;
    Cards.update(cardId, {
      $set: {
        listId: newListId
      }
    });
  }
});
