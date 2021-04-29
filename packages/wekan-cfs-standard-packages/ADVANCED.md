This is advanced information useful for anyone who contributes to CollectionFS
or wants to make their own storage adapter.

## Goals

* Scale horizontally and vertically
* Secure file operations and file serving
* Limit memory consumption and stream where possible
* Use queues to provide synchronous execution of tasks
* Reactivity
* Uploads and downloads are cancelable and resumable

## All Packages

* wekan-cfs-standard-packages (implies some component packages)
  * wekan-cfs-base-package
  * wekan-cfs-file
  * wekan-cfs-collection
  * wekan-cfs-collection-filters
  * wekan-cfs-access-point
  * wekan-cfs-worker
  * wekan-cfs-upload-http
* wekan-cfs-graphicsmagick
* wekan-cfs-ui
* wekan-cfs-filesystem
* wekan-cfs-gridfs
* wekan-cfs-s3
* wekan-cfs-dropbox

## Collections

Various MongoDB collections are created by CollectionFS and related packages.
Here's an explanation of what they are named and what their documents look like.

### cfs.collectionName.filerecord (FS.Collection)

```js
{
  _id: "",
  copies: {
    storeName: {
      key: String, // a string that the store generates, understands, and uses to uniquely identify the file in the backing store
      name: String, // as saved in this store, potentially changed by beforeWrite
      type: String, // as saved in this store, potentially changed by beforeWrite
      size: Number, // as saved in this store, in bytes, potentially changed by beforeWrite
      createdAt: Date, // when first saved in this store
      updatedAt: Date // when last saved in this store
    }
  },
  original: {
    name: String, // of the originally uploaded file
    type: String, // of the originally uploaded file
    size: Number, // of the originally uploaded file, in bytes
    updatedAt: Date // of the originally uploaded file
  },
  failures: {
    copies: {
      storeName: {
        count: Number,
        firstAttempt: Date,
        lastAttempt: Date,
        doneTrying: Boolean
      }
    }
  }
}
```

The `original` object represents the file that was uploaded. Each object under `copies`, represents the file that was stored, keyed by store name.

The original file isn’t technically stored anywhere permanently, so the `original` object can be generally ignored. It’s there for reference in case you want to see any of that info.

The objects under the `copies` object represent the copies of the original that were actually saved in the backing stores. The info here might be the same as the original file, or it might be different if your store has a `beforeWrite` or `transformWrite` function that changes the stored file's properties.

You can change any of the info in the `copies` object using the setter methods on FS.File instances, like fileObj.name('NewName.gif', {store: 'blobs'}), which would change the name of the file stored in the blobs store. Of course you wouldn't want to change `type` or `size` unless you were also transforming the binary file data itself. The important thing is not to touch the `key` property since that's used by the store to retrieve the file data. The rest is metadata that you're free to change.

### cfs_gridfs...

Created by the GridFS storage adapter. The `cfs_gridfs.<storeName>.files` and `cfs_gridfs.<storeName>.chunks` collections match the MongoDB GridFS spec.

### _tempstore

When files are first uploaded or inserted on the server, we save the original to a temporary store. This is a place where data can be stored until we have all the chunks we need and we are able to successfully save the file to all of the defined permanant stores. The temporary store may create one or more collections with `_tempstore` in the name. In general, it is relatively safe to clear these collections at any time. The worst you will do is cause a currently uploading or currently storing file to fail.

## Creating a Storage Adapter

To create a storage adapter, define an object constructor function that takes
a name as a first argument and any additional necessary settings as additional
arguments. Make it return an instance of FS.StorageAdapter, passing your API to
the FS.StorageAdapter constructor function. Here's an example:

```js
FS.MyStore = function(name, options) {
  // Prep some variables here

  return new FS.StorageAdapter(name, {}, {
    typeName: 'storage.myadapter',
    get: function(identifier, callback) {
      // Use identifier to retrieve a Buffer and pass it to callback
    },
    getBytes: function(identifier, start, end, callback) {
      // Use identifier to retrieve a Buffer containing only
      // the bytes from start to end, and pass it to callback.
      // If this is impossible, don't include a getBytes property.
    },
    put: function(id, fileKey, buffer, options, callback) {
      // Store the buffer and then call the callback, passing it
      // an identifier that will later be the first argument of the
      // other API functions. The identifier will likely be the
      // fileKey, the id, or some altered version of those.
    },
    remove: function(identifier, callback) {
      // Delete the data for the file identified by identifier
    },
    watch: function(callback) {
      // If you can watch file data, initialize a watcher and then call
      // callback whenever a file changes. Refer to the filesystem
      // storage adapter for an example. If you can't watch files, then
      // throw an error stating that the "sync" option is not supported.
    },
    init: function() {
      // Perform any initialization
    }
  });
};
```

`getBytes` and `init` are optional. The others are required, but you should throw
an error from `watch` if you can't watch files. Your `put` function should check
for an `overwrite` option. If it's true, save the data even if you've already
saved for the given `id` or `fileKey`. If not, you may alter the `fileKey` as
necessary to prevent overwriting and then pass the altered `fileKey` to the
callback.

