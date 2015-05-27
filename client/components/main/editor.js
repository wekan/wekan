var dropdownMenuIsOpened = false;

Template.editor.onRendered(function() {
  var $textarea = this.$('textarea');

  $textarea.textcomplete([
    // Emojies
    {
      match: /\B:([\-+\w]*)$/,
      search: function(term, callback) {
        callback($.map(Emoji.values, function(emoji) {
          return emoji.indexOf(term) === 0 ? emoji : null;
        }));
      },
      template: function(value) {
        var image = '<img src="' + Emoji.baseImagePath + value + '.png"></img>';
        return image + value;
      },
      replace: function(value) {
        return ':' + value + ':';
      },
      index: 1
    },

    // User mentions
    {
      match: /\B@(\w*)$/,
      search: function(term, callback) {
        var currentBoard = Boards.findOne(Session.get('currentBoard'));
        callback($.map(currentBoard.members, function(member) {
          var username = Users.findOne(member.userId).username;
          return username.indexOf(term) === 0 ? username : null;
        }));
      },
      template: function(value) {
        return value;
      },
      replace: function(username) {
        return '@' + username + ' ';
      },
      index: 1
    }
  ]);

  // Since commit d474017 jquery-textComplete automatically closes a potential
  // opened dropdown menu when the user press Escape. This behavior conflicts
  // with our EscapeActions system, but it's too complicated and hacky to
  // monkey-pach textComplete to disable it -- I tried. Instead we listen to
  // 'open' and 'hide' events, and create a ghost escapeAction when the dropdown
  // is opened (and rely on textComplete to execute the actual action).
  $textarea.on({
    'textComplete:show': function() {
      dropdownMenuIsOpened = true;
    },
    'textComplete:hide': function() {
      Tracker.afterFlush(function() {
        dropdownMenuIsOpened = false;
      });
    }
  });
});

EscapeActions.register('textcomplete',
  function() { return dropdownMenuIsOpened; },
  function() {}
);
