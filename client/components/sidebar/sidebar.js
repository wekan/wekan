Sidebar = null;

var defaultView = 'home';

var viewTitles = {
  filter: 'filter-cards',
  multiselection: 'multi-selection',
  archives: 'archives'
};

BlazeComponent.extendComponent({
  template: function() {
    return 'sidebar';
  },

  mixins: function() {
    return [Mixins.InfiniteScrolling, Mixins.PerfectScrollbar];
  },

  onCreated: function() {
    this._isOpen = new ReactiveVar(! Session.get('currentCard'));
    this._view = new ReactiveVar(defaultView);
    Sidebar = this;
  },

  onDestroyed: function() {
    Sidebar = null;
  },

  isOpen: function() {
    return this._isOpen.get();
  },

  open: function() {
    if (! this._isOpen.get()) {
      this._isOpen.set(true);
      EscapeActions.executeUpTo('detailsPane');
    }
  },

  hide: function() {
    if (this._isOpen.get()) {
      this._isOpen.set(false);
    }
  },

  toogle: function() {
    this._isOpen.set(! this._isOpen.get());
  },

  calculateNextPeak: function() {
    var altitude = this.find('.js-board-sidebar-content').scrollHeight;
    this.callFirstWith(this, 'setNextPeak', altitude);
  },

  reachNextPeak: function() {
    var activitiesComponent = this.componentChildren('activities')[0];
    activitiesComponent.loadNextPage();
  },

  isTongueHidden: function() {
    return this.isOpen() && this.getView() !== defaultView;
  },

  getView: function() {
    return this._view.get();
  },

  setView: function(view) {
    view = _.isString(view) ? view : defaultView;
    if (this._view.get() !== view) {
      this._view.set(view);
      EscapeActions.executeUpTo('detailsPane');
    }
    this.open();
  },

  isDefaultView: function() {
    return this.getView() === defaultView;
  },

  getViewTemplate: function() {
    return this.getView() + 'Sidebar';
  },

  getViewTitle: function() {
    return TAPi18n.__(viewTitles[this.getView()]);
  },

  // Board members can assign people or labels by drag-dropping elements from
  // the sidebar to the cards on the board. In order to re-initialize the
  // jquery-ui plugin any time a draggable member or label is modified or
  // removed we use a autorun function and register a dependency on the both
  // members and labels fields of the current board document.
  onRendered: function() {
    var self = this;
    if (! Meteor.userId() || ! Meteor.user().isBoardMember())
      return;

    self.autorun(function() {
      var currentBoardId = Tracker.nonreactive(function() {
        return Session.get('currentBoard');
      });
      Boards.findOne(currentBoardId, {
        fields: {
          members: 1,
          labels: 1
        }
      });
      Tracker.afterFlush(function() {
        self.$('.js-member,.js-label').draggable({
          appendTo: 'body',
          helper: 'clone',
          revert: 'invalid',
          revertDuration: 150,
          snap: false,
          snapMode: 'both',
          start: function() {
            EscapeActions.executeUpTo('popup');
          }
        });
      });
    });
  },

  events: function() {
    // XXX Hacky, we need some kind of `super`
    var mixinEvents = this.getMixin(Mixins.InfiniteScrolling).events();
    return mixinEvents.concat([{
      'click .js-toogle-sidebar': this.toogle,
      'click .js-back-home': this.setView
    }]);
  }
}).register('sidebar');

EscapeActions.register('sidebarView',
  function() { Sidebar.setView(defaultView); },
  function() { return Sidebar && Sidebar.getView() !== defaultView; }
);

var getMemberIndex = function(board, searchId) {
  for (var i = 0; i < board.members.length; i++) {
    if (board.members[i].userId === searchId)
      return i;
  }
  throw new Meteor.Error('Member not found');
};

Template.memberPopup.helpers({
  user: function() {
    return Users.findOne(this.userId);
  },
  memberType: function() {
    var type = Users.findOne(this.userId).isBoardAdmin() ? 'admin' : 'normal';
    return TAPi18n.__(type).toLowerCase();
  }
});

Template.memberPopup.events({
  'click .js-filter-member': function() {
    Filter.members.toogle(this.userId);
    Popup.close();
  },
  'click .js-change-role': Popup.open('changePermissions'),
  'click .js-remove-member': Popup.afterConfirm('removeMember', function() {
    var currentBoard = Boards.findOne(Session.get('currentBoard'));
    var memberIndex = getMemberIndex(currentBoard, this.userId);
    var setQuery = {};
    setQuery[['members', memberIndex, 'isActive'].join('.')] = false;
    Boards.update(currentBoard._id, { $set: setQuery });
    Popup.close();
  }),
  'click .js-leave-member': function() {
    // XXX Not implemented
    Popup.close();
  }
});

Template.membersWidget.events({
  'click .js-member': Popup.open('member'),
  'click .js-manage-board-members': Popup.open('addMember')
});

Template.labelsWidget.events({
  'click .js-label': Popup.open('editLabel'),
  'click .js-add-label': Popup.open('createLabel')
});

Template.addMemberPopup.helpers({
  isBoardMember: function() {
    var user = Users.findOne(this._id);
    return user && user.isBoardMember();
  }
});

Template.addMemberPopup.events({
  'click .pop-over-member-list li:not(.disabled)': function() {
    var userId = this._id;
    var currentBoard = Boards.findOne(Session.get('currentBoard'));
    var currentMembersIds = _.pluck(currentBoard.members, 'userId');
    if (currentMembersIds.indexOf(userId) === -1) {
      Boards.update(currentBoard._id, {
        $push: {
          members: {
            userId: userId,
            isAdmin: false,
            isActive: true
          }
        }
      });
    } else {
      var memberIndex = getMemberIndex(currentBoard, userId);
      var setQuery = {};
      setQuery[['members', memberIndex, 'isActive'].join('.')] = true;
      Boards.update(currentBoard._id, { $set: setQuery });
    }
    Popup.close();
  }
});

Template.addMemberPopup.onRendered(function() {
  this.find('.js-search-member input').focus();
});

Template.changePermissionsPopup.events({
  'click .js-set-admin, click .js-set-normal': function(event) {
    var currentBoard = Boards.findOne(Session.get('currentBoard'));
    var memberIndex = getMemberIndex(currentBoard, this.user._id);
    var isAdmin = $(event.currentTarget).hasClass('js-set-admin');
    var setQuery = {};
    setQuery[['members', memberIndex, 'isAdmin'].join('.')] = isAdmin;
    Boards.update(currentBoard._id, {
      $set: setQuery
    });
    Popup.back(1);
  }
});

Template.changePermissionsPopup.helpers({
  isAdmin: function() {
    return this.user.isBoardAdmin();
  },
  isLastAdmin: function() {
    if (! this.user.isBoardAdmin())
      return false;
    var currentBoard = Boards.findOne(Session.get('currentBoard'));
    var nbAdmins = _.where(currentBoard.members, { isAdmin: true }).length;
    return nbAdmins === 1;
  }
});
