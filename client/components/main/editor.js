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

Template.viewer.events({
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
    window.open(href, '_blank');
  },
});
