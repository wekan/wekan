// we need get absoluteUrl of board and cards for email content,
// define same as /client/config/router.js
Meteor.startup(() => {
  FlowRouter.route('/b/:id/:slug', {
    name: 'board',
  });

  FlowRouter.route('/b/:boardId/:slug/:cardId', {
    name: 'card',
  });

  FlowRouter.route('/', {
    name: 'home',
  });

  FlowRouter.route('/shortcuts', {
    name: 'shortcuts',
  });
});
