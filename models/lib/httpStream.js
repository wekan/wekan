export const httpStreamOutput = function(readStream, name, http, downloadFlag, cacheControl) {
    readStream.on('data', data => {
      http.response.write(data);
    });

    readStream.on('end', () => {
      // don't pass parameters to end() or it will be attached to the file's binary stream
      http.response.end();
    });

    readStream.on('error', () => {
      http.response.statusCode = 404;
      http.response.end('not found');
    });

    if (cacheControl) {
      http.response.setHeader('Cache-Control', cacheControl);
    }
    http.response.setHeader('Content-Disposition', getContentDisposition(name, http?.params?.query?.download));
  };

/** will initiate download, if links are called with ?download="true" queryparam */
const getContentDisposition = (name, downloadFlag) => {
  const dispositionType = downloadFlag === 'true' ? 'attachment;' : 'inline;';

  const encodedName = encodeURIComponent(name);
  const dispositionName = `filename="${encodedName}"; filename=*UTF-8"${encodedName}";`;
  const dispositionEncoding = 'charset=utf-8';

  return `${dispositionType} ${dispositionName} ${dispositionEncoding}`;
};
