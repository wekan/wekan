Meteor.startup(() => {
  Meteor.settings.public.WAIT_SPINNER = process.env.WAIT_SPINNER;
});
