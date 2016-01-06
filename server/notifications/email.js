// cache each user's email text in a queue, and flush them in single email
Meteor.startup(() => {
  Notifications.subscribe('cachedEmail', (user, title, description, params) => {
    // add quote to make titles easier to read in email text
    const quoteParams = _.clone(params);
    ['card', 'list', 'oldList', 'board', 'comment'].forEach((key) => {
      if (quoteParams[key]) quoteParams[key] = `"${params[key]}"`;
    });

    const text = `${params.user} ${TAPi18n.__(description, quoteParams, user.getLanguage())}\n${params.url}`;
    user.addEmailCache(text);

    // unlike setTimeout(func, delay, args),
    // Meteor.setTimeout(func, delay) does not accept args :-(
    // so we pass userId with closure
    const userId = user._id;
    Meteor.setTimeout(() => {
      const user = Users.findOne(userId);

      // for each user, in the timed period, only the first call will get the cached content,
      // other calls will get nothing
      const emailCache = user.getEmailCache();
      if (emailCache.length === 0) return;

      // merge the cached content into single email and flush
      const text = emailCache.join('\n\n');
      user.clearEmailCache();

      try {
        Email.send({
          to: user.emails[0].address,
          from: Accounts.emailTemplates.from,
          subject: TAPi18n.__('act-activity-notify', {}, user.getLanguage()),
          text,
        });
      } catch (e) {
        return;
      }
    }, 30000);
  });
});
