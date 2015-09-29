let dropdownMenuIsOpened = false;

Template.editor.onRendered(() => {
  const $textarea = this.$('textarea');

  autosize($textarea);

  $textarea.textcomplete([
    // Emojies
    {
      match: /\B:([\-+\w]*)$/,
      search(term, callback) {
        callback($.map(Emoji.values, (emoji) => {
          return emoji.indexOf(term) === 0 ? emoji : null;
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
        callback($.map(currentBoard.members, (member) => {
          const username = Users.findOne(member.userId).username;
          return username.indexOf(term) === 0 ? username : null;
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
  ]);

  // Since commit d474017 jquery-textComplete automatically closes a potential
  // opened dropdown menu when the user press Escape. This behavior conflicts
  // with our EscapeActions system, but it's too complicated and hacky to
  // monkey-pach textComplete to disable it -- I tried. Instead we listen to
  // 'open' and 'hide' events, and create a ghost escapeAction when the dropdown
  // is opened (and rely on textComplete to execute the actual action).
  $textarea.on({
    'textComplete:show'() {
      dropdownMenuIsOpened = true;
    },
    'textComplete:hide'() {
      Tracker.afterFlush(() => {
        dropdownMenuIsOpened = false;
      });
    },
  });
});

EscapeActions.register('textcomplete',
  () => {},
  () => dropdownMenuIsOpened
);

// XXX I believe we should compute a HTML rendered field on the server that
// would handle markdown, emojies and user mentions. We can simply have two
// fields, one source, and one compiled version (in HTML) and send only the
// compiled version to most users -- who don't need to edit.
// In the meantime, all the transformation are done on the client using the
// Blaze API.
const at = HTML.CharRef({html: '&commat;', str: '@'});
Blaze.Template.registerHelper('mentions', new Template('mentions', function() {
  const view = this;
  if( !Session.get('currentBoard') ) return;
  const currentBoard = Boards.findOne(Session.get('currentBoard'));
  const knowedUsers = _.map(currentBoard.members, (member) => {
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
