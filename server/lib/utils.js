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

  resetPassword: {
    subject: function(user) {
       return "重置您在 " + Accounts.emailTemplates.siteName + " 的密码"; 
    },
    text: function(user, url) {
      var greeting = (user.profile && user.profile.name) ?
            ("Hello " + user.profile.name + ",") : "Hello,";
      return greeting + "\n"
        + "\n"
        + "点击下面的链接重置您的密码.\n"
        + "\n"
        + url + "\n"
        + "\n"
        + "谢谢.\n";
    }
  },
  verifyEmail: {
    subject: function(user) {
      return "验证您在 " + Accounts.emailTemplates.siteName + " 的账号"; 
    },
    text: function(user, url) {
      var greeting = (user.profile && user.profile.name) ?
            ("Hello " + user.profile.name + ",") : "Hello,";
      return greeting + "\n"
        + "\n"
        + "点击下面的链接验证您的邮箱.\n"
        + "\n"
        + url + "\n"
        + "\n"
        + "谢谢.\n";
    }
  },
  enrollAccount: {
    subject: function(user) {
      return "已经为您在 " + Accounts.emailTemplates.siteName + "创建了一个账户 " ;
    },
    text: function(user, url) {
      var greeting = (user.profile && user.profile.name) ?
            ("Hello " + user.profile.name + ",") : "很高兴见到你,";
      return greeting + "\n"
        + "\n"
        + "要使用该服务, 点击下面的链接\n"
        + "\n"
        + url + "\n"
        + "\n"
        + "谢谢.\n";
    }
  }
};