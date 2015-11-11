Meteor.subscribe('my-avatars');

Template.userAvatar.helpers({
  userData() {
    // We need to handle a special case for the search results provided by the
    // `matteodem:easy-search` package. Since these results gets published in a
    // separate collection, and not in the standard Meteor.Users collection as
    // expected, we use a component parameter ("property") to distinguish the
    // two cases.
    const userCollection = this.esSearch ? ESSearchResults : Users;
    return userCollection.findOne(this.userId, {
      fields: {
        profile: 1,
        username: 1,
      },
    });
  },

  memberType() {
    const user = Users.findOne(this.userId);
    return user && user.isBoardAdmin() ? 'admin' : 'normal';
  },

  presenceStatusClassName() {
    const userPresence = presences.findOne({ userId: this.userId });
    if (!userPresence)
      return 'disconnected';
    else if (Session.equals('currentBoard', userPresence.state.currentBoardId))
      return 'active';
    else
      return 'idle';
  },
});

Template.userAvatar.events({
  'click .js-change-avatar': Popup.open('changeAvatar'),
});

Template.userAvatarInitials.helpers({
  initials() {
    const user = Users.findOne(this.userId);
    return user && user.getInitials();
  },

  viewPortWidth() {
    const user = Users.findOne(this.userId);
    return (user && user.getInitials().length || 1) * 12;
  },
});

BlazeComponent.extendComponent({
  template() {
    return 'changeAvatarPopup';
  },

  onCreated() {
    this.error = new ReactiveVar('');
  },

  avatarUrlOptions() {
    return {
      auth: false,
      brokenIsFine: true,
    };
  },

  uploadedAvatars() {
    return Avatars.find({userId: Meteor.userId()});
  },

  isSelected() {
    const userProfile = Meteor.user().profile;
    const avatarUrl = userProfile && userProfile.avatarUrl;
    const currentAvatarUrl = this.currentData().url(this.avatarUrlOptions());
    return avatarUrl === currentAvatarUrl;
  },

  noAvatarUrl() {
    const userProfile = Meteor.user().profile;
    const avatarUrl = userProfile && userProfile.avatarUrl;
    return !avatarUrl;
  },

  setAvatar(avatarUrl) {
    Meteor.user().setAvatarUrl(avatarUrl);
  },

  setError(error) {
    this.error.set(error);
  },

  events() {
    return [{
      'click .js-upload-avatar'() {
        this.$('.js-upload-avatar-input').click();
      },
      'change .js-upload-avatar-input'(evt) {
        let file, fileUrl;

        FS.Utility.eachFile(evt, (f) => {
          try {
            file = Avatars.insert(new FS.File(f));
            fileUrl = file.url(this.avatarUrlOptions());
          } catch (e) {
            this.setError('avatar-too-big');
          }
        });

        if (fileUrl) {
          this.setError('');
          const fetchAvatarInterval = window.setInterval(() => {
            $.ajax({
              url: fileUrl,
              success: () => {
                this.setAvatar(file.url(this.avatarUrlOptions()));
                window.clearInterval(fetchAvatarInterval);
              },
            });
          }, 100);
        }
      },
      'click .js-select-avatar'() {
        const avatarUrl = this.currentData().url(this.avatarUrlOptions());
        this.setAvatar(avatarUrl);
      },
      'click .js-select-initials'() {
        this.setAvatar('');
      },
      'click .js-delete-avatar'() {
        Avatars.remove(this.currentData()._id);
      },
    }];
  },
}).register('changeAvatarPopup');

Template.cardMembersPopup.helpers({
  isCardMember() {
    const cardId = Template.parentData()._id;
    const cardMembers = Cards.findOne(cardId).members || [];
    return _.contains(cardMembers, this.userId);
  },

  user() {
    return Users.findOne(this.userId);
  },
});

Template.cardMembersPopup.events({
  'click .js-select-member'(evt) {
    const card = Cards.findOne(Session.get('currentCard'));
    const memberId = this.userId;
    card.toggleMember(memberId);
    evt.preventDefault();
  },
});

Template.cardMemberPopup.helpers({
  user() {
    return Users.findOne(this.userId);
  },
});

Template.cardMemberPopup.events({
  'click .js-remove-member'() {
    Cards.findOne(this.cardId).unassignMember(this.userId);
    Popup.close();
  },
  'click .js-edit-profile': Popup.open('editProfile'),
});

Template.listMemberPopup.events({
  'click .js-select-member'(evt) {
    const list = Lists.findOne(this.listId);
    const memberId = this.userId;
    list.toggleMember(memberId);
    evt.preventDefault();
  },
});

Template.listMemberPopup.helpers({
  user() {
    return Users.findOne(this.userId);
  },
});

Template.listMemberPopup.events({
  'click .js-remove-member'() {
    Lists.findOne(this.listId).unassignMember(this.userId);
    Popup.close();
  },
  'click .js-edit-profile': Popup.open('editProfile'),
});
