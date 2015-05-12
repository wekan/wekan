Template.headerUserBar.events({
  'click .js-sign-in': Popup.open('signup'),
  'click .js-log-in': Popup.open('login'),
  'click .js-open-header-member-menu': Popup.open('memberMenu')
});
