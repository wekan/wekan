/* global FS, _storageAdapters:true, EventEmitter */

// #############################################################################
//
// STORAGE ADAPTER
//
// #############################################################################

_storageAdapters = {};

FS.StorageAdapter = function(name, options, api) {
  var self = this;

  // Check the api
  if (typeof api === 'undefined') {
    throw new Error('FS.StorageAdapter please define an api');
  }

  // store reference for easy lookup by name
  if (typeof _storageAdapters[name] !== 'undefined') {
    throw new Error('Storage name already exists: "' + name + '"');
  } else {
    _storageAdapters[name] = self;
  }

  // extend self with options and other info
  FS.Utility.extend(this, options || {}, {
    name: name
  });

  // XXX: TODO, add upload feature here...
  // we default to ddp upload but really let the SA like S3Cloud overwrite to
  // implement direct client to s3 upload

};

FS.StorageAdapter.prototype = new EventEmitter();
