// #6532: what KIND of file is this, when the document does not say?
//
// After an upgrade from WeKan 6, an attachment that came through a migration can
// reach the client without the flags Meteor-Files normally writes at upload
// time: `isImage`, `isVideo`, `isPDF`, ... and sometimes without `extension` or
// `type` either. The card view decides what to render from exactly those flags:
//
//   if(isImage)  img.attachment-thumbnail(src="{{link}}")
//   ...
//   else         span.attachment-thumbnail-text= extension
//
// so a migrated image fell through to the last branch and, with no extension to
// print, drew an empty white box - while the SAME `link` downloaded the file
// perfectly and the board view showed the cover. That is the report: "images can
// be seen in Board view, can be downloaded in card view, but do not show in Card
// view and cannot be maximized. Newly created cards do not show this behaviour."
//
// The kind of a file is derivable: from its mime type when there is one, and
// from its name when there is not. This module is the one place that derives it,
// so the card view, the viewer and the repair below all answer the same way.

// The extensions worth recognising by name - the ones WeKan renders inline.
const IMAGE_EXTENSIONS = [
  'png', 'jpg', 'jpeg', 'jpe', 'gif', 'webp', 'bmp', 'svg', 'avif', 'heic',
  'heif', 'tif', 'tiff', 'ico', 'jfif',
];
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogv', 'mov', 'm4v', 'mkv', 'avi'];
const AUDIO_EXTENSIONS = ['mp3', 'ogg', 'oga', 'wav', 'flac', 'm4a', 'aac', 'opus'];
const TEXT_EXTENSIONS = ['txt', 'md', 'csv', 'log', 'ini', 'conf', 'yml', 'yaml'];
const OFFICE_EXTENSIONS = ['docx', 'xlsx', 'pptx'];

// Enough of a name -> mime map to answer the questions above. Not a full table:
// anything not listed simply has no derived type, and the flags stay false.
const EXTENSION_MIME = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', jpe: 'image/jpeg',
  jfif: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp',
  svg: 'image/svg+xml', avif: 'image/avif', heic: 'image/heic', heif: 'image/heif',
  tif: 'image/tiff', tiff: 'image/tiff', ico: 'image/x-icon',
  mp4: 'video/mp4', webm: 'video/webm', ogv: 'video/ogg', mov: 'video/quicktime',
  m4v: 'video/x-m4v', mkv: 'video/x-matroska', avi: 'video/x-msvideo',
  mp3: 'audio/mpeg', ogg: 'audio/ogg', oga: 'audio/ogg', wav: 'audio/wav',
  flac: 'audio/flac', m4a: 'audio/mp4', aac: 'audio/aac', opus: 'audio/opus',
  pdf: 'application/pdf', json: 'application/json',
  txt: 'text/plain', md: 'text/markdown', csv: 'text/csv', log: 'text/plain',
  ini: 'text/plain', conf: 'text/plain', yml: 'text/yaml', yaml: 'text/yaml',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

// The extension of a file NAME, lower-case and without the dot. Never trusts a
// path separator or a query string to be absent.
function extensionOfName(name) {
  if (typeof name !== 'string' || !name) return '';
  // Strip a query/hash FIRST, then take the last path segment: splitting on all
  // of them at once and taking the last piece turns "photo.png?x=1" into "x=1".
  const withoutQuery = name.split(/[?#]/)[0];
  const base = withoutQuery.split(/[\\/]/).pop();
  const dot = base.lastIndexOf('.');
  if (dot <= 0 || dot === base.length - 1) return '';
  return base.slice(dot + 1).toLowerCase();
}

// The mime type the document states, in any of the fields that have carried it.
function statedType(doc) {
  if (!doc) return '';
  const versions = doc.versions || {};
  const original = versions.original || {};
  const candidates = [doc.type, doc.mime, doc['mime-type'], doc.contentType,
    original.type, doc.meta && doc.meta.type];
  const found = candidates.find(t => typeof t === 'string' && t.includes('/'));
  return found ? found.toLowerCase() : '';
}

function extensionOf(doc) {
  if (!doc) return '';
  const stated = [doc.extension, doc.ext, doc.versions && doc.versions.original
    && doc.versions.original.extension]
    .find(e => typeof e === 'string' && e && e !== '.');
  if (stated) return String(stated).replace(/^\./, '').toLowerCase();
  return extensionOfName(doc.name || (doc.original && doc.original.name) || '');
}

// The whole answer for one document: what it is, however little it says.
function attachmentKind(doc) {
  const extension = extensionOf(doc);
  const type = statedType(doc) || EXTENSION_MIME[extension] || '';

  // A stated flag is believed when it is true; a missing or false flag is
  // derived, so a document that was written correctly is never contradicted.
  const flag = (stated, derived) => (stated === true ? true : derived);
  // The NAME only answers when the document states no type of its own: a file
  // called notes.txt whose type says image/png is a PNG, and asking the name as
  // well would make it both.
  const stated = statedType(doc);
  const byName = list => !stated && list.includes(extension);

  return {
    extension,
    type,
    isImage: flag(doc && doc.isImage,
      type.startsWith('image/') || byName(IMAGE_EXTENSIONS)),
    isVideo: flag(doc && doc.isVideo,
      type.startsWith('video/') || byName(VIDEO_EXTENSIONS)),
    isAudio: flag(doc && doc.isAudio,
      type.startsWith('audio/') || byName(AUDIO_EXTENSIONS)),
    isPDF: flag(doc && doc.isPDF, type === 'application/pdf' || (!stated && extension === 'pdf')),
    isJSON: flag(doc && doc.isJSON, type === 'application/json' || (!stated && extension === 'json')),
    isText: flag(doc && doc.isText,
      type.startsWith('text/') || byName(TEXT_EXTENSIONS)),
    isOffice: OFFICE_EXTENSIONS.includes(extension) &&
      (!stated || type.startsWith('application/vnd.openxmlformats-officedocument.')),
  };
}

// Which of the derived flags a stored document is MISSING - what a repair would
// write. Returns null when the document already says everything it needs to.
function attachmentKindFix(doc) {
  const kind = attachmentKind(doc);
  const fix = {};
  for (const key of ['isImage', 'isVideo', 'isAudio', 'isPDF', 'isJSON', 'isText']) {
    if (kind[key] === true && doc[key] !== true) fix[key] = true;
  }
  // `extension` and `ext` are one fact under two names: write them only when the
  // document carries neither, so a correct document is left completely alone.
  if (kind.extension && !doc.extension && !doc.ext) {
    fix.extension = kind.extension;
    fix.ext = kind.extension;
  }
  if (kind.type && !doc.type) fix.type = kind.type;
  return Object.keys(fix).length ? fix : null;
}

export {
  attachmentKind,
  attachmentKindFix,
  extensionOfName,
  IMAGE_EXTENSIONS,
  VIDEO_EXTENSIONS,
  AUDIO_EXTENSIONS,
  OFFICE_EXTENSIONS,
};
