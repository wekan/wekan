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
