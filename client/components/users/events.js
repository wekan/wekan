Template.memberMenuPopup.events({
  'click .js-language': Popup.open('setLanguage'),
  'click .js-logout': function(evt) {
    evt.preventDefault();

    Meteor.logout(function() {
      Router.go('Home');
    });
  }
});

Template.setLanguagePopup.events({
  'click .js-set-language': function(evt) {
    Users.update(Meteor.userId(), {
      $set: {
        'profile.language': this.tag
      }
    });
    evt.preventDefault();
  }
});

Template.profileEditForm.events({
  'click .js-edit-profile': function() {
    Session.set('ProfileEditForm', true);
  },
  'click .js-cancel-edit-profile': function() {
    Session.set('ProfileEditForm', false);
  },
  'submit #ProfileEditForm': function(evt, t) {
    var name = t.find('#name').value;
    var bio = t.find('#bio').value;

    // trim and update
    if ($.trim(name)) {
      Users.update(this.profile()._id, {
        $set: {
          'profile.name': name,
          'profile.bio': bio
        }
      }, function() {

        // update complete close profileEditForm
        Session.set('ProfileEditForm', false);
      });
    }
    evt.preventDefault();
  }
});

Template.memberName.events({
  'click .js-show-mem-menu': Popup.open('user')
});
