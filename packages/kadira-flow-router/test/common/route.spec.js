Router = FlowRouter.Router;

Tinytest.addAsync('Common - Route - expose route options', function (test, next) {
  var pathDef = "/" + Random.id();
  var name = Random.id();
  var data = {aa: 10};
  
  FlowRouter.route(pathDef, {
    name: name,
    someData: data
  });

  test.equal(FlowRouter._routesMap[name].options.someData, data);
  next();
});
