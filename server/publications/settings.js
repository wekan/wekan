Meteor.publish('setting', () => {
  return Settings.find({}, {
    fields:{
      disableRegistration: 1,
      productName: 1,
      hideLogo: 1,
      customHTMLafterBodyStart: 1,
      customHTMLbeforeBodyEnd: 1,
      displayAuthenticationMethod: 1,
      defaultAuthenticationMethod: 1,
    },
  });
});

Meteor.publish('mailServer', function () {
  if (!Match.test(this.userId, String))
    return [];
  const user = Users.findOne(this.userId);
  if(user && user.isAdmin){
    return Settings.find({}, {fields: {mailServer: 1}});
  }
  return [];
});
