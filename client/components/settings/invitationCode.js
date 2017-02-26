Template.invitationCode.onRendered(() => {
  const disableRegistration = Settings.findOne().disableRegistration;
  if(!disableRegistration){
    $('#invitationcode').hide();
  }
});
