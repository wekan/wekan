
_.each(['signIn', 'signUp', 'resetPwd',
  'forgotPwd', 'enrollAccount', 'changePwd'], function(routeName) {
  AccountsTemplates.configureRoute(routeName, {
    layoutTemplate: 'userFormsLayout'
  });
});

Router.route('/profile/:username', {
  name: 'Profile',
  template: 'profile',
  waitOn: function() {
    return Meteor.subscribe('profile', this.params.username);
  },
  data: function() {
    var params = this.params;
    return {
      profile: function() {
        return Users.findOne({ username: params.username });
      }
    };
  }
});

Router.route('/settings', {
  name: 'Settings',
  template: 'settings',
  layoutTemplate: 'AuthLayout'
});
