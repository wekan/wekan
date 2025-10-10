export const httpStreamOutput = function(readStream, name, http, downloadFlag, cacheControl) {
    readStream.on('data', data => {
      http.response.write(data);
    });

    readStream.on('end', () => {
      // don't pass parameters to end() or it will be attached to the file's binary stream
      http.response.end();
    });

    readStream.on('error', (err) => {
      console.error(`Download stream error for file '${name}':`, err);
      http.response.statusCode = 404;
      http.response.end('not found');
    });

    if (cacheControl) {
      http.response.setHeader('Cache-Control', cacheControl);
    }

    // Set Content-Disposition header
    http.response.setHeader('Content-Disposition', getContentDisposition(name, http?.params?.query?.download));

    // Add security headers to prevent XSS attacks
    const isSvgFile = name && name.toLowerCase().endsWith('.svg');
    if (isSvgFile) {
      // For SVG files, add strict CSP to prevent script execution
      http.response.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'none'; object-src 'none';");
      http.response.setHeader('X-Content-Type-Options', 'nosniff');
      http.response.setHeader('X-Frame-Options', 'DENY');
    }
  };

/** will initiate download, if links are called with ?download="true" queryparam */
const getContentDisposition = (name, downloadFlag) => {
  // Force attachment disposition for SVG files to prevent XSS attacks
  const isSvgFile = name && name.toLowerCase().endsWith('.svg');
  const forceAttachment = isSvgFile || downloadFlag === 'true';
  const dispositionType = forceAttachment ? 'attachment;' : 'inline;';

  const encodedName = encodeURIComponent(name);
  const dispositionName = `filename="${encodedName}"; filename=*UTF-8"${encodedName}";`;
  const dispositionEncoding = 'charset=utf-8';

  return `${dispositionType} ${dispositionName} ${dispositionEncoding}`;
};
