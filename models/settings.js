Settings = new Mongo.Collection('settings');

Settings.attachSchema(new SimpleSchema({
  strict: {
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
  'mailServer.from': {
    type: String,
    optional: true,
    defaultValue: 'Kanban',
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
    const mailUrl = `smtp://${this.mailServer.username}:${this.mailServer.password}@${this.mailServer.host}:${this.mailServer.port}/`;
    return mailUrl;
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
      const defaultSetting = {strict: false, mailServer: {
        username: '', password:'', host: '', port:'', from: '',
      }, createdAt: now, modifiedAt: now};
      Settings.insert(defaultSetting);
    }
    const newSetting = Settings.findOne();
    process.env.MAIL_URL = newSetting.mailUrl();
    Accounts.emailTemplates.from = newSetting.mailServer.from;
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
            if(!err && _id) sendInvitationEmail(_id);
          });
        }
      });
    },
  });
}
