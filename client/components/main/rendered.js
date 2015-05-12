Template.editor.rendered = function() {
  this.$('textarea').textcomplete([
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
};
