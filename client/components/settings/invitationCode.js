Template.invitationCode.onRendered(() => {
  const strict = Settings.findOne().strict;
  if(!strict){
    $('#invitationcode').hide();
  }
});
