import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { pipeline } from 'stream/promises';
const Busboy = require('@fastify/busboy');

const MAX_MULTIPART_FILE_BYTES = 50 * 1024 * 1024;
const ALLOWED_FIELDS = new Set([
  'legacySession', 'authAction', 'authCounter', 'authHash',
  'importFields', 'importField', 'importWorkspaceName', 'legacyOperation',
  'boardId', 'cardId', 'checklistId', 'orgId',
  'targetUserId',
  'visibilityGroup', 'brandingSlot',
]);

function isLegacyHtml4Multipart(req, requestPath) {
  return req?.method === 'POST'
    && (/^\/import\/[^/]+$/.test(requestPath) || /^\/b\/[^/]+\/[^/]+\/[^/]+$/.test(requestPath)
      || requestPath === '/admin/settings/visibility'
      || requestPath === '/admin/people/organizations'
      || requestPath === '/admin/people/people'
      || requestPath === '/account/avatar')
    && /^multipart\/form-data\b/i.test(String(req.headers?.['content-type'] || ''));
}

function receiveLegacyHtml4Multipart(req) {
  return new Promise((resolve, reject) => {
    const fields = {};
    let upload = null;
    let fileWrite = Promise.resolve();
    let failed = false;
    const cleanup = () => upload?.tempPath
      ? fs.promises.unlink(upload.tempPath).catch(() => {}) : Promise.resolve();
    const fail = error => {
      if (failed) return;
      failed = true;
      // On Windows an open temporary file cannot be unlinked. Wait for any
      // active pipeline before cleanup so malformed and aborted uploads never
      // leave a private import file behind.
      Promise.resolve(fileWrite).catch(() => {}).then(cleanup).finally(() => reject(error));
    };
    let parser;
    try {
      parser = new Busboy({
        headers: req.headers,
        limits: { files: 1, fields: 40, parts: 41, fieldSize: 8192,
          fileSize: MAX_MULTIPART_FILE_BYTES },
      });
    } catch (error) {
      fail(error);
      return;
    }
    parser.on('field', (name, value, nameTruncated, valueTruncated) => {
      if (nameTruncated || valueTruncated || !ALLOWED_FIELDS.has(name)
        || (name !== 'importField' && Object.prototype.hasOwnProperty.call(fields, name))) {
        fail(new Error('invalid-import-form-field'));
        return;
      }
      if (name === 'importField') {
        fields.importField = [...(Array.isArray(fields.importField) ? fields.importField : []), value];
      } else fields[name] = value;
    });
    parser.on('file', (fieldName, stream, filename, encoding, mimeType) => {
      if (failed || !['importFile', 'brandingImage', 'avatarImage'].includes(fieldName) || upload) {
        stream.resume();
        fail(new Error('invalid-import-file-field'));
        return;
      }
      const tempPath = path.join(os.tmpdir(),
        `wekan-html4-import-${Date.now()}-${crypto.randomBytes(12).toString('hex')}`);
      upload = { fieldName, tempPath, filename: String(filename || '').slice(0, 300),
        mimeType: String(mimeType || '').slice(0, 100), truncated: false };
      stream.on('limit', () => { upload.truncated = true; });
      fileWrite = pipeline(stream, fs.createWriteStream(tempPath, { flags: 'wx', mode: 0o600 }));
    });
    parser.on('filesLimit', () => fail(new Error('too-many-import-files')));
    parser.on('fieldsLimit', () => fail(new Error('too-many-import-fields')));
    parser.on('partsLimit', () => fail(new Error('too-many-import-parts')));
    parser.on('error', fail);
    req.on('aborted', () => fail(new Error('aborted-import-upload')));
    parser.on('finish', async () => {
      if (failed) return;
      try {
        await fileWrite;
        if (!upload || upload.truncated) throw new Error(upload?.truncated
          ? 'import-file-too-large' : 'missing-import-file');
        resolve({ fields, upload });
      } catch (error) {
        fail(error);
      }
    });
    req.pipe(parser);
  });
}

function removeLegacyHtml4Upload(upload) {
  return upload?.tempPath ? fs.promises.unlink(upload.tempPath).catch(() => {}) : Promise.resolve();
}

export {
  MAX_MULTIPART_FILE_BYTES,
  isLegacyHtml4Multipart,
  receiveLegacyHtml4Multipart,
  removeLegacyHtml4Upload,
};
