Meteor.startup(() => {
  const appId = process.env.KADIRA_APP_ID;
  const appSecret = process.env.KADIRA_APP_SECRET;
  Kadira.connect(appId, appSecret);
});
