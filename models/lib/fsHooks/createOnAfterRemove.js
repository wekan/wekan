import { createObjectId } from '../grid/createObjectId';

export const createOnAfterRemove =
  function onAfterRemove(filesCollection, bucket, file, versionName) {
    const gridFsFileId = (file.versions[versionName].meta || {})
      .gridFsFileId;
    if (gridFsFileId) {
      const gfsId = createObjectId({ gridFsFileId });
        bucket.delete(gfsId, err => {
      });
    }
  };
