// cache the email text in a queue, and send them in a batch
Meteor.startup(() => {
  Notifications.subscribe('cachedEmail', (user, title, description, params) => {
    // add quote to make titles easier to read in email text
    const quoteParams = _.clone(params);
    ['card', 'list', 'oldList', 'board', 'comment'].forEach((key) => {
      if (quoteParams[key]) quoteParams[key] = `"${params[key]}"`;
    });

    const text = `${params.user} ${TAPi18n.__(description, quoteParams, user.getLanguage())}\n${params.url}`;
    user.addEmailCache(text);

    const userId = user._id;
    Meteor.setTimeout(() => {
      const user = Users.findOne(userId);

      const emailCache = user.getEmailCache();
      if (emailCache.length === 0) return;

      const text = emailCache.join('\n\n');
      user.clearEmailCache();

      try {
        Email.send({
          to: user.emails[0].address,
          from: Accounts.emailTemplates.from,
          subject : TAPi18n.__('act-activity-notify', {}, user.getLanguage()),
          text,
        });
      } catch (e) {
        return;
      }
    }, 30000, user._id);
  });
});
