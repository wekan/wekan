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
    this._isOpen = new ReactiveVar(false);
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
      const noComments = currentBoard.hasNoComments(this.userId);
      if(commentOnly){
        return TAPi18n.__('comment-only').toLowerCase();
      } else if(noComments) {
        return TAPi18n.__('no-comments').toLowerCase();
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
});

Template.boardMenuPopup.events({
  'click .js-rename-board': Popup.open('boardChangeTitle'),
  'click .js-custom-fields'() {
    Sidebar.setView('customFields');
    Popup.close();
  },
  'click .js-open-archives'() {
    Sidebar.setView('archives');
    Popup.close();
  },
  'click .js-change-board-color': Popup.open('boardChangeColor'),
  'click .js-change-language': Popup.open('changeLanguage'),
  'click .js-archive-board ': Popup.afterConfirm('archiveBoard', function() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    currentBoard.archive();
    // XXX We should have some kind of notification on top of the page to
    // confirm that the board was successfully archived.
    FlowRouter.go('home');
  }),
  'click .js-delete-board': Popup.afterConfirm('deleteBoard', function() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    Popup.close();
    Boards.remove(currentBoard._id);
    FlowRouter.go('home');
  }),
  'click .js-outgoing-webhooks': Popup.open('outgoingWebhooks'),
  'click .js-import-board': Popup.open('chooseBoardSource'),
  'click .js-subtask-settings': Popup.open('boardSubtaskSettings'),
});

