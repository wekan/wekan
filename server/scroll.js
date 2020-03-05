Meteor.startup(() => {
  // Mouse Scroll Intertia, issue #2949. Integer.
  if (process.env.SCROLLINERTIA !== '0') {
    Meteor.settings.public.SCROLLINERTIA = parseInt(
      process.env.SCROLLINERTIA,
      radix,
    );
  } else {
    Meteor.settings.public.SCROLLINERTIA = 0;
  }

  // Mouse Scroll Amount, issue #2949. "auto" or Integer.
  if (process.env.SCROLLAMOUNT !== 'auto') {
    Meteor.settings.public.SCROLLAMOUNT = parseInt(
      process.env.SCROLLAMOUNT,
      radix,
    );
  } else {
    Meteor.settings.public.SCROLLAMOUNT = 'auto';
  }
});
