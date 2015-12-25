Meteor.startup(() => {
  // XXX: print to console, for debug purpose only
  // Notifications.addSender('debug', (user, subject, text) => {
  //  console.log(`${user.getName()}\n${subject}\n${text}`);
  // });

  // send notification via email
  if (process.env.MAIL_URL && Email) {
    Notifications.addSender('email', (user, subject, text) => {
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
  }

  // XXX: more notification services can be added here

});
