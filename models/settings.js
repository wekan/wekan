Settings = new Mongo.Collection('settings');

Settings.attachSchema(new SimpleSchema({
  disableRegistration: {
    type: Boolean,
  },
  disableCardDeleting: {
    type: Boolean,
  },
  disableCardRestoring: {
    type: Boolean,
  },
  'mailServer.username': {
    type: String,
    optional: true,
  },
  'mailServer.password': {
    type: String,
    optional: true,
  },
  'mailServer.host': {
    type: String,
    optional: true,
  },
  'mailServer.port': {
    type: String,
    optional: true,
  },
  'mailServer.enableTLS': {
    type: Boolean,
    optional: true,
  },
  'mailServer.from': {
    type: String,
    optional: true,
  },
  createdAt: {
    type: Date,
    denyUpdate: true,
  },
  modifiedAt: {
    type: Date,
  },
}));
Settings.helpers({
  mailUrl () {
    if (!this.mailServer.host) {
      return null;
    }
    const protocol = this.mailServer.enableTLS ? 'smtps://' : 'smtp://';
    if (!this.mailServer.username && !this.mailServer.password) {
      return `${protocol}${this.mailServer.host}:${this.mailServer.port}/`;
    }
    return `${protocol}${this.mailServer.username}:${encodeURIComponent(this.mailServer.password)}@${this.mailServer.host}:${this.mailServer.port}/`;
  },
});
Settings.allow({
  update(userId) {
    const user = Users.findOne(userId);
    return user && user.isAdmin;
  },
});

Settings.before.update((userId, doc, fieldNames, modifier) => {
  modifier.$set = modifier.$set || {};
  modifier.$set.modifiedAt = new Date();
});

if (Meteor.isServer) {
  Meteor.startup(() => {
    const setting = Settings.findOne({});
    if(!setting){
      const now = new Date();
      const domain = process.env.ROOT_URL.match(/\/\/(?:www\.)?(.*)?(?:\/)?/)[1];
      const from = `Wekan <wekan@${domain}>`;
      const defaultSetting = {
        disableRegistration: false, disableCardDeleting: false, disableCardRestoring: false, mailServer: {
          username: '', password: '', host: '', port: '', enableTLS: false, from,
        }, createdAt: now, modifiedAt: now,
      };
      Settings.insert(defaultSetting);
    }
    const newSetting = Settings.findOne();
    if (!process.env.MAIL_URL && newSetting.mailUrl())
      process.env.MAIL_URL = newSetting.mailUrl();
    Accounts.emailTemplates.from = process.env.MAIL_FROM ? process.env.MAIL_FROM : newSetting.mailServer.from;
  });
  Settings.after.update((userId, doc, fieldNames) => {
    // assign new values to mail-from & MAIL_URL in environment
    if (_.contains(fieldNames, 'mailServer') && doc.mailServer.host) {
      const protocol = doc.mailServer.enableTLS ? 'smtps://' : 'smtp://';
      if (!doc.mailServer.username && !doc.mailServer.password) {
        process.env.MAIL_URL = `${protocol}${doc.mailServer.host}:${doc.mailServer.port}/`;
      } else {
        process.env.MAIL_URL = `${protocol}${doc.mailServer.username}:${encodeURIComponent(doc.mailServer.password)}@${doc.mailServer.host}:${doc.mailServer.port}/`;
      }
      Accounts.emailTemplates.from = doc.mailServer.from;
    }
  });

  function getRandomNum (min, max) {
    const range = max - min;
    const rand = Math.random();
    return (min + Math.round(rand * range));
  }

  function sendInvitationEmail (_id){
    const icode = InvitationCodes.findOne(_id);
    const author = Users.findOne(Meteor.userId());
    try {
      const params = {
        email: icode.email,
        inviter: Users.findOne(icode.authorId).username,
        user: icode.email.split('@')[0],
        icode: icode.code,
        url: FlowRouter.url('sign-up'),
      };
      const lang = author.getLanguage();
      Email.send({
        to: icode.email,
        from: Accounts.emailTemplates.from,
        subject: TAPi18n.__('email-invite-register-subject', params, lang),
        text: TAPi18n.__('email-invite-register-text', params, lang),
      });
    } catch (e) {
      InvitationCodes.remove(_id);
      throw new Meteor.Error('email-fail', e.message);
    }
  }

  Meteor.methods({
    sendInvitation(emails, boards) {
      check(emails, [String]);
      check(boards, [String]);
      const user = Users.findOne(Meteor.userId());
      if(!user.isAdmin){
        throw new Meteor.Error('not-allowed');
      }
      emails.forEach((email) => {
        if (email && SimpleSchema.RegEx.Email.test(email)) {
          const code = getRandomNum(100000, 999999);
          InvitationCodes.insert({code, email, boardsToBeInvited: boards, createdAt: new Date(), authorId: Meteor.userId()}, function(err, _id){
            if (!err && _id) {
              sendInvitationEmail(_id);
            } else {
              throw new Meteor.Error('invitation-generated-fail', err.message);
            }
          });
        }
      });
    },
  });
}
