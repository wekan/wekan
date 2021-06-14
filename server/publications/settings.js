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
        textBelowCustomLoginLogo: 1,
        automaticLinkedUrlSchemes: 1,
        customTopLeftCornerLogoImageUrl: 1,
        customTopLeftCornerLogoLinkUrl: 1,
        customTopLeftCornerLogoHeight: 1,
        customHTMLafterBodyStart: 1,
        customHTMLbeforeBodyEnd: 1,
        displayAuthenticationMethod: 1,
        defaultAuthenticationMethod: 1,
        spinnerName: 1,
      },
    },
  );
});

Meteor.publish('mailServer', function() {
  if (!Match.test(this.userId, String)) return [];
  const user = Users.findOne(this.userId);
  if (user && user.isAdmin) {
    return Settings.find(
      {},
      {
        fields: {
          'mailServer.host': 1,
          'mailServer.port': 1,
          'mailServer.username': 1,
          'mailServer.enableTLS': 1,
          'mailServer.from': 1,
        },
      },
    );
  }
  return [];
});
