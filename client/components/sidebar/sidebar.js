import { Teams } from '/imports/model/teams';

Sidebar = null;

const defaultView = 'home';

const viewTitles = {
  filter: 'filter-cards',
  search: 'search-cards',
  multiselection: 'multi-selection',
  customFields: 'custom-fields',
  archives: 'archives',
};

BlazeComponent.extendComponent({
  mixins() {
    return [Mixins.InfiniteScrolling, Mixins.PerfectScrollbar];
  },

  onCreated() {
    const initOpen = Utils.isMiniScreen() ? false : (!Session.get('currentCard'));
    this._isOpen = new ReactiveVar(initOpen);
    this._view = new ReactiveVar(defaultView);
    Meteor.subscribe('allteams');
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

  showTongueTitle() {
    if (this.isOpen())
      return `${TAPi18n.__('sidebar-close')}`;
    else
      return `${TAPi18n.__('sidebar-open')}`;
  },

  events() {
    return [{
      'click .js-hide-sidebar': this.hide,
      'click .js-toggle-sidebar': this.toggle,
      'click .js-back-home': this.setView,
      'click .js-shortcuts'() {
        FlowRouter.go('shortcuts');
      },
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
    if(type === 'normal'){
      const currentBoard = Boards.findOne(Session.get('currentBoard'));
      const commentOnly = currentBoard.hasCommentOnly(this.userId);
      if(commentOnly){
        return TAPi18n.__('comment-only').toLowerCase();
      } else {
        return TAPi18n.__(type).toLowerCase();
      }
    } else {
      return TAPi18n.__(type).toLowerCase();
    }
  },
  isInvited() {
    return Users.findOne(this.userId).isInvitedTo(Session.get('currentBoard'));
  },
  team() {
    return Teams.findOne(this.userId);
  },
  members() {
    const team = Teams.findOne(this.userId);
    Meteor.subscribe('team-members', team.members);
    return team.memberUsers();
  },
});

Template.memberPopup.events({
  'click .js-filter-member'() {
    Filter.members.toggle(this.userId);
    Popup.close();
  },
  'click .js-change-role': Popup.open('changePermissions'),
  'click .js-remove-member': Popup.afterConfirm('removeMember', function() {
    const boardId = Session.get('currentBoard');
    const memberId = this.userId;
    const board = Boards.findOne(Session.get('currentBoard'));

    if (this.isTeam) {
      const team = Teams.findOne(memberId);
      team.members.forEach((teamMemberId) => {
        if (board.members.filter((boardMember) => boardMember.userId === teamMemberId && boardMember.isActive).length === 0) {
          Cards.find({ boardId, members: teamMemberId }).forEach((card) => {
            card.unassignMember(teamMemberId);
          });
        }
      });
    } else {
      Cards.find({ boardId, members: memberId }).forEach((card) => {
        card.unassignMember(memberId);
      });
    }

    Boards.findOne(boardId).removeMember(memberId);
    Popup.close();
  }),
  'click .js-leave-member': Popup.afterConfirm('leaveBoard', () => {
    const boardId = Session.get('currentBoard');
    Meteor.call('quitBoard', boardId, () => {
      Popup.close();
      FlowRouter.go('home');
    });
  }),
});


Template.removeMemberPopup.helpers({
  fullname() {
    if(this.isTeam) {
      return Teams.findOne(this.userId).name;
    }
    return Users.findOne(this.userId).profile.fullname;
  },
  username() {
    if(this.isTeam) {
      return TAPi18n.__('team');
    }
    return Users.findOne(this.userId).username;
  },
  board() {
    return Boards.findOne(Session.get('currentBoard'));
  },
});

Template.leaveBoardPopup.helpers({
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
  'click .js-manage-board-team': Popup.open('addTeam'),
  'click .sandstorm-powerbox-request-identity'() {
    window.sandstormRequestIdentity();
  },
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
      const $draggables = this.$('.js-member,.js-label');
      $draggables.draggable({
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

      function userIsMember() {
        return Meteor.user() && Meteor.user().isBoardMember();
      }

      this.autorun(() => {
        $draggables.draggable('option', 'disabled', !userIsMember());
      });
    });
  });
}

Template.membersWidget.onRendered(draggableMembersLabelsWidgets);
Template.labelsWidget.onRendered(draggableMembersLabelsWidgets);

Template.changePermissionsPopup.events({
  'click .js-set-admin, click .js-set-normal, click .js-set-comment-only'(event) {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    const memberId = this.userId;
    const isAdmin = $(event.currentTarget).hasClass('js-set-admin');
    const isCommentOnly = $(event.currentTarget).hasClass('js-set-comment-only');
    currentBoard.setMemberPermission(memberId, isAdmin, isCommentOnly);
    Popup.back(1);
  },
});

Template.changePermissionsPopup.helpers({
  isAdmin() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    return currentBoard.hasAdmin(this.userId);
  },

  isNormal() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    return !currentBoard.hasAdmin(this.userId) && !currentBoard.hasCommentOnly(this.userId);
  },

  isCommentOnly() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    return !currentBoard.hasAdmin(this.userId) && currentBoard.hasCommentOnly(this.userId);
  },

  isLastAdmin() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    return currentBoard.hasAdmin(this.userId) && (currentBoard.activeAdmins() === 1);
  },
});
