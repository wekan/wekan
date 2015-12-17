Sidebar = null;

const defaultView = 'home';

const viewTitles = {
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
    const initOpen = Utils.isMiniScreen() ? false : (!Session.get('currentCard'));
    this._isOpen = new ReactiveVar(initOpen);
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
    const activitiesComponent = this.childComponents('activities')[0];
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
    return [...mixinEvents, {
      'click .js-hide-sidebar': this.hide,
      'click .js-toggle-sidebar': this.toggle,
      'click .js-back-home': this.setView,
    }];
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
  isInvited() {
    return Users.findOne(this.userId).isInvitedTo(Session.get('currentBoard'));
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
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    Meteor.call('quitBoard', currentBoard, (err, ret) => {
      if (!ret && ret) {
        Popup.close();
        FlowRouter.go('home');
      }
    });
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

Template.membersWidget.helpers({
  isInvited() {
    const user = Meteor.user();
    return user && user.isInvitedTo(Session.get('currentBoard'));
  },
});

Template.membersWidget.events({
  'click .js-member': Popup.open('member'),
  'click .js-manage-board-members': Popup.open('addMember'),
  'click .js-member-invite-accept'() {
    const boardId = Session.get('currentBoard');
    Meteor.user().removeInvite(boardId);
  },
  'click .js-member-invite-decline'() {
    const boardId = Session.get('currentBoard');
    Meteor.call('quitBoard', boardId, (err, ret) => {
      if (!err && ret) {
        Meteor.user().removeInvite(boardId);
        FlowRouter.go('home');
      }
    });
  },
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

BlazeComponent.extendComponent({
  template() {
    return 'addMemberPopup';
  },

  onCreated() {
    this.error = new ReactiveVar('');
    this.loading = new ReactiveVar(false);
  },

  onRendered() {
    this.find('.js-search-member input').focus();
    this.setLoading(false);
  },

  isBoardMember() {
    const userId = this.currentData()._id;
    const user = Users.findOne(userId);
    return user && user.isBoardMember();
  },

  isValidEmail(email) {
    return SimpleSchema.RegEx.Email.test(email);
  },

  setError(error) {
    this.error.set(error);
  },

  setLoading(w) {
    this.loading.set(w);
  },

  isLoading() {
    return this.loading.get();
  },

  inviteUser(idNameEmail) {
    const boardId = Session.get('currentBoard');
    this.setLoading(true);
    const self = this;
    Meteor.call('inviteUserToBoard', idNameEmail, boardId, (err, ret) => {
      self.setLoading(false);
      if (err) self.setError(err.error);
      else if (ret.email) self.setError('email-sent');
      else Popup.close();
    });
  },

  events() {
    return [{
      'keyup input'() {
        this.setError('');
      },
      'click .js-select-member'() {
        const userId = this.currentData()._id;
        const currentBoard = Boards.findOne(Session.get('currentBoard'));
        if (!currentBoard.hasMember(userId)) {
          this.inviteUser(userId);
        }
      },
      'click .js-email-invite'() {
        const idNameEmail = $('.js-search-member input').val();
        if (idNameEmail.indexOf('@')<0 || this.isValidEmail(idNameEmail)) {
          this.inviteUser(idNameEmail);
        } else this.setError('email-invalid');
      },
    }];
  },
}).register('addMemberPopup');

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
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    return currentBoard.hasAdmin(this.userId);
  },

  isLastAdmin() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    return currentBoard.hasAdmin(this.userId) && (currentBoard.activeAdmins() === 1);
  },
});
