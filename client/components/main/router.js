Router.route('/', {
  name: 'Home',
  redirectLoggedInUsers: true,
  authenticated: true
});
