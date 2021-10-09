/*

export const AttachmentStorage = new Mongo.Collection(
  'cfs_gridfs.attachments.files',
);
export const AvatarStorage = new Mongo.Collection('cfs_gridfs.avatars.files');

const localFSStore = process.env.ATTACHMENTS_STORE_PATH;
const storeName = 'attachments';
const defaultStoreOptions = {
  beforeWrite: fileObj => {
    if (!fileObj.isImage()) {
      return {
        type: 'application/octet-stream',
      };
    }
    return {};
  },
};
let store;
if (localFSStore) {
  // have to reinvent methods from FS.Store.GridFS and FS.Store.FileSystem
  const fs = Npm.require('fs');
  const path = Npm.require('path');
  const mongodb = Npm.require('mongodb');
  const Grid = Npm.require('gridfs-stream');
  // calulate the absolute path here, because FS.Store.FileSystem didn't expose the aboslutepath or FS.Store didn't expose api calls :(
  let pathname = localFSStore;
  // eslint camelcase: ["error", {allow: ["__meteor_bootstrap__"]}]

  if (!pathname && __meteor_bootstrap__ && __meteor_bootstrap__.serverDir) {
    pathname = path.join(
      __meteor_bootstrap__.serverDir,
      `../../../cfs/files/${storeName}`,
    );
  }

  if (!pathname)
    throw new Error('FS.Store.FileSystem unable to determine path');

  // Check if we have '~/foo/bar'
  if (pathname.split(path.sep)[0] === '~') {
    const homepath =
      process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
    if (homepath) {
      pathname = pathname.replace('~', homepath);
    } else {
      throw new Error('FS.Store.FileSystem unable to resolve "~" in path');
    }
  }

  // Set absolute path
  const absolutePath = path.resolve(pathname);

  const _FStore = new FS.Store.FileSystem(storeName, {
    path: localFSStore,
    ...defaultStoreOptions,
  });
  const GStore = {
    fileKey(fileObj) {
      const key = {
        _id: null,
        filename: null,
      };

      // If we're passed a fileObj, we retrieve the _id and filename from it.
      if (fileObj) {
        const info = fileObj._getInfo(storeName, {
          updateFileRecordFirst: false,
        });
        key._id = info.key || null;
        key.filename =
          info.name ||
          fileObj.name({ updateFileRecordFirst: false }) ||
          `${fileObj.collectionName}-${fileObj._id}`;
      }

      // If key._id is null at this point, createWriteStream will let GridFS generate a new ID
      return key;
    },
    db: undefined,
    mongoOptions: { useNewUrlParser: true },
    mongoUrl: process.env.MONGO_URL,
    init() {
      this._init(err => {
        this.inited = !err;
      });
    },
    _init(callback) {
      const self = this;
      mongodb.MongoClient.connect(self.mongoUrl, self.mongoOptions, function(
        err,
        db,
      ) {
        if (err) {
          return callback(err);
        }
        self.db = db;
        return callback(null);
      });
      return;
    },
    createReadStream(fileKey, options) {
      const self = this;
      if (!self.inited) {
        self.init();
        return undefined;
      }
      options = options || {};

      // Init GridFS
      const gfs = new Grid(self.db, mongodb);

      // Set the default streamning settings
      const settings = {
        _id: new mongodb.ObjectID(fileKey._id),
        root: `cfs_gridfs.${storeName}`,
      };

      // Check if this should be a partial read
      if (
        typeof options.start !== 'undefined' &&
        typeof options.end !== 'undefined'
      ) {
        // Add partial info
        settings.range = {
          startPos: options.start,
          endPos: options.end,
        };
      }
      return gfs.createReadStream(settings);
    },
  };
  GStore.init();
  const CRS = 'createReadStream';
  const _CRS = `_${CRS}`;
  const FStore = _FStore._transform;
  FStore[_CRS] = FStore[CRS].bind(FStore);
  FStore[CRS] = function(fileObj, options) {
    let stream;
    try {
      const localFile = path.join(
        absolutePath,
        FStore.storage.fileKey(fileObj),
      );
      const state = fs.statSync(localFile);
      if (state) {
        stream = FStore[_CRS](fileObj, options);
      }
    } catch (e) {
      // file is not there, try GridFS ?
      stream = undefined;
    }
    if (stream) return stream;
    else {
      try {
        const stream = GStore[CRS](GStore.fileKey(fileObj), options);
        return stream;
      } catch (e) {
        return undefined;
      }
    }
  }.bind(FStore);
  store = _FStore;
} else {
  store = new FS.Store.GridFS(localFSStore ? `G${storeName}` : storeName, {
    // XXX Add a new store for cover thumbnails so we don't load big images in
    // the general board view
    // If the uploaded document is not an image we need to enforce browser
    // download instead of execution. This is particularly important for HTML
    // files that the browser will just execute if we don't serve them with the
    // appropriate `application/octet-stream` MIME header which can lead to user
    // data leaks. I imagine other formats (like PDF) can also be attack vectors.
    // See https://github.com/wekan/wekan/issues/99
    // XXX Should we use `beforeWrite` option of CollectionFS instead of
    // collection-hooks?
    // We should use `beforeWrite`.
    ...defaultStoreOptions,
  });
}
Attachments = new FS.Collection('attachments', {
  stores: [store],
});



if (Meteor.isServer) {
  Meteor.startup(() => {
    Attachments.files.createIndex({ cardId: 1 });
  });

  Attachments.allow({
    insert(userId, doc) {
      return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
    },
    update(userId, doc) {
      return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
    },
    remove(userId, doc) {
      return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
    },
    // We authorize the attachment download either:
    // - if the board is public, everyone (even unconnected) can download it
    // - if the board is private, only board members can download it
    download(userId, doc) {
      const board = Boards.findOne(doc.boardId);
      if (board.isPublic()) {
        return true;
      } else {
        return board.hasMember(userId);
      }
    },

    fetch: ['boardId'],
  });
}

// XXX Enforce a schema for the Attachments CollectionFS

if (Meteor.isServer) {
  Attachments.files.after.insert((userId, doc) => {
    // If the attachment doesn't have a source field
    // or its source is different than import
    if (!doc.source || doc.source !== 'import') {
      // Add activity about adding the attachment
      Activities.insert({
        userId,
        type: 'card',
        activityType: 'addAttachment',
        attachmentId: doc._id,
        // this preserves the name so that notifications can be meaningful after
        // this file is removed
        attachmentName: doc.original.name,
        boardId: doc.boardId,
        cardId: doc.cardId,
        listId: doc.listId,
        swimlaneId: doc.swimlaneId,
      });
    } else {
      // Don't add activity about adding the attachment as the activity
      // be imported and delete source field
      Attachments.update(
        {
          _id: doc._id,
        },
        {
          $unset: {
            source: '',
          },
        },
      );
    }
  });

  Attachments.files.before.remove((userId, doc) => {
    Activities.insert({
      userId,
      type: 'card',
      activityType: 'deleteAttachment',
      attachmentId: doc._id,
      // this preserves the name so that notifications can be meaningful after
      // this file is removed
      attachmentName: doc.original.name,
      boardId: doc.boardId,
      cardId: doc.cardId,
      listId: doc.listId,
      swimlaneId: doc.swimlaneId,
    });
  });
}

export default Attachments;
*/
