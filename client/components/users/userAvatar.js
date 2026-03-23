import { ReactiveCache } from '/imports/reactiveCache';
import Avatars from '/models/avatars';
import Presences from '/models/presences';
import { Utils } from '/client/lib/utils';

Template.userAvatar.helpers({
  userData() {
    const user = ReactiveCache.getUser(this.userId, {
      fields: {
        profile: 1,
        username: 1,
      },
    });
    return user;
  },

  avatarUrl() {
    const user = ReactiveCache.getUser(this.userId, { fields: { profile: 1 } });
    const base = (user && user.profile && user.profile.avatarUrl) || '';
    if (!base) return '';
    // Append current boardId when available so public viewers can access avatars on public boards
    try {
      const boardId = Utils.getCurrentBoardId && Utils.getCurrentBoardId();
      if (boardId) {
        const sep = base.includes('?') ? '&' : '?';
        return `${base}${sep}boardId=${encodeURIComponent(boardId)}`;
      }
    } catch (_) {}
    return base;
  },

  memberType() {
    const user = ReactiveCache.getUser(this.userId);
    if (!user) return '';

    const board = Utils.getCurrentBoard();
    if (!board) return '';

    // Return role in priority order: Admin, Normal, NormalAssignedOnly, NoComments, CommentOnly, CommentAssignedOnly, Worker, ReadOnly, ReadAssignedOnly
    if (user.isBoardAdmin()) return 'admin';
    if (board.hasReadAssignedOnly(user._id)) return 'read-assigned-only';
    if (board.hasReadOnly(user._id)) return 'read-only';
    if (board.hasWorker(user._id)) return 'worker';
    if (board.hasCommentAssignedOnly(user._id)) return 'comment-assigned-only';
    if (board.hasCommentOnly(user._id)) return 'comment-only';
    if (board.hasNoComments(user._id)) return 'no-comments';
    if (board.hasNormalAssignedOnly(user._id)) return 'normal-assigned-only';
    return 'normal';
  },

/*
  presenceStatusClassName() {
    const user = ReactiveCache.getUser(this.userId);
    const userPresence = Presences.findOne({ userId: this.userId });
    if (user && user.isInvitedTo(Session.get('currentBoard'))) return 'pending';
    else if (!userPresence) return 'disconnected';
    else if (Session.equals('currentBoard', userPresence.state.currentBoardId))
      return 'active';
    else return 'idle';
  },
*/

});

Template.userAvatarInitials.helpers({
  initials() {
    const user = ReactiveCache.getUser(this.userId);
    return user && user.getInitials();
  },

  viewPortWidth() {
    const user = ReactiveCache.getUser(this.userId);
    return ((user && user.getInitials().length) || 1) * 12;
  },
});

Template.boardOrgRow.onCreated(function () {
  this.error = new ReactiveVar('');
  this.loading = new ReactiveVar(false);
  this.findOrgsOptions = new ReactiveVar({});

  this.page = new ReactiveVar(1);
  this.autorun(() => {
    const limitOrgs = this.page.get() * Number.MAX_SAFE_INTEGER;
    this.subscribe('org', this.findOrgsOptions.get(), limitOrgs, () => {});
  });
});

Template.boardOrgRow.onRendered(function () {
  this.loading.set(false);
});

Template.boardOrgRow.helpers({
  isLoading() {
    return Template.instance().loading.get();
  },
  orgData() {
    return ReactiveCache.getOrg(this.orgId);
  },
});

Template.boardOrgRow.events({
  'keyup input'(event, tpl) {
    tpl.error.set('');
  },
  'click .js-manage-board-removeOrg': Popup.open('removeBoardOrg'),
});

Template.boardOrgName.helpers({
  orgName() {
    const org = ReactiveCache.getOrg(this.orgId);
    return org && org.orgDisplayName;
  },

  orgViewPortWidth() {
    const org = ReactiveCache.getOrg(this.orgId);
    return ((org && org.orgDisplayName.length) || 1) * 12;
  },
});

