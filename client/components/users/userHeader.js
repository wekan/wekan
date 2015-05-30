Template.headerUserBar.events({
  'click .js-open-header-member-menu': Popup.open('memberMenu')
});

Template.setLanguagePopup.helpers({
  languages: function() {
    return _.map(TAPi18n.getLanguages(), function(lang, tag) {
      return {
        tag: tag,
        name: lang.name
      };
    });
  },
  isCurrentLanguage: function() {
    return this.tag === TAPi18n.getLanguage();
  }
});

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
