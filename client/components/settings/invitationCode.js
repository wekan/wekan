Template.invitationCode.onRendered(function() {
  Meteor.subscribe('setting', {
    onReady : function() {
      const setting = Settings.findOne();

      if (!setting || !setting.disableRegistration) {
        $('#invitationcode').hide();
      }

      return this.stop();
    }
  });
});
