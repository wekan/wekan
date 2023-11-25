import { ReactiveCache } from '/imports/reactiveCache';
import Cards from '/models/cards';
import Avatars from '/models/avatars';
import Users from '/models/users';
import Org from '/models/org';
import Team from '/models/team';

Template.userAvatar.helpers({
  userData() {
    return ReactiveCache.getUser(this.userId, {
      fields: {
        profile: 1,
        username: 1,
      },
    });
  },

  memberType() {
    const user = ReactiveCache.getUser(this.userId);
    return user && user.isBoardAdmin() ? 'admin' : 'normal';
  },

/*
  presenceStatusClassName() {
    const user = ReactiveCache.getUser(this.userId);
    const userPresence = presences.findOne({ userId: this.userId });
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
    const ret = ReactiveCache.getAvatars({ userId: Meteor.userId() }, {}, true).each();
    return ret;
  },

  isSelected() {
    const userProfile = ReactiveCache.getCurrentUser().profile;
    const avatarUrl = userProfile && userProfile.avatarUrl;
    const currentAvatarUrl = `${this.currentData().link()}?auth=false&brokenIsFine=true`;
    return avatarUrl === currentAvatarUrl;
  },

  noAvatarUrl() {
    const userProfile = ReactiveCache.getCurrentUser().profile;
    const avatarUrl = userProfile && userProfile.avatarUrl;
    return !avatarUrl;
  },

  setAvatar(avatarUrl) {
    ReactiveCache.getCurrentUser().setAvatarUrl(avatarUrl);
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
        'click .js-select-avatar'() {
          const avatarUrl = `${this.currentData().link()}?auth=false&brokenIsFine=true`;
          this.setAvatar(avatarUrl);
        },
        'click .js-select-initials'() {
          this.setAvatar('');
        },
        'click .js-delete-avatar'(event) {
          Avatars.remove(this.currentData()._id);
          event.stopPropagation();
        },
      },
    ];
  },
}).register('changeAvatarPopup');

Template.cardMembersPopup.helpers({
  isCardMember() {
    const card = Template.parentData();
    const cardMembers = card.getMembers();

    return _.contains(cardMembers, this.userId);
  },

  user() {
    return ReactiveCache.getUser(this.userId);
  },
});

Template.cardMembersPopup.events({
  'click .js-select-member'(event) {
    const card = Utils.getCurrentCard();
    const memberId = this.userId;
    card.toggleMember(memberId);
    event.preventDefault();
  },
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
