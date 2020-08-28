Meteor.startup(() => {
  // Mouse Scroll Intertia, issue #2949. Integer.
  if (process.env.SCROLLINERTIA !== '0') {
    Meteor.settings.public.SCROLLINERTIA = process.env.SCROLLINERTIA;
  } else {
    Meteor.settings.public.SCROLLINERTIA = 0;
  }

  // Mouse Scroll Amount, issue #2949. "auto" or Integer.
  if (process.env.SCROLLAMOUNT !== 'auto') {
    Meteor.settings.public.SCROLLAMOUNT = process.env.SCROLLAMOUNT;
  } else {
    Meteor.settings.public.SCROLLAMOUNT = 'auto';
  }

  // Mouse Scroll DeltaFactor, issue #2949. "auto" or Integer.
  if (process.env.SCROLLDELTAFACTOR !== 'auto') {
    Meteor.settings.public.SCROLLDELTAFACTOR = process.env.SCROLLDELTAFACTOR;
  } else {
    Meteor.settings.public.SCROLLDELTAFACTOR = 'auto';
  }
});
