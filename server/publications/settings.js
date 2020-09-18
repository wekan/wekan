Meteor.publish('globalwebhooks', () => {
  const boardId = Integrations.Const.GLOBAL_WEBHOOK_ID;
  return Integrations.find({
    boardId,
  });
});
Meteor.publish('setting', () => {
  return Settings.find(
    {},
    {
      fields: {
        disableRegistration: 1,
        productName: 1,
        hideLogo: 1,
        customLoginLogoImageUrl: 1,
        customLoginLogoLinkUrl: 1,
        customTopLeftCornerLogoImageUrl: 1,
        customTopLeftCornerLogoLinkUrl: 1,
        customHTMLafterBodyStart: 1,
        customHTMLbeforeBodyEnd: 1,
        displayAuthenticationMethod: 1,
        defaultAuthenticationMethod: 1,
      },
    },
  );
});

Meteor.publish('mailServer', function() {
  if (!Match.test(this.userId, String)) return [];
  const user = Users.findOne(this.userId);
  if (user && user.isAdmin) {
    return Settings.find({}, { fields: { mailServer: 1 } });
  }
  return [];
});