By convention, any official stores should be in the `FS` namespace
and end with the word "Store".

## Architecture

```
Client <---- (ddp/http) --- | CFS access point |
                            |  Security layer  |
                            | Storage adapters |
                              |    |    |    |
                Mongo–––––––––O    |    |    |
                Local––––––––––––––O    |    |
                Fileserver––––––––––––––O    |
                External server––––––––––––––O
```

## The Upload Process (DDP)

Here's a closer look at what happens when a file is uploaded.

### Step 1: Insert

All uploads initiate on a client. If a file is inserted on the server, the
data is already on the server, so no upload process is necessary.

An upload begins when you call `insert()` on an `FS.Collection` instance. The
`insert` method inserts the file's metadata into the underlying collection on
the client. If that is successful, it immediately calls `put()` on the `FS.File`
instance. This in turn calls `FS.uploadQueue.uploadFile()`, which kicks off
the data upload.

### Step 2: Transfer

The upload transfer queue's `uploadFile` method uses the file size and a
pre-defined chunk size to determine how many chunks the file will be broken into.
It then adds one task to its PowerQueue instance per chunk. Each chunk task does
the following:

1. Extracts the necessary subset (chunk) of data from the file.
2. Passes the data chunk to a server method over DDP.
3. Marks the chunk uploaded in a client-only tracking collection if the server
method reports no errors.

PowerQueue's reactive methods are used to report total progress for all current
uploads, but the custom client-only tracking collection is used to report progress
per file. (TODO: update this after PQ sub-queues are done and the transfer
queues are updated to use them)

### Step 3: Receive

Each data chunk is received by a DDP access point (a server method defined in
accessPoint.js). This method does the following:

1. Checks that incoming arguments are of the correct type.
2. If the `insecure` package is not used, checks the `insert` allow and deny
functions. If insertion is denied, the method throws an access denied error.
3. Passes the data chunk to the temporary store.
4. If the temporary store reports that it now has all chunks for the file,
retrieves the complete file from the temporary store and calls `fsFile.put()`
to begin the process of saving it to each of the defined stores.

### Step 4: Temporarily Store

The temporary store is managed by the `FS.TempStore` object. When the server method
calls `FS.TempStore.saveChunk()`, the chunk data is saved to a randomly named
temporary file in the server operating system's default temporary directory.
The path to this file is saved in the `chunks` array on the corresponding FS.File.
(The `chunks` property is available on an FS.File instance only on the server
because it is used strictly for server-side tracking.)

`saveChunk` calls a callback after saving the chunk. The second argument of
this callback is `true` if all chunks for the given file are now saved in the
temporary store (i.e., all chunks were uploaded so all file data is now present
on the server).

Using a temporary filesystem store like this ensures that chunks remain available
after an app or server restart, allowing the client to resume uploads. Chunks
are saved to the app server filesystem rather than GridFS in your MongoDB because it
is theoretically faster, especially when the mongo database is on a separate server.

NOTE: The first version of temp storage appended/wrote to a single temp file
per uploaded file, but there are issues with file locking and writing to
specific start-points in an existing file. By switching to 1 chunk = 1 temp
file, we have the freedom to have parallel chunk uploads in any order without
fear of file lock contention, and it's still really fast.

### Step 5: Store

After the server method calls `put()` on the complete uploaded file, this in
turn calls `saveCopies()` on its associated `FS.Collection` instance. `saveCopies`
loops through each copy/store you defined in the options and saves the file
to that store. If you defined a `beforeSave` function for the store, the file
passes through that function first. If a `beforeSave` returns `false`, this is
recorded in the `FS.File` instance and the file will never be saved to that store.

* If the store reports that it successfully saved the file, a reference string,
returned by the store, is stored in `fsFile.copies[storeName]`. This string will
be anything that the store wants to return, so long as it can be used later to
retrieve that same file.
* If the store reports that it was not able to save the file, the error is logged
in the `FS.File` instance. If the total number of failures exceeds the `maxTries`
setting for the store, a `doneTrying` flag is set to `true`. When `doneTrying`
is `false`, the FileWorker may attempt to save again later. (See the next step.)

### Step 6: Retry

The `FileWorker` (in fileWorker.js), searches all `FS.Collection` every 5
seconds (not configurable right now but could be) to see if there are any
storage failures that meet the criteria to be
retried (namely, if failure count > 0 and doneTrying is false). The file worker
then calls `saveCopies` for each file that is identified. (See the previous step.)

The `FileWorker` also does one more thing. If it identifies any files that have
been successfully saved to all defined stores, or that have failed to save the
maximum number of times for a store, or that won't be saved to a store because
`beforeSave` returned `false`, then it tells `FS.TempStore` to delete all the
temporary chunks for that file. They are no longer needed.

Note: One the temporary chunks are deleted, the "original" file will be no longer
available if all stores are modifying the original using a `beforeSave` function.

## The Download Process (DDP)

Here's a closer look at what happens when a file is downloaded.

TODO Explain with similar layout to "The Upload Process" section

## Wish List

* Dynamic file manipulation
* Paste box upload component
