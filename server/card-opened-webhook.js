Meteor.startup(() => {
  if (process.env.CARD_OPENED_WEBHOOK_ENABLED) {
    Meteor.settings.public.CARD_OPENED_WEBHOOK_ENABLED = true;
  }
});
