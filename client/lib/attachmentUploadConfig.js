import { Meteor } from 'meteor/meteor';
import { ObjectId } from 'bson';
import { sanitizeText } from '/imports/lib/secureDOMPurify';

// The config every attachment upload has to be started with.
//
// Two of its fields are not optional in the way they look:
//
//   * `fileId`, AND the same id copied into `meta.fileId`. Attachments'
//     `namingFunction` (models/attachments.js) is what decides the name the file
//     is STORED under, and on the client it reads that id out of `meta` and
//     deletes it. Without it the stored name is `undefined`, so an upload
//     started without it does not work - which is exactly what happened to the
//     board background uploader, whose config was written by hand and had
//     neither field.
//   * `transport`. Meteor-Files' default is DDP, which floods the WebSocket
//     channel and makes Safari reconnect repeatedly (the "Loading, please wait"
//     banner, stalling at ~95%), so uploads go over HTTP - EXCEPT on Sandstorm,
//     where the grain's http-bridge strips Meteor-Files' `x-*` upload headers
//     and the server rejects every chunk with "Can't continue upload, session
//     expired" [408]. DDP goes over method calls and has no such headers.
//
// One builder, so a new uploader gets both by having asked for a config rather
// than by remembering two things nothing would have told it about.
export function buildAttachmentUploadConfig({ file, meta = {}, fileName }) {
  const fileId = new ObjectId().toString();
  const config = {
    file,
    fileId,
    fileName: fileName || safeName(file),
    meta: { ...meta, fileId },
    chunkSize: 'dynamic',
    transport: Meteor.settings?.public?.sandstorm ? 'ddp' : 'http',
  };
  return config;
}

// The name as typed, unless sanitizing it changes it - in which case it was
// either an attempt at XSS (already defused by the sanitizer) or an ordinary
// mistake, and neither is worth a warning. An empty result still needs A name.
function safeName(file) {
  const name = sanitizeText((file && file.name) || '');
  if (name.length) return name;
  if (file && file.type) return file.type.replace('image/', 'clipboard.');
  return 'Empty-filename-after-sanitize.txt';
}
