Meteor.startup(() => {
  if (process.env.CARD_OPENED_WEBHOOK_ENABLED === 'true') {
    Meteor.settings.public.CARD_OPENED_WEBHOOK_ENABLED = true;
  } else {
    Meteor.settings.public.CARD_OPENED_WEBHOOK_ENABLED = false;
  }
});
