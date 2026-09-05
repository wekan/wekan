export const httpStreamOutput = function(readStream, name, http, downloadFlag, cacheControl, fileObj) {
    const {
      fileNameIsBrowserExecutable,
      fileResponsePolicy,
    } = require('./fileResponseSafety');
    const storedType = fileObj?.versions?.original?.type || fileObj?.type;
    const policy = fileResponsePolicy(storedType, fileNameIsBrowserExecutable(name));
    // Sanitize known exploits from EXISTING files on the fly, straight from the
    // storage backend, without buffering whole files: the sanitizer sniffs the
    // start of the stream and only rewrites documents that begin like dangerous
    // markup (SVG/XML with <script>, an <!DOCTYPE/<!ENTITY XML loop, inline event
    // handlers, ...); everything else streams through unchanged. See
    // models/lib/serveFileSanitizer.js. When it DOES rewrite something, log it to
    // Admin Panel / Problems with the uploader + location context (viewing path).
    let outStream = readStream;
    try {
      const { createServeSanitizer } = require('./serveFileSanitizer');
      const onSanitized = kinds => {
        try {
          require('/server/lib/filenameSanitizeLog').logContentSanitized({
            fileObj: fileObj || { name }, source: 'fileView', kinds,
          });
        } catch (e) { /* best effort */ }
      };
      const sanitizer = createServeSanitizer(name, onSanitized);
      readStream.on('error', err => sanitizer.destroy(err));
      outStream = readStream.pipe(sanitizer);
    } catch (e) {
      console.error('serveFileSanitizer unavailable, streaming file as-is:', e);
      outStream = readStream;
    }

    outStream.on('data', data => {
      http.response.write(data);
    });

    outStream.on('end', () => {
      // don't pass parameters to end() or it will be attached to the file's binary stream
      http.response.end();
    });

    outStream.on('error', (err) => {
      console.error(`Download stream error for file '${name}':`, err);
      http.response.statusCode = 404;
      http.response.end('not found');
    });

    if (cacheControl) {
      http.response.setHeader('Cache-Control', cacheControl);
    }

    // This path is the original Meteor-Files /cdn/storage route. Apply the same
    // fail-closed policy as WeKan's universal and legacy routes before any
    // storage strategy writes bytes to the response.
    http.response.setHeader('Content-Type', policy.contentType);
    http.response.setHeader(
      'Content-Disposition',
      getContentDisposition(name, policy.forceDownload ? 'true' : downloadFlag),
    );
    for (const [header, value] of Object.entries(policy.headers)) {
      http.response.setHeader(header, value);
    }
  };

/** will initiate download, if links are called with ?download="true" queryparam */
const getContentDisposition = (name, downloadFlag) => {
  // Force attachment disposition for SVG files to prevent XSS attacks
  const forceAttachment = downloadFlag === 'true';
  const dispositionType = forceAttachment ? 'attachment;' : 'inline;';

  const { sanitizeDownloadFileName } = require('/imports/lib/fileNameDisplay');
  const encodedName = encodeURIComponent(sanitizeDownloadFileName(name));
  const dispositionName = `filename="${encodedName}"; filename=*UTF-8"${encodedName}";`;
  const dispositionEncoding = 'charset=utf-8';

  return `${dispositionType} ${dispositionName} ${dispositionEncoding}`;
};
