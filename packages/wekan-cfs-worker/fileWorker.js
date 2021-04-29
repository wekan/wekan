//// TODO: Use power queue to handle throttling etc.
//// Use observe to monitor changes and have it create tasks for the power queue
//// to perform.

/**
 * @public
 * @type Object
 */
FS.FileWorker = {};

/**
 * @method FS.FileWorker.observe
 * @public
 * @param {FS.Collection} fsCollection
 * @returns {undefined}
 *
 * Sets up observes on the fsCollection to store file copies and delete
 * temp files at the appropriate times.
 */
FS.FileWorker.observe = function(fsCollection) {

  // Initiate observe for finding newly uploaded/added files that need to be stored
  // per store.
  FS.Utility.each(fsCollection.options.stores, function(store) {
    var storeName = store.name;
    fsCollection.files.find(getReadyQuery(storeName), {
      fields: {
        copies: 0
      }
    }).observe({
      added: function(fsFile) {
        // added will catch fresh files
        FS.debug && console.log("FileWorker ADDED - calling saveCopy", storeName, "for", fsFile._id);
        saveCopy(fsFile, storeName);
      },
      changed: function(fsFile) {
        // changed will catch failures and retry them
        FS.debug && console.log("FileWorker CHANGED - calling saveCopy", storeName, "for", fsFile._id);
        saveCopy(fsFile, storeName);
      }
    });
  });

  // Initiate observe for finding files that have been stored so we can delete
  // any temp files
  fsCollection.files.find(getDoneQuery(fsCollection.options.stores)).observe({
    added: function(fsFile) {
      FS.debug && console.log("FileWorker ADDED - calling deleteChunks for", fsFile._id);
      try {
        FS.TempStore.removeFile(fsFile);
      } catch(err) {
        console.error(err);
      }
    }
  });

  // Initiate observe for catching files that have been removed and
  // removing the data from all stores as well
  fsCollection.files.find().observe({
    removed: function(fsFile) {
      FS.debug && console.log('FileWorker REMOVED - removing all stored data for', fsFile._id);
      //remove from temp store
      FS.TempStore.removeFile(fsFile);
      //delete from all stores
      FS.Utility.each(fsCollection.options.stores, function(storage) {
        storage.adapter.remove(fsFile);
      });
    }
  });
};

/**
 *  @method getReadyQuery
 *  @private
 *  @param {string} storeName - The name of the store to observe
 *
 *  Returns a selector that will be used to identify files that
 *  have been uploaded but have not yet been stored to the
 *  specified store.
 *
 *  {
 *    uploadedAt: {$exists: true},
 *    'copies.storeName`: null,
 *    'failures.copies.storeName.doneTrying': {$ne: true}
 *  }
 */
function getReadyQuery(storeName) {
  var selector = {uploadedAt: {$exists: true}};
  selector['copies.' + storeName] = null;
  selector['failures.copies.' + storeName + '.doneTrying'] = {$ne: true};
  return selector;
}

/**
 *  @method getDoneQuery
 *  @private
 *  @param {Array} stores - The stores array from the FS.Collection options
 *
 *  Returns a selector that will be used to identify files where all
 *  stores have successfully save or have failed the
 *  max number of times but still have chunks. The resulting selector
 *  should be something like this:
 *
 *  {
 *    $and: [
 *      {chunks: {$exists: true}},
 *      {
 *        $or: [
 *          {
 *            $and: [
 *              {
 *                'copies.storeName': {$ne: null}
 *              },
 *              {
 *                'copies.storeName': {$ne: false}
 *              }
 *            ]
 *          },
 *          {
 *            'failures.copies.storeName.doneTrying': true
 *          }
 *        ]
 *      },
 *      REPEATED FOR EACH STORE
 *    ]
 *  }
 *
 */
function getDoneQuery(stores) {
  var selector = {
    $and: [{chunks: {$exists: true}}]
  };

  // Add conditions for all defined stores
  FS.Utility.each(stores, function(store) {
    var storeName = store.name;
    var copyCond = {$or: [{$and: []}]};
    var tempCond = {};
    tempCond["copies." + storeName] = {$ne: null};
    copyCond.$or[0].$and.push(tempCond);
    tempCond = {};
    tempCond["copies." + storeName] = {$ne: false};
    copyCond.$or[0].$and.push(tempCond);
    tempCond = {};
    tempCond['failures.copies.' + storeName + '.doneTrying'] = true;
    copyCond.$or.push(tempCond);
    selector.$and.push(copyCond);
  })

  return selector;
}

/**
 * @method saveCopy
 * @private
 * @param {FS.File} fsFile
 * @param {string} storeName
 * @param {Object} options
 * @param {Boolean} [options.overwrite=false] - Force save to the specified store?
 * @returns {undefined}
 *
 * Saves to the specified store. If the
 * `overwrite` option is `true`, will save to the store even if we already
 * have, potentially overwriting any previously saved data. Synchronous.
 */
function saveCopy(fsFile, storeName, options) {
  options = options || {};

  var storage = FS.StorageAdapter(storeName);
  if (!storage) {
    throw new Error('No store named "' + storeName + '" exists');
  }

  FS.debug && console.log('saving to store ' + storeName);

  try {
    var writeStream = storage.adapter.createWriteStream(fsFile);
    var readStream = FS.TempStore.createReadStream(fsFile);

    // Pipe the temp data into the storage adapter
    readStream.pipe(writeStream);
  } catch(err) {
    console.error(err);
  }
}
