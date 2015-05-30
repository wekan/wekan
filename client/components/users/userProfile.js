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
