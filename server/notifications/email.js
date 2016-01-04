Meteor.startup(() => {
  Notifications.subscribe('email', (user, title, description, params) => {
    // add quote to make titles easier to read in email text
    const quoteParams = _.clone(params);
    ['card', 'list', 'oldList', 'board', 'comment'].forEach((key) => {
      if (quoteParams[key]) quoteParams[key] = `"${params[key]}"`;
    });
    const lang = user.getLanguage();
    const subject = TAPi18n.__(title, params, lang);
    const text = `${params.user} ${TAPi18n.__(description, quoteParams, lang)}\n\n---\n${params.url}`;
    try {
      Email.send({
        to: user.emails[0].address,
        from: Accounts.emailTemplates.from,
        subject,
        text,
      });
    } catch (e) {
      return;
    }
  });
});
