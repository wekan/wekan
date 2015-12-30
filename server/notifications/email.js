Meteor.startup(() => {
  Notifications.subscribe('email', (user, title, description, params) => {
    try {
      // add quote to make titles easier to read in email text
      const quoteParams = _.clone(params);
      ['card', 'list', 'oldList', 'board', 'comment'].forEach((key) => {
        if (quoteParams[key]) quoteParams[key] = `"${params[key]}"`;
      });

      const lang = user.getLanguage();
      Email.send({
        to: user.emails[0].address,
        from: Accounts.emailTemplates.from,
        subject: TAPi18n.__(title, params, lang),
        text: `${params.user} ${TAPi18n.__(description, quoteParams, lang)}\n\n---\n${params.url}`,
      });
    } catch (e) {
      return;
    }
  });
});