Template.boardTeamRow.onCreated(function () {
  this.error = new ReactiveVar('');
  this.loading = new ReactiveVar(false);
  this.findOrgsOptions = new ReactiveVar({});

  this.page = new ReactiveVar(1);
  this.autorun(() => {
    const limitTeams = this.page.get() * Number.MAX_SAFE_INTEGER;
    this.subscribe('team', this.findOrgsOptions.get(), limitTeams, () => {});
  });
});

Template.boardTeamRow.onRendered(function () {
  this.loading.set(false);
});

Template.boardTeamRow.helpers({
  isLoading() {
    return Template.instance().loading.get();
  },
  teamData() {
    return ReactiveCache.getTeam(this.teamId);
  },
});

Template.boardTeamRow.events({
  'keyup input'(event, tpl) {
    tpl.error.set('');
  },
  'click .js-manage-board-removeTeam': Popup.open('removeBoardTeam'),
});

Template.boardTeamName.helpers({
  teamName() {
    const team = ReactiveCache.getTeam(this.teamId);
    return team && team.teamDisplayName;
  },

  teamViewPortWidth() {
    const team = ReactiveCache.getTeam(this.teamId);
    return ((team && team.teamDisplayName.length) || 1) * 12;
  },
});

Template.changeAvatarPopup.onCreated(function () {
  this.error = new ReactiveVar('');
  Meteor.subscribe('my-avatars');
});

Template.changeAvatarPopup.helpers({
  error() {
    return Template.instance().error;
  },
  uploadedAvatars() {
    const ret = ReactiveCache.getAvatars({ userId: Meteor.userId() }, {}, true);
    return ret;
  },
  isSelected() {
    const userProfile = ReactiveCache.getCurrentUser().profile;
    const avatarUrl = userProfile && userProfile.avatarUrl;
    const currentAvatarUrl = Template.currentData().link();
    return avatarUrl === currentAvatarUrl;
  },
  noAvatarUrl() {
    const userProfile = ReactiveCache.getCurrentUser().profile;
    const avatarUrl = userProfile && userProfile.avatarUrl;
    return !avatarUrl;
  },
});

function changeAvatarSetAvatar(tpl, avatarUrl) {
  Meteor.call('setAvatarUrl', avatarUrl, (err) => {
    if (err) {
      tpl.error.set(err.reason || 'Error setting avatar');
    }
  });
}

Template.changeAvatarPopup.events({
  'click .js-upload-avatar'(event, tpl) {
    tpl.$('.js-upload-avatar-input').click();
  },
  async 'change .js-upload-avatar-input'(event, tpl) {
    if (event.currentTarget.files && event.currentTarget.files[0]) {
      const uploader = await Avatars.insertAsync(
        {
          file: event.currentTarget.files[0],
          chunkSize: 'dynamic',
        },
        false,
      );
      uploader.on('error', (error, fileData) => {
        tpl.error.set(error.reason);
      });
      uploader.start();
    }
  },
  'click .js-select-avatar'(event, tpl) {
    event.preventDefault();
    event.stopPropagation();
    const data = Blaze.getData(event.currentTarget);
    if (data && typeof data.link === 'function') {
      const avatarUrl = data.link();
      changeAvatarSetAvatar(tpl, avatarUrl);
    }
  },
  'click .js-select-initials'(event, tpl) {
    event.preventDefault();
    event.stopPropagation();
    changeAvatarSetAvatar(tpl, '');
  },
  'click .js-delete-avatar': Popup.afterConfirm('deleteAvatar', async function (event) {
    await Avatars.removeAsync(this._id);
    Popup.back();
    event.stopPropagation();
  }),
});

Template.cardMemberPopup.helpers({
  user() {
    return ReactiveCache.getUser(this.userId);
  },
});

Template.cardMemberPopup.events({
  'click .js-remove-member'() {
    ReactiveCache.getCard(this.cardId).unassignMember(this.userId);
    Popup.back();
  },
  'click .js-edit-profile': Popup.open('editProfile'),
});
