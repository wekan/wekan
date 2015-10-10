// Allowed routes along with theirs default configuration values                                               // 45  // 53
// AccountsTemplates.ROUTE_DEFAULT = {                                                                            // 46  // 54
//   changePwd:      { name: "atChangePwd",      path: "/change-password"},                                       // 47  // 55
//   enrollAccount:  { name: "atEnrollAccount",  path: "/enroll-account"},                                        // 48  // 56
//   ensureSignedIn: { name: "atEnsureSignedIn", path: null},                                                     // 49  // 57
//   forgotPwd:      { name: "atForgotPwd",      path: "/forgot-password"},                                       // 50  // 58
//   resetPwd:       { name: "atResetPwd",       path: "/reset-password"},                                        // 51  // 59
//   signIn:         { name: "atSignIn",         path: "/sign-in"},                                               // 52  // 60
//   signUp:         { name: "atSignUp",         path: "/sign-up"},                                               // 53  // 61
//   verifyEmail:    { name: "atVerifyEmail",    path: "/verify-email"},                                          // 54  // 62
//   resendVerificationEmail: { name: "atResendVerificationEmail", path: "/send-again"}                           // 55  // 63
// };   
// AccountsTemplates.configure({
//   defaultLayout: 'userFormsLayout',
//   defaultContentRegion: 'content',
//   confirmPassword: false,
//   // i18n not finished the ui sentence
//   // showResendVerificationEmailLink: true,
//   enforceEmailVerification: false,
//   sendVerificationEmail: true,
//   enablePasswordChange: true,
//   showForgotPasswordLink: true,
//   onLogoutHook() {
//     const homePage = 'home';
//     FlowRouter.reload();
//     // if (FlowRouter.getRouteName() === homePage) {
//     //   FlowRouter.reload();
//     // } else {
//     //   FlowRouter.go(homePage);
//     // }
//   },
// });
// _.each(['signIn', 'signUp', 'forgotPwd'],
//   (routeName) => AccountsTemplates.configureRoute(routeName));
// AccountsTemplates.configureRoute('resetPwd',{ name: "atResetPwd",       path: "/#/reset-password"});
// AccountsTemplates.configureRoute('verifyEmail',{name: "atVerifyEmail",    path: "/#/verify-email"});
// AccountsTemplates.configureRoute('enrollAccount',{name: "atEnrollAccount",  path: "/#/enroll-account"});


// AccountsTemplates.configure({
//   sendVerificationEmail: true,
//   enforceEmailVerification: false,
// });
// Accounts.config({
//   sendVerificationEmail: false,
//   // enforceEmailVerification: false,
// });

AccountsTemplates.configure({
  defaultLayout: 'userFormsLayout',
  defaultContentRegion: 'content',
  confirmPassword: false,
  // i18n not finished the ui sentence
  // showResendVerificationEmailLink: true,
  enforceEmailVerification: false,
  sendVerificationEmail: true,
  enablePasswordChange: true,
  showForgotPasswordLink: true,
  onLogoutHook() {
    const homePage = 'home';
    FlowRouter.reload();
    // if (FlowRouter.getRouteName() === homePage) {
    //   FlowRouter.reload();
    // } else {
    //   FlowRouter.go(homePage);
    // }
  },
});

 _.each(['signIn', 'signUp', 'resetPwd', 'forgotPwd', 'verifyEmail', 'enrollAccount'],
   (routeName) => AccountsTemplates.configureRoute(routeName));

 // We maintain a list of redirections to ensure that we don't break old URLs
// when we change our routing scheme.
const redirections = {
  '/boards': '/',
  '/boards/:id/:slug': '/b/:id/:slug',
  '/boards/:id/:slug/:cardId': '/b/:id/:slug/:cardId',
  // '/#/enroll-account/:id': '/enroll-account/:id',
  // '/#/reset-password/:id': '/reset-password/:id',
  // '/#/verify-email/:id': '/verify-email/:id',
};

_.each(redirections, (newPath, oldPath) => {
  FlowRouter.route(oldPath, {
    triggersEnter: [(context, redirect) => {
      redirect(FlowRouter.path(newPath, context.params));
    }],
  });
});