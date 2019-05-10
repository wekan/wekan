Meteor.publish('foo', function () {
  this.ready();
});

Meteor.publish('fooNotReady', function () {
});

Meteor.publish('bar', function () {
  this.ready();
});

// use this only to test global subs
Meteor.publish('baz', function () {
  this.ready();
});

Meteor.publish('bazNotReady', function () {
});

Meteor.publish('readyness', function (doIt) {
  if(doIt) {
    this.ready();
  }
});

InjectData = Package['meteorhacks:inject-data'].InjectData;
var urlResolve = Npm.require('url').resolve;
GetFRData = function GetFRData(path) {
  var url = urlResolve(process.env.ROOT_URL, path);
  // FastRender only servers if there is a accept header with html in it
  var options  = {
    headers: {'accept': 'html'}
  };
  var res = HTTP.get(url, options);

  var encodedData = res.content.match(/data">(.*)<\/script/)[1];
  return InjectData._decode(encodedData)['fast-render-data'];
}