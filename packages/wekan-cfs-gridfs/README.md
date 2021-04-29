wekan-cfs-gridfs
=========================

NOTE: This package is under active development right now (2014-3-31). It has
bugs and the API may continue to change. Please help test it and fix bugs,
but don't use in production yet.

A Meteor package that adds [GridFS](http://docs.mongodb.org/manual/core/gridfs/) file storage for
[CollectionFS](https://github.com/zcfs/Meteor-CollectionFS). When you
use this storage adapter, file data is stored in chunks in your MongoDB database.

## Installation

Install using Meteorite. When in a Meteor app directory, enter:

```
$ meteor add wekan-cfs-gridfs
```

## Usage

```js
var imageStore = new FS.Store.GridFS("images", {
  mongoUrl: 'mongodb://127.0.0.1:27017/test/', // optional, defaults to Meteor's local MongoDB
  mongoOptions: {...},  // optional, see note below
  transformWrite: myTransformWriteFunction, //optional
  transformRead: myTransformReadFunction, //optional
  maxTries: 1, // optional, default 5
  chunkSize: 1024*1024  // optional, default GridFS chunk size in bytes (can be overridden per file).
                        // Default: 2MB. Reasonable range: 512KB - 4MB
});

Images = new FS.Collection("images", {
  stores: [imageStore]
});
```

More control over the MongoDB connection is available by specifying [MongoClient.connect options](http://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html#mongoclient-connect-options) as a `mongoOptions` attribute in the options object on the constructor.

Refer to the [CollectionFS](https://github.com/zcfs/Meteor-CollectionFS)
package documentation for more information.

## API

[For Users](https://github.com/zcfs/Meteor-CollectionFS/blob/master/packages/gridfs/api.md)

[For Contributors](https://github.com/zcfs/Meteor-CollectionFS/blob/master/packages/gridfs/internal.api.md)

