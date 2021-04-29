wekan-cfs-access-point [![Build Status](https://travis-ci.org/CollectionFS/Meteor-cfs-access-point.png?branch=master)](https://travis-ci.org/CollectionFS/Meteor-cfs-access-point)
=========================

This is a Meteor package used by
[CollectionFS](https://github.com/zcfs/Meteor-CollectionFS).

You don't need to manually add this package to your app. It is added when you
add the `wekan-cfs-standard-packages` package. You could potentially use your own access point
package instead.

## Define a URL for Collection Listing

To define a URL that accepts GET requests and returns a list of published
files in a FS.Collection:

```js
Images = new FS.Collection("images", {
 stores: [myStore]
});

FS.HTTP.publish(Images, function () {
  // `this` provides a context similar to Meteor.publish
  return Images.find();
});
```

The URL will be '/cfs/record/images', where the `cfs` piece is configurable
using the `FS.HTTP.setBaseUrl` method.

## API Documentation

[Here](api.md)
