Meteor.startup(() => {
  // Disable comment WYSIWYG editor for everyone to fix
  // Pasting text into a card is adding a line before and after
  // (and multiplies by pasting more)
  // https://github.com/wekan/wekan/issues/2890
  const RCCE = 'false';
  Meteor.settings.public.RICHER_CARD_COMMENT_EDITOR = RCCE;

  //// Old original code for setting:
  //const RCCE = process.env.RICHER_CARD_COMMENT_EDITOR;
  //if (RCCE) {
  //  Meteor.settings.public.RICHER_CARD_COMMENT_EDITOR = RCCE !== 'false';
  //}
});
