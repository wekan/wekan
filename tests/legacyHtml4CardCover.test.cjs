'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..',
  'server/lib/legacyHtml4Pages.js'), 'utf8');

assert.match(source, /hasCover = board\.allowsCoverAttachmentOnCard === true/,
  'the route board setting gates the HTML4 cover');
assert.match(source, /contentCard\?\.coverId/,
  'linked cards resolve their real content cover');
assert.match(source, /orderedAttachments = \(visible\.attachments \? \[\.\.\.attachments\] : \[\]\)\.sort/,
  'the cover is ordered before ordinary attachment rows');
assert.match(source, /isCover = hasCover && kind\.isImage/,
  'only an image attachment can be designated as the cover');
assert.match(source, /isCover \? 'cover-image' : 'attachment'/,
  'the semantic row uses the shared translated Cover image label');
assert.match(source, /authPurpose: `download:gif-\$\{attachment\._id\}`/,
  'the cover preview retains the purpose-bound GIF response');

console.log('legacyHtml4CardCover: setting-gated GIF cover parity passed');
