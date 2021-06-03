wekan-cfs-filesystem
=========================

NOTE: This package is under active development right now (2014-3-31). It has
bugs and the API may continue to change. Please help test it and fix bugs,
but don't use in production yet.

A Meteor package that adds local server filesystem storage for
[CollectionFS](https://github.com/zcfs/Meteor-CollectionFS). When you
use this storage adapter, file data is stored in a directory of your choosing
on the same server on which your Meteor app is running.

## Installation

Install using Meteorite. When in a Meteor app directory, enter:

```
$ meteor add wekan-cfs-filesystem
```

## Important Note

Note that using this Storage Adapter on the free Meteor deployment servers on  `*.meteor.com` will cause a reset of files at every code deploy. You may want to have a look at the [GridFS Storage Adapter](https://github.com/zcfs/Meteor-CollectionFS/tree/devel/packages/gridfs) for persistent file storage.

## Usage

```js
var imageStore = new FS.Store.FileSystem("images", {
  path: "~/app-files/images", //optional, default is "/cfs/files" path within app container
  transformWrite: myTransformWriteFunction, //optional
  transformRead: myTransformReadFunction, //optional
  maxTries: 1 //optional, default 5
});

Images = new FS.Collection("images", {
  stores: [imageStore]
});
```

Refer to the [CollectionFS](https://github.com/zcfs/Meteor-CollectionFS)
package documentation for more information.
