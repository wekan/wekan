Meteor.startup(() => {
  Meteor.settings.public.DEFAULT_WAIT_SPINNER = process.env.DEFAULT_WAIT_SPINNER;
});
