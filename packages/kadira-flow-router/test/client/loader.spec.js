Router = FlowRouter.Router;


Tinytest.add('Client - import page.js', function (test) {
  test.isTrue(!!Router.prototype._page);
  test.isFalse(!!window.page);
});


Tinytest.add('Client - import query.js', function (test) {
  test.isTrue(!!Router.prototype._qs);
});


Tinytest.add('Client - create FlowRouter', function (test) {
  test.isTrue(!!FlowRouter);
});
