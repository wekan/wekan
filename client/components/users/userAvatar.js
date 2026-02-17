import { ReactiveCache } from '/imports/reactiveCache';
import Cards from '/models/cards';
import Avatars from '/models/avatars';
import Users from '/models/users';
import Org from '/models/org';
import Team from '/models/team';

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

BlazeComponent.extendComponent({
  onCreated() {
    this.error = new ReactiveVar('');
    this.loading = new ReactiveVar(false);
    this.findOrgsOptions = new ReactiveVar({});

    this.page = new ReactiveVar(1);
    this.autorun(() => {
      const limitOrgs = this.page.get() * Number.MAX_SAFE_INTEGER;
      this.subscribe('org', this.findOrgsOptions.get(), limitOrgs, () => {});
    });
  },

  onRendered() {
    this.setLoading(false);
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

  events() {
    return [
      {
        'keyup input'() {
          this.setError('');
        },
        'click .js-manage-board-removeOrg': Popup.open('removeBoardOrg'),
      },
    ];
  },
}).register('boardOrgRow');

Template.boardOrgRow.helpers({
  orgData() {
    return ReactiveCache.getOrg(this.orgId);
  },
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

BlazeComponent.extendComponent({
  onCreated() {
    this.error = new ReactiveVar('');
    this.loading = new ReactiveVar(false);
    this.findOrgsOptions = new ReactiveVar({});

    this.page = new ReactiveVar(1);
    this.autorun(() => {
      const limitTeams = this.page.get() * Number.MAX_SAFE_INTEGER;
      this.subscribe('team', this.findOrgsOptions.get(), limitTeams, () => {});
    });
  },

  onRendered() {
    this.setLoading(false);
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

  events() {
    return [
      {
        'keyup input'() {
          this.setError('');
        },
        'click .js-manage-board-removeTeam': Popup.open('removeBoardTeam'),
      },
    ];
  },
}).register('boardTeamRow');

Template.boardTeamRow.helpers({
  teamData() {
    return ReactiveCache.getTeam(this.teamId);
  },
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

BlazeComponent.extendComponent({
  onCreated() {
    this.error = new ReactiveVar('');

    Meteor.subscribe('my-avatars');
  },

  uploadedAvatars() {
    const ret = ReactiveCache.getAvatars({ userId: Meteor.userId() }, {}, true);
    return ret;
  },

  isSelected() {
    const userProfile = ReactiveCache.getCurrentUser().profile;
    const avatarUrl = userProfile && userProfile.avatarUrl;
    const currentAvatarUrl = this.currentData().link();
    return avatarUrl === currentAvatarUrl;
  },

  noAvatarUrl() {
    const userProfile = ReactiveCache.getCurrentUser().profile;
    const avatarUrl = userProfile && userProfile.avatarUrl;
    return !avatarUrl;
  },

  setAvatar(avatarUrl) {
    Meteor.call('setAvatarUrl', avatarUrl, (err) => {
      if (err) {
        this.setError(err.reason || 'Error setting avatar');
      }
    });
  },

  setError(error) {
    this.error.set(error);
  },

  events() {
    return [
      {
        'click .js-upload-avatar'() {
          this.$('.js-upload-avatar-input').click();
        },
        'change .js-upload-avatar-input'(event) {
          const self = this;
          if (event.currentTarget.files && event.currentTarget.files[0]) {
            const uploader = Avatars.insert(
              {
                file: event.currentTarget.files[0],
                chunkSize: 'dynamic',
              },
              false,
            );
            uploader.on('error', (error, fileData) => {
              self.setError(error.reason);
            });
            uploader.start();
          }
        },
        'click .js-select-avatar'(event) {
          event.preventDefault();
          event.stopPropagation();
          const data = Blaze.getData(event.currentTarget);
          if (data && typeof data.link === 'function') {
            const avatarUrl = data.link();
            this.setAvatar(avatarUrl);
          }
        },
        'click .js-select-initials'(event) {
          event.preventDefault();
          event.stopPropagation();
          this.setAvatar('');
        },
        'click .js-delete-avatar': Popup.afterConfirm('deleteAvatar', function(event) {
          Avatars.remove(this._id);
          Popup.back();
          event.stopPropagation();
        }),
      },
    ];
  },
}).register('changeAvatarPopup');

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
