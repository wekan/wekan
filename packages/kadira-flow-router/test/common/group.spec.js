Tinytest.add('Common - Group - expose group options', function (test) {
  var pathDef = "/" + Random.id();
  var name = Random.id();
  var data = {aa: 10};
  var layout = 'blah';

  var group = FlowRouter.group({
    name: name,
    prefix: '/admin',
    layout: layout,
    someData: data
  });

  test.equal(group.options.someData, data);
  test.equal(group.options.layout, layout);
});
