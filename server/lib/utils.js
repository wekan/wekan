allowIsBoardAdmin = function(userId, board) {
  const admins = _.pluck(_.where(board.members, {isAdmin: true}), 'userId');
  return _.contains(admins, userId);
};

allowIsBoardMember = function(userId, board) {
  return _.contains(_.pluck(board.members, 'userId'), userId);
};

allowIsOrgAdmin = function(userId, org) {
  let admins = _.pluck(_.where(org.members, {isAdmin: true}), 'userId');
  return _.contains(admins, userId);
};

allowIsOrgMember = function(userId, org) {
  return _.contains(_.pluck(org.members, 'userId'), userId);
};
Meteor.startup(() => {
  AccountsServer.prototype.urls = {                                                                                  // 3
    resetPassword: function (token) {                                                                                // 4
      return Meteor.absoluteUrl('reset-password/' + token);                                                        // 5
    },                                                                                                               //
                                                                                                                     //
    verifyEmail: function (token) {                                                                                  // 8
      return Meteor.absoluteUrl('verify-email/' + token);                                                          // 9
    },                                                                                                               //
                                                                                                                     //
    enrollAccount: function (token) {                                                                                // 12
      return Meteor.absoluteUrl('enroll-account/' + token);                                                        // 13
    }                                                                                                                //
  };      
});



Accounts.emailTemplates = {
  from: "思奇<smoch_cn@126.com>",  
  siteName: '思奇', 
  siteDescription: '简单实时的清单管理云平台', 

  resetPassword: {
    subject: function(user) {
       return "重置您在 " + Accounts.emailTemplates.siteName + " 的密码"; 
    },
    text: function(user, url) {
      var user_name = (user.profile && user.profile.fullname) ?
             (user.profile.fullname) : user.username? (user.username ):'';
      var greeting  = "Hello " + user_name + ",";
      return greeting + "\n"
        + "\n"
        + "点击下面的链接重置您的密码.\n"
        + "\n"
        + url + "\n"
        + "\n"
        + "谢谢.\n"
        + "\n"
        + Accounts.emailTemplates.siteName + " - " + Accounts.emailTemplates.siteDescription +".\n";
    }
  },
  verifyEmail: {
    subject: function(user) {
      return "验证您在 " + Accounts.emailTemplates.siteName + " 的账号"; 
    },
    text: function(user, url) {
      var greeting = (user.username) ?
            ("Hello " + user.username + ",") : "Hello,";
      return greeting + "\n"
        + "\n"
        + "点击下面的链接验证您的邮箱.\n"
        + "\n"
        + url + "\n"
        + "\n"
        + "谢谢.\n"
        + "\n"
        + Accounts.emailTemplates.siteName + " - " + Accounts.emailTemplates.siteDescription +".\n";
    }
  },
  enrollAccount: {
    subject: function(user) {
      var user_name = (Meteor.user().profile && Meteor.user().profile.fullname) ?
             (Meteor.user().profile.fullname) : Meteor.user().username? (Meteor.user().username ):Meteor.user().emails[0].address;
      return user_name + "邀请您免费使用最简单最实时的清单管理云平台 - " + Accounts.emailTemplates.siteName ;
    },
    text: function(user, url) {
      var user_name = (user.profile && user.profile.fullname) ?
             (user.profile.fullname) : user.username? (user.username ):'';
      var greeting  = "Hello " + user_name + ",很高兴见到您,";
      var inviter_name = (Meteor.user().profile && Meteor.user().profile.fullname) ?
             (Meteor.user().profile.fullname) : Meteor.user().username? (Meteor.user().username ):Meteor.user().emails[0].address;
      
      return greeting + "\n"
        + "很高兴见到您\n"
        + "\n"
        + inviter_name + "邀请您免费使用最简单最实时的清单管理云平台 - " + Accounts.emailTemplates.siteName +'。'
        + "\n"
        + "您只需要点击下面链接后设置密码，即可免费使用最简单最实时的清单管理云平台 - \n"+ Accounts.emailTemplates.siteName
        + "\n"
        + Accounts.emailTemplates.siteName + "能让您和团队成员轻松创建和管理看板、清单列表、卡片，操作简单，实时协作，让您和团队的清单协作更具效率、更酷！\n"
        + "\n"
        + "要使用该服务, 点击下面的链接\n"
        + "\n"
        + url + "\n"
        + "\n"
        + "谢谢.\n"
        + "\n"
        + Accounts.emailTemplates.siteName + " - " + Accounts.emailTemplates.siteDescription +".\n";
    }
  }
};