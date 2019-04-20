Tinytest.add('Server - Fast Render - fast render supported route', function (test) {
  var expectedFastRenderCollData = [
    [{_id: "two", aa: 20}, {_id: "one", aa: 10}]
  ];

  var data = GetFRData('/the-fast-render-route');
  test.equal(data.collectionData['fast-render-coll'], expectedFastRenderCollData);
});

Tinytest.add('Server - Fast Render - fast render supported route with params', function (test) {
  var expectedFastRenderCollData = [
    [{
      _id: "one", 
      params: {id: 'the-id'},
      queryParams: {aa: "20"}
    }]
  ];

  var data = GetFRData('/the-fast-render-route-params/the-id?aa=20');
  test.equal(data.collectionData['fast-render-coll'], expectedFastRenderCollData);
});

Tinytest.add('Server - Fast Render - no fast render supported route', function (test) {
  var data = GetFRData('/no-fast-render');
  test.equal(data.collectionData, {});
});

Tinytest.add('Server - Fast Render - with group routes', function (test) {
  var expectedFastRenderCollData = [
    [{_id: "two", aa: 20}, {_id: "one", aa: 10}]
  ];

  var data = GetFRData('/fr/have-fr');
  test.equal(data.collectionData['fast-render-coll'], expectedFastRenderCollData);
});