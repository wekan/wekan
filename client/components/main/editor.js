Template.editor.onRendered(() => {
  const $textarea = this.$('textarea');

  autosize($textarea);

  $textarea.escapeableTextComplete([
    // Emojies
    {
      match: /\B:([\-+\w]*)$/,
      search(term, callback) {
        callback(Emoji.values.map((emoji) => {
          return emoji.includes(term) ? emoji : null;
        }));
      },
      template(value) {
        const imgSrc = Emoji.baseImagePath + value;
        const image = `<img src="${imgSrc}.png" />`;
        return image + value;
      },
      replace(value) {
        return `:${value}:`;
      },
      index: 1,
    },

    // User mentions
    {
      match: /\B@(\w*)$/,
      search(term, callback) {
        const currentBoard = Boards.findOne(Session.get('currentBoard'));
        callback(currentBoard.members.map((member) => {
          const username = Users.findOne(member.userId).username;
          return username.includes(term) ? username : null;
        }));
      },
      template(value) {
        return value;
      },
      replace(username) {
        return `@${username} `;
      },
      index: 1,
    },
  ], {
    maxCount: 30,
  });
});

// XXX I believe we should compute a HTML rendered field on the server that
// would handle markdown, emojies and user mentions. We can simply have two
// fields, one source, and one compiled version (in HTML) and send only the
// compiled version to most users -- who don't need to edit.
// In the meantime, all the transformation are done on the client using the
// Blaze API.
const at = HTML.CharRef({html: '&commat;', str: '@'});
Blaze.Template.registerHelper('mentions', new Template('mentions', function() {
  const view = this;
  const currentBoard = Boards.findOne(Session.get('currentBoard'));
  const knowedUsers = currentBoard.members.map((member) => {
    member.username = Users.findOne(member.userId).username;
    return member;
  });
  const mentionRegex = /\B@(\w*)/gi;
  let content = Blaze.toHTML(view.templateContentBlock);

  let currentMention, knowedUser, linkClass, linkValue, link;
  while (Boolean(currentMention = mentionRegex.exec(content))) {

    knowedUser = _.findWhere(knowedUsers, { username: currentMention[1] });
    if (!knowedUser)
      continue;

    linkValue = [' ', at, knowedUser.username];
    linkClass = 'atMention js-open-member';
    if (knowedUser.userId === Meteor.userId())
      linkClass += ' me';
    link = HTML.A({
      'class': linkClass,
      // XXX Hack. Since we stringify this render function result below with
      // `Blaze.toHTML` we can't rely on blaze data contexts to pass the
      // `userId` to the popup as usual, and we need to store it in the DOM
      // using a data attribute.
      'data-userId': knowedUser.userId,
    }, linkValue);

    content = content.replace(currentMention[0], Blaze.toHTML(link));
  }

  return HTML.Raw(content);
}));

Template.viewer.events({
  'click .js-open-member'(evt, tpl) {
    const userId = evt.currentTarget.dataset.userid;
    Popup.open('member').call({ userId }, evt, tpl);
  },

  // Viewer sometimes have click-able wrapper around them (for instance to edit
  // the corresponding text). Clicking a link shouldn't fire these actions, stop
  // we stop these event at the viewer component level.
  'click a'(evt) {
    evt.stopPropagation();

    // XXX We hijack the build-in browser action because we currently don't have
    // `_blank` attributes in viewer links, and the transformer function is
    // handled by a third party package that we can't configure easily. Fix that
    // by using directly `_blank` attribute in the rendered HTML.
    evt.preventDefault();
    const href = evt.currentTarget.href;
    if (href) {
      window.open(href, '_blank');
    }
  },
});
