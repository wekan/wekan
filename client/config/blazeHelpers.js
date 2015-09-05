Blaze.registerHelper('currentBoard', () => {
  const boardId = Session.get('currentBoard');
  if (boardId) {
    return Boards.findOne(boardId);
  }
});

Blaze.registerHelper('currentCard', () => {
  const cardId = Session.get('currentCard');
  if (cardId) {
    return Cards.findOne(cardId);
  }
});

Blaze.registerHelper('getUser', (userId) => Users.findOne(userId));

// XXX I believe we should compute a HTML rendered field on the server that
// would handle markdown, emojies and user mentions. We can simply have two
// fields, one source, and one compiled version (in HTML) and send only the
// compiled version to most users -- who don't need to edit.
// In the meantime, all the transformation are done on the client using the
// Blaze API.
const at = HTML.CharRef({html: '&commat;', str: '@'});
Blaze.Template.registerHelper('mentions', new Template('mentions', function() {
  const view = this;
  const currentBoard = Session.get('currentBoard');
  const knowedUsers = _.map(currentBoard.members, (member) => {
    member.username = Users.findOne(member.userId).username;
    return member;
  });
  const mentionRegex = /\B@(\w*)/gi;
  let content = Blaze.toHTML(view.templateContentBlock);

  let currentMention, knowedUser, href, linkClass, linkValue, link;
  while (Boolean(currentMention = mentionRegex.exec(content))) {

    knowedUser = _.findWhere(knowedUsers, { username: currentMention[1] });
    if (!knowedUser)
      continue;

    linkValue = [' ', at, knowedUser.username];
    // XXX We need to convert to flow router
    href = Router.url('Profile', { username: knowedUser.username });
    linkClass = 'atMention';
    if (knowedUser.userId === Meteor.userId())
      linkClass += ' me';
    link = HTML.A({ href, 'class': linkClass }, linkValue);

    content = content.replace(currentMention[0], Blaze.toHTML(link));
  }

  return HTML.Raw(content);
}));
