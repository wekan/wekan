import { ReactiveCache } from '/imports/reactiveCache';

Meteor.publish('globalwebhooks', () => {
  const boardId = Integrations.Const.GLOBAL_WEBHOOK_ID;
  const ret = ReactiveCache.getIntegrations(
    {
      boardId,
    },
    {},
    true,
  );
  return ret;
});
Meteor.publish('setting', () => {
  const ret = Settings.find(
    {},
    {
      fields: {
        disableRegistration: 1,
        disableForgotPassword: 1,
        productName: 1,
        hideLogo: 1,
        hideCardCounterList: 1,
        hideBoardMemberList: 1,
        customLoginLogoImageUrl: 1,
        customLoginLogoLinkUrl: 1,
        customHelpLinkUrl: 1,
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
        oidcBtnText: 1,
        mailDomainName: 1,
        legalNotice: 1,
        accessibilityPageEnabled: 1,
        accessibilityTitle: 1,
        accessibilityContent: 1,
      },
    },
  );
  return ret;
});

Meteor.publish('mailServer', function() {
  const user = ReactiveCache.getCurrentUser();

  let ret = []
  if (user && user.isAdmin) {
    ret = Settings.find(
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
  return ret;
});
