import { Meteor } from 'meteor/meteor';
import fs from 'fs';

export const createOnAfterUpload = bucket =>
  function onAfterUpload(file) {
    const self = this;

    // here you could manipulate your file
    // and create a new version, for example a scaled 'thumbnail'
    // ...

    // then we read all versions we have got so far
    Object.keys(file.versions).forEach(versionName => {
      const metadata = { ...file.meta, versionName, fileId: file._id };
      fs.createReadStream(file.versions[versionName].path)

        // this is where we upload the binary to the bucket using bucket.openUploadStream
        // see http://mongodb.github.io/node-mongodb-native/3.2/api/GridFSBucket.html#openUploadStream
        .pipe(
          bucket.openUploadStream(file.name, {
            contentType: file.type || 'binary/octet-stream',
            metadata,
          }),
        )

        // and we unlink the file from the fs on any error
        // that occurred during the upload to prevent zombie files
        .on('error', err => {
          // console.error("[createOnAfterUpload error]", err);
          self.unlink(file, versionName); // Unlink files from FS
        })

        // once we are finished, we attach the gridFS Object id on the
        // FilesCollection document's meta section and finally unlink the
        // upload file from the filesystem
        .on(
          'finish',
          ver => {
            const property = `versions.${versionName}.meta.gridFsFileId`;

            self.collection.updateAsync(file._id, {
              $set: {
                [property]: ver._id.toHexString(),
              },
            }).catch(err => {
              console.error('[createOnAfterUpload update error]', err);
            });

            self.unlink(file, versionName); // Unlink files from FS
          },
        );
    });
  };
