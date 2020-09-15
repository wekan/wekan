import { createObjectId } from '../grid/createObjectId';

export const createInterceptDownload = bucket =>
  function interceptDownload(http, file, versionName) {
    const { gridFsFileId } = file.versions[versionName].meta || {};
    if (gridFsFileId) {
      // opens the download stream using a given gfs id
      // see: http://mongodb.github.io/node-mongodb-native/3.2/api/GridFSBucket.html#openDownloadStream
      const gfsId = createObjectId({ gridFsFileId });
      const readStream = bucket.openDownloadStream(gfsId);

      readStream.on('data', data => {
        http.response.write(data);
      });

      readStream.on('end', () => {
        http.response.end(); // don't pass parameters to end() or it will be attached to the file's binary stream
      });

      readStream.on('error', () => {
        // not found probably
        // eslint-disable-next-line no-param-reassign
        http.response.statusCode = 404;
        http.response.end('not found');
      });

      http.response.setHeader('Cache-Control', this.cacheControl);
      http.response.setHeader(
        'Content-Disposition',
        getContentDisposition(file.name, http?.params?.query?.download),
      );
    }
    return Boolean(gridFsFileId); // Serve file from either GridFS or FS if it wasn't uploaded yet
  };

/**
 * Will initiate download, if links are called with ?download="true" queryparam.
 **/
const getContentDisposition = (name, downloadFlag) => {
  const dispositionType = downloadFlag === 'true' ? 'attachment;' : 'inline;';

  const encodedName = encodeURIComponent(fileName);
  const dispositionName = `filename="${encodedName}"; filename=*UTF-8"${encodedName}";`;
  const dispositionEncoding = 'charset=utf-8';

  return `${dispositionType} ${dispositionName} ${dispositionEncoding}`;
};