Template.boardMenuPopup.helpers({
  exportUrl() {
    const params = {
      boardId: Session.get('currentBoard'),
    };
    const queryParams = {
      authToken: Accounts._storedLoginToken(),
    };
    return FlowRouter.path('/api/boards/:boardId/export', params, queryParams);
  },
  exportFilename() {
    const boardId = Session.get('currentBoard');
    return `wekan-export-board-${boardId}.json`;
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
    Cards.find({ boardId, members: memberId }).forEach((card) => {
      card.unassignMember(memberId);
    });
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
  user() {
    return Users.findOne(this.userId);
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
  'click .js-open-board-menu': Popup.open('boardMenu'),
  'click .js-manage-board-members': Popup.open('addMember'),
  'click .js-import': Popup.open('boardImportBoard'),
  submit: this.onSubmit,
  'click .js-import-board': Popup.open('chooseBoardSource'),
  'click .js-open-archived-board'() {
    Modal.open('archivedBoards');
  },
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

BlazeComponent.extendComponent({
  integrations() {
    const boardId = Session.get('currentBoard');
    return Integrations.find({ boardId: `${boardId}` }).fetch();
  },

  integration(id) {
    const boardId = Session.get('currentBoard');
    return Integrations.findOne({ _id: id, boardId: `${boardId}` });
  },

  events() {
    return [{
      'submit'(evt) {
        evt.preventDefault();
        const url = evt.target.url.value;
        const boardId = Session.get('currentBoard');
        let id = null;
        let integration = null;
        if (evt.target.id) {
          id = evt.target.id.value;
          integration = this.integration(id);
          if (url) {
            Integrations.update(integration._id, {
              $set: {
                url: `${url}`,
              },
            });
          } else {
            Integrations.remove(integration._id);
          }
        } else if (url) {
          Integrations.insert({
            userId: Meteor.userId(),
            enabled: true,
            type: 'outgoing-webhooks',
            url: `${url}`,
            boardId: `${boardId}`,
            activities: ['all'],
          });
        }
        Popup.close();
      },
    }];
  },
}).register('outgoingWebhooksPopup');

BlazeComponent.extendComponent({
  template() {
    return 'chooseBoardSource';
  },
}).register('chooseBoardSourcePopup');

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

BlazeComponent.extendComponent({
  backgroundColors() {
    return Boards.simpleSchema()._schema.color.allowedValues;
  },

  isSelected() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    return currentBoard.color === this.currentData().toString();
  },

  events() {
    return [{
      'click .js-select-background'(evt) {
        const currentBoard = Boards.findOne(Session.get('currentBoard'));
        const newColor = this.currentData().toString();
        currentBoard.setColor(newColor);
        evt.preventDefault();
      },
    }];
  },
}).register('boardChangeColorPopup');

BlazeComponent.extendComponent({
  onCreated() {
    this.currentBoard = Boards.findOne(Session.get('currentBoard'));
  },

  allowsSubtasks() {
    return this.currentBoard.allowsSubtasks;
  },

  isBoardSelected() {
    return this.currentBoard.subtasksDefaultBoardId === this.currentData()._id;
  },

  isNullBoardSelected() {
    return (this.currentBoard.subtasksDefaultBoardId === null) || (this.currentBoard.subtasksDefaultBoardId === undefined);
  },

  boards() {
    return Boards.find({
      archived: false,
      'members.userId': Meteor.userId(),
    }, {
      sort: ['title'],
    });
  },

  lists() {
    return Lists.find({
      boardId: this.currentBoard._id,
      archived: false,
    }, {
      sort: ['title'],
    });
  },

  hasLists() {
    return this.lists().count() > 0;
  },

  isListSelected() {
    return this.currentBoard.subtasksDefaultBoardId === this.currentData()._id;
  },

  presentParentTask() {
    let result = this.currentBoard.presentParentTask;
    if ((result === null) || (result === undefined)) {
      result = 'no-parent';
    }
    return result;
  },

  events() {
    return [{
      'click .js-field-has-subtasks'(evt) {
        evt.preventDefault();
        this.currentBoard.allowsSubtasks = !this.currentBoard.allowsSubtasks;
        this.currentBoard.setAllowsSubtasks(this.currentBoard.allowsSubtasks);
        $('.js-field-has-subtasks .materialCheckBox').toggleClass('is-checked', this.currentBoard.allowsSubtasks);
        $('.js-field-has-subtasks').toggleClass('is-checked', this.currentBoard.allowsSubtasks);
        $('.js-field-deposit-board').prop('disabled', !this.currentBoard.allowsSubtasks);
      },
      'change .js-field-deposit-board'(evt) {
        let value = evt.target.value;
        if (value === 'null') {
          value = null;
        }
        this.currentBoard.setSubtasksDefaultBoardId(value);
        evt.preventDefault();
      },
      'change .js-field-deposit-list'(evt) {
        this.currentBoard.setSubtasksDefaultListId(evt.target.value);
        evt.preventDefault();
      },
      'click .js-field-show-parent-in-minicard'(evt) {
        const value = evt.target.id || $(evt.target).parent()[0].id ||  $(evt.target).parent()[0].parent()[0].id;
        const options = [
          'prefix-with-full-path',
          'prefix-with-parent',
          'subtext-with-full-path',
          'subtext-with-parent',
          'no-parent'];
        options.forEach(function(element) {
          if (element !== value) {
            $(`#${element} .materialCheckBox`).toggleClass('is-checked', false);
            $(`#${element}`).toggleClass('is-checked', false);
          }
        });
        $(`#${value} .materialCheckBox`).toggleClass('is-checked', true);
        $(`#${value}`).toggleClass('is-checked', true);
        this.currentBoard.setPresentParentTask(value);
        evt.preventDefault();
      },
    }];
  },
}).register('boardSubtaskSettingsPopup');

BlazeComponent.extendComponent({
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
  'click .js-set-admin, click .js-set-normal, click .js-set-no-comments, click .js-set-comment-only'(event) {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    const memberId = this.userId;
    const isAdmin = $(event.currentTarget).hasClass('js-set-admin');
    const isCommentOnly = $(event.currentTarget).hasClass('js-set-comment-only');
    const isNoComments = $(event.currentTarget).hasClass('js-set-no-comments');
    currentBoard.setMemberPermission(memberId, isAdmin, isNoComments, isCommentOnly);
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
    return !currentBoard.hasAdmin(this.userId) && !currentBoard.hasNoComments(this.userId) && !currentBoard.hasCommentOnly(this.userId);
  },

  isNoComments() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    return !currentBoard.hasAdmin(this.userId) && currentBoard.hasNoComments(this.userId);
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
