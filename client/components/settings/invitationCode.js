Template.invitationCode.onRendered(() => {
  const setting = Settings.findOne();
  if (setting || setting.disableRegistration) {
    $('#invitationcode').hide();
  }
});
