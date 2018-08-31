Template.editor.onRendered(() => {
  const $textarea = this.$('textarea');

  autosize($textarea);

  CardAutocompletion.autocomplete($textarea);
});

import sanitizeXss from 'xss';

// XXX I believe we should compute a HTML rendered field on the server that
// would handle markdown, emoji and user mentions. We can simply have two
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
  const mentionRegex = /\B@([\w.]*)/gi;
  let content = Blaze.toHTML(view.templateContentBlock);

  let currentMention;
  while ((currentMention = mentionRegex.exec(content)) !== null) {
    const [fullMention, username] = currentMention;
    const knowedUser = _.findWhere(knowedUsers, { username });
    if (!knowedUser) {
      continue;
    }

    const linkValue = [' ', at, knowedUser.username];
    let linkClass = 'atMention js-open-member';
    if (knowedUser.userId === Meteor.userId()) {
      linkClass += ' me';
    }
    const link = HTML.A({
      'class': linkClass,
      // XXX Hack. Since we stringify this render function result below with
      // `Blaze.toHTML` we can't rely on blaze data contexts to pass the
      // `userId` to the popup as usual, and we need to store it in the DOM
      // using a data attribute.
      'data-userId': knowedUser.userId,
    }, linkValue);

    content = content.replace(fullMention, Blaze.toHTML(link));
  }

  return HTML.Raw(sanitizeXss(content));
}));

Template.viewer.events({
  // Viewer sometimes have click-able wrapper around them (for instance to edit
  // the corresponding text). Clicking a link shouldn't fire these actions, stop
  // we stop these event at the viewer component level.
  'click a'(evt, tpl) {
    evt.stopPropagation();

    // XXX We hijack the build-in browser action because we currently don't have
    // `_blank` attributes in viewer links, and the transformer function is
    // handled by a third party package that we can't configure easily. Fix that
    // by using directly `_blank` attribute in the rendered HTML.
    evt.preventDefault();

    const userId = evt.currentTarget.dataset.userid;
    if (userId) {
      Popup.open('member').call({ userId }, evt, tpl);
    }
    else {
      const href = evt.currentTarget.href;
      if (href) {
        window.open(href, '_blank');
      }
    }
  },
});
