Template.userAvatar.helpers({
  userData: function() {
    if (! this.user) {
      this.user = Users.findOne(this.userId);
    }
    return this.user;
  },
  memberType: function() {
    var userId = this.userId || this.user._id;
    var user = Users.findOne(userId);
    return user && user.isBoardAdmin() ? 'admin' : 'normal';
  }
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
