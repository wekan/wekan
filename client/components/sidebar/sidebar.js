Sidebar = null;

const defaultView = 'home';

const viewTitles = {
  boardsearch:'board-search',
  filter: 'filter-cards',
  multiselection: 'multi-selection',
  archives: 'archives',
};

BlazeComponent.extendComponent({
  template() {
    return 'sidebar';
  },

  mixins() {
    return [Mixins.InfiniteScrolling, Mixins.PerfectScrollbar];
  },

  onCreated() {
    this._isOpen = new ReactiveVar(!Session.get('currentCard'));
    this._view = new ReactiveVar(defaultView);
    Sidebar = this;
  },

  onDestroyed() {
    Sidebar = null;
  },

  isOpen() {
    return this._isOpen.get();
  },

  open() {
    if (!this._isOpen.get()) {
      this._isOpen.set(true);
      EscapeActions.executeUpTo('detailsPane');
    }
  },

  hide() {
    if (this._isOpen.get()) {
      this._isOpen.set(false);
    }
  },

  toggle() {
    this._isOpen.set(!this._isOpen.get());
  },

  calculateNextPeak() {
    const altitude = this.find('.js-board-sidebar-content').scrollHeight;
    this.callFirstWith(this, 'setNextPeak', altitude);
  },

  reachNextPeak() {
    const activitiesComponent = this.componentChildren('activities')[0];
    activitiesComponent.loadNextPage();
  },

  isTongueHidden() {
    return this.isOpen() && this.getView() !== defaultView;
  },

  scrollTop() {
    this.$('.js-board-sidebar-content').scrollTop(0);
  },

  getView() {
    return this._view.get();
  },

  setView(view) {
    view = _.isString(view) ? view : defaultView;
    if (this._view.get() !== view) {
      this._view.set(view);
      this.scrollTop();
      EscapeActions.executeUpTo('detailsPane');
    }
    this.open();
  },

  isDefaultView() {
    return this.getView() === defaultView;
  },

  getViewTemplate() {
    return `${this.getView()}Sidebar`;
  },

  getViewTitle() {
    return TAPi18n.__(viewTitles[this.getView()]);
  },

  events() {
    // XXX Hacky, we need some kind of `super`
    const mixinEvents = this.getMixin(Mixins.InfiniteScrolling).events();
    return mixinEvents.concat([{
      'click .js-toggle-sidebar': this.toggle,
      'click .js-back-home': this.setView,
    }]);
  },
}).register('sidebar');

Blaze.registerHelper('Sidebar', () => Sidebar);

EscapeActions.register('sidebarView',
  () => { Sidebar.setView(defaultView); },
  () => { return Sidebar && Sidebar.getView() !== defaultView; }
);

Template.memberPopup.helpers({
  user() {
    return Users.findOne(this.userId);
  },
  memberType() {
    const type = Users.findOne(this.userId).isBoardAdmin() ? 'admin' : 'normal';
    return TAPi18n.__(type).toLowerCase();
  },
});

Template.memberPopup.events({
  'click .js-filter-member'() {
    Filter.members.toggle(this.userId);
    Popup.close();
  },
  'click .js-change-role': Popup.open('changePermissions'),
  'click .js-remove-member': Popup.afterConfirm('removeMember', function() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    const memberId = this.userId;
    currentBoard.removeMember(memberId);
    Popup.close();
  }),
  'click .js-leave-member'() {
    // XXX Not implemented
    Popup.close();
  },
});

Template.removeMemberPopup.helpers({
  user() {
    return Users.findOne(this.userId);
  },
  board() {
    return Boards.findOne(Session.get('currentBoard'));
  },
});

Template.membersWidget.events({
  'click .js-member': Popup.open('member'),
  'click .js-manage-board-members': Popup.open('addMember'),
});

Template.labelsWidget.events({
  'click .js-label': Popup.open('editLabel'),
  'click .js-add-label': Popup.open('createLabel'),
});

// Board members can assign people or labels by drag-dropping elements from the
// sidebar to the cards on the board. In order to re-initialize the jquery-ui
// plugin any time a draggable member or label is modified or removed we use a
// autorun function and register a dependency on the both members and labels
// fields of the current board document.
function draggableMembersLabelsWidgets() {
  if (!Meteor.user() || !Meteor.user().isBoardMember())
    return;

  this.autorun(() => {
    const currentBoardId = Tracker.nonreactive(() => {
      return Session.get('currentBoard');
    });
    Boards.findOne(currentBoardId, {
      fields: {
        members: 1,
        labels: 1,
      },
    });
    Tracker.afterFlush(() => {
      this.$('.js-member,.js-label').draggable({
        appendTo: 'body',
        helper: 'clone',
        revert: 'invalid',
        revertDuration: 150,
        snap: false,
        snapMode: 'both',
        start() {
          EscapeActions.executeUpTo('popup-back');
        },
      });
    });
  });
}

Template.membersWidget.onRendered(draggableMembersLabelsWidgets);
Template.labelsWidget.onRendered(draggableMembersLabelsWidgets);

Template.addMemberPopup.helpers({
  isBoardMember() {
    const user = Users.findOne(this._id);
    return user && user.isBoardMember();
  },
});

Template.addMemberPopup.events({
  'click .js-select-member'() {
    const userId = this._id;
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    currentBoard.addMember(userId);
    Popup.close();
  },
});

Template.addMemberPopup.onRendered(function() {
  this.find('.js-search-member input').focus();
});

Template.changePermissionsPopup.events({
  'click .js-set-admin, click .js-set-normal'(event) {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    const memberId = this.userId;
    const isAdmin = $(event.currentTarget).hasClass('js-set-admin');
    currentBoard.setMemberPermission(memberId, isAdmin);
    Popup.back(1);
  },
});

Template.changePermissionsPopup.helpers({
  isAdmin() {
    const user = Users.findOne(this.userId);
    return user.isBoardAdmin();
  },

  isLastAdmin() {
    const user = Users.findOne(this.userId);
    if (!user.isBoardAdmin())
      return false;
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    const nbAdmins = _.where(currentBoard.members, { isAdmin: true }).length;
    return nbAdmins === 1;
  },
});
