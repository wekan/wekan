import { FastRender } from 'meteor/staringatlights:fast-render';

FastRender.onAllRoutes(function() {
  this.subscribe('boards');
});

FastRender.route('/b/:id/:slug', function({ id }) {
  this.subscribe('board', id);
});
