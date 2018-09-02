CardAutocompletion = {

  autocomplete: function($textarea, handlers) {

    handlers = handlers || {};

    $textarea.escapeableTextComplete([
      // Emoji
      {
        match: /\B:([-+\w]*)$/,
        search(term, callback) {
          callback(Emoji.values.map((emoji) => {
            return emoji.includes(term) ? emoji : null;
          }).filter(Boolean));
        },
        template(value) {
          const imgSrc = Emoji.baseImagePath + value;
          const image = `<img alt="${value}" class="emoji" src="${imgSrc}.png" />`;
          return image + value;
        },
        replace(value) {
          return `:${value}:`;
        },
        index: 1,
      },

      // User mentions
      {
        match: /\B@([\w.]*)$/,
        search(term, callback) {
          const currentBoard = Boards.findOne(Session.get('currentBoard'));
          callback($.map(currentBoard.activeMembers(), (member) => {
            const user = Users.findOne(member.userId);
            return user.username.toLowerCase().indexOf(term.toLowerCase()) === 0 ? user : null;
          }));
        },
        template(user) {
          return user.username;
        },
        replace(user) {
          if (handlers.user)
            return handlers.user(user);
          return `@${user.username}`;
        },
        index: 1,
      },
      // DueDate
      {
        match: /\B\/([\d+\.]*)$/i,
        search(term, callback) {
          var moments = [];
          if (term.length > 0) {
            const m = moment(term, Features.opinions.dates.formats.date, true);
            if (m.isValid()) {
              moments.push(m);
            }
            const justDate = moment().date(term.trim('.'));
            const monthsOffset = moment().date() < justDate.date() ? 0 : 1;
            if (justDate.isValid()) {
              for (var i = 0; i < 2; i++) {
                var d = justDate.clone().month(moment().month()+i + monthsOffset)
                if (d != m) {
                  moments.push(d);
                }
              }
            }
          } else {
            moments = [ moment(), moment().add(1, 'd'), moment().day(5), moment().day(7) ];
          }
          callback(moments);
        },
        template(date) {
          return `<span>${date.format(Features.opinions.dates.formats.date)}&nbsp</span><span class="altName">${date.calendar(null, {
            sameDay: '[today]',
            nextDay: '[tomorrow]',
            nextWeek: 'dddd',
            lastDay: '[yesterday]',
            lastWeek: '[last] dddd',
            sameElse: 'DD/MM/YYYY'
          })}, ${date.endOf('day').fromNow()}</span>`;
        },

        replace(date) {
          if (handlers.date)
            return handlers.date(date.toDate());
          return `/${date.format(Features.opinions.dates.formats.date)}`;
        },
        index: 1
      },
      // Labels
      {
        match: /\B[#№]([\S]*)$/i,
        search(term, callback) {
          const currentBoard = Boards.findOne(Session.get('currentBoard'));
          callback($.map(currentBoard.activeLabels(), (label) => {
            lterm = term.toLowerCase();
            if (label.name.toLowerCase().indexOf(lterm) > -1 ||
                label.color.toLowerCase().indexOf(lterm) > -1) {
              return label;
            }
            return null;
          }));
        },
        template(label) {
          return Blaze.toHTMLWithData(Template.autocompleteLabelLine, {
            label,
            hasNoName: !label.name,
            colorName: label.color,
            labelName: label.shortName || label.color,
          });
        },
        replace(label) {
          if (handlers.label)
            return handlers.label(label);
          return `#${label.shortName}`;
        },
        index: 1,
      },
    ], {
      // When the autocomplete menu is shown we want both a press of both `Tab`
      // or `Enter` to validation the auto-completion. We also need to stop the
      // event propagation to prevent the card from submitting (on `Enter`) or
      // going on the next column (on `Tab`).
      onKeydown(evt, commands) {
        if (evt.keyCode === 9 || evt.keyCode === 13) {
          evt.stopPropagation();
          return commands.KEY_ENTER;
        }
        return null;
      },
    });
  }
};

Blaze.registerHelper('CardAutocompletion', CardAutocompletion);

