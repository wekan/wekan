import { createObjectId } from '../grid/createObjectId';

const createOnAfterRemove = bucket =>
  function onAfterRemove(files) {
    files.forEach(file => {
      Object.keys(file.versions).forEach(versionName => {
        const gridFsFileId = (file.versions[versionName].meta || {})
          .gridFsFileId;
        if (gridFsFileId) {
          const gfsId = createObjectId({ gridFsFileId });
          bucket.delete(gfsId, err => {
            // if (err) console.error(err);
          });
        }
      });
    });
  };
