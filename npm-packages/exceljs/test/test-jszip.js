const fs = require('fs');
const JSZip = require('jszip');

// eslint-disable-next-line node/no-unsupported-features/node-builtins
const fsp = fs.promises;

const filename = process.argv[2];

const jsZip = new JSZip();

fsp
  .readFileAsync(filename)
  .then(data => {
    console.log('data', data);
    return jsZip.loadAsync(data);
  })
  .then(zip => {
    zip.forEach((path, entry) => {
      if (!entry.dir) {
        // console.log(path, entry)
        console.log(
          path,
          entry.name,
          entry._data.compressedSize,
          entry._data.uncompressedSize
        );
      }
    });
  });
