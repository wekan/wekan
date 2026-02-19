// Publish custom UI configuration
Meteor.publish('customUI', function() {
  // Published to all users (public configuration)
  return Settings.find({}, {
    fields: {
      customLoginLogoImageUrl: 1,
      customLoginLogoLinkUrl: 1,
      customHelpLinkUrl: 1,
      textBelowCustomLoginLogo: 1,
      customTopLeftCornerLogoImageUrl: 1,
      customTopLeftCornerLogoLinkUrl: 1,
      customTopLeftCornerLogoHeight: 1,
      customHTMLafterBodyStart: 1,
      customHTMLbeforeBodyEnd: 1,
    }
  });
});

// Publish Matomo configuration
Meteor.publish('matomoConfig', function() {
  // Published to all users (public configuration)
  return Settings.find({}, {
    fields: {
      matomoEnabled: 1,
      matomoURL: 1,
      matomoSiteId: 1,
    }
  });
});
