Meteor.subscribe('my-avatars');

Template.userAvatar.helpers({
  userData: function() {
    return Users.findOne(this.userId, {
      fields: {
        profile: 1,
        username: 1
      }
    });
  },

  memberType: function() {
    var user = Users.findOne(this.userId);
    return user && user.isBoardAdmin() ? 'admin' : 'normal';
  },

  presenceStatusClassName: function() {
    var userPresence = Presences.findOne({ userId: this.userId });
    if (! userPresence)
      return 'disconnected';
    else if (Session.equals('currentBoard', userPresence.state.currentBoardId))
      return 'active';
    else
      return 'idle';
  }
});

BlazeComponent.extendComponent({
  template: function() {
    return 'changeAvatarPopup';
  },

  avatarUrlOptions: function() {
    return {
      auth: false,
      brokenIsFine: true
    };
  },

  uploadedAvatars: function() {
    return Avatars.find({userId: Meteor.userId()});
  },

  isSelected: function() {
    var userProfile = Meteor.user().profile;
    var avatarUrl = userProfile && userProfile.avatarUrl;
    var currentAvatarUrl = this.currentData().url(this.avatarUrlOptions());
    return avatarUrl === currentAvatarUrl;
  },

  setAvatar: function(avatarUrl) {
    Meteor.users.update(Meteor.userId(), {
      $set: {
        'profile.avatarUrl': avatarUrl
      }
    });
  },

  events: function() {
    return [{
      'click .js-upload-avatar': function() {
        this.$('.js-upload-avatar-input').click();
      },
      'change .js-upload-avatar-input': function(evt) {
        var self = this;
        var file, fileUrl;

        FS.Utility.eachFile(evt, function(f) {
          file = Avatars.insert(new FS.File(f));
          fileUrl = file.url(self.avatarUrlOptions());
        });
        var fetchAvatarInterval = window.setInterval(function() {
          $.ajax({
            url: fileUrl,
            success: function() {
              self.setAvatar(file.url(self.avatarUrlOptions()));
              window.clearInterval(fetchAvatarInterval);
            }
          });
        }, 100);
      },
      'click .js-select-avatar': function() {
        var avatarUrl = this.currentData().url(this.avatarUrlOptions());
        this.setAvatar(avatarUrl);
      },
      'click .js-delete-avatar': function() {
        Avatars.remove(this.currentData()._id);
      }
    }];
  }
}).register('changeAvatarPopup');
