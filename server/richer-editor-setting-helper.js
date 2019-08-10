Meteor.startup(() => {
  const RCCE = process.env.RICHER_CARD_COMMENT_EDITOR;
  if (RCCE) {
    Meteor.settings.public.RICHER_CARD_COMMENT_EDITOR = RCCE !== 'false';
  }
});
