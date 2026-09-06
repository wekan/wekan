import { DDP } from 'meteor/ddp';
import { Meteor } from 'meteor/meteor';
import fs from 'fs';
import { pruneImportDocument } from '/models/lib/importParts';
import { assertImportEnabled } from '/models/lib/importExportSecurity';
import { withDeadline } from '/models/lib/withDeadline';
import { WekanCreator } from '/models/wekanCreator';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Checklists from '/models/checklists';
import { importZipBuffer } from '/server/routes/importTrelloZip';
const { importSourceByKey } = require('/models/lib/importSources');
const { parseImportFields } = require('/models/lib/exportFields');
const { detectedFileMime } = require('/models/lib/fileTypeCorrection');
const { readWekanZipArchive } = require('/server/lib/wekanZipArchive');
const { BOARD_EXPORT_FIELD_KEYS } = require('/models/lib/exportFields');
const { allowIsBoardMemberWithWriteAccess } = require('/server/lib/utils');

const MAX_IMPORT_TEXT_BYTES = 5 * 1024 * 1024;

function parseImportText(source, text) {
  if (source === 'excel') throw new Meteor.Error('import-excel-file');
  if (source === 'csv') {
    const Papa = require('papaparse');
    const result = Papa.parse(text);
    if (!result || !Array.isArray(result.data) || result.data.length === 0) {
      throw new Meteor.Error('error-csv-schema');
    }
    return result.data;
  }
  try {
    return JSON.parse(text);
  } catch (_) {
    throw new Meteor.Error('error-json-malformed');
  }
}

function publicImportError(error) {
  const key = typeof error?.error === 'string' && /^[a-z0-9_-]{1,100}$/i.test(error.error)
    ? error.error : 'import-scoped-failed';
  return { ok: false, errorKey: key };
}

async function invokeImport({ userId, source, document, fields, clientAddress }) {
  const selected = parseImportFields(typeof fields === 'string' ? fields : undefined);
  const pruned = source === 'excel' ? document : pruneImportDocument(document, selected);
  const boardId = await DDP._CurrentMethodInvocation.withValue({
    userId,
    connection: { clientAddress: String(clientAddress || '') },
  }, async () => Meteor.callAsync('importBoard', pruned, { membersMapping: {} }, source, null));
  return { ok: true, boardId };
}

export async function importLegacyHtml4Text({ userId, source, text, fields, clientAddress }) {
  if (!userId) return { ok: false, errorKey: 'error-notAuthorized' };
  if (!importSourceByKey(source)) return { ok: false, errorKey: 'invalid-import-source' };
  const input = typeof text === 'string' ? text : '';
  if (!input.trim()) return { ok: false, errorKey: 'error-json-malformed' };
  if (Buffer.byteLength(input, 'utf8') > MAX_IMPORT_TEXT_BYTES) {
    return { ok: false, errorKey: 'import-file-too-large' };
  }
  try {
    return await invokeImport({ userId, source, document: parseImportText(source, input),
      fields, clientAddress });
  } catch (error) {
    return publicImportError(error);
  }
}

export async function importLegacyHtml4File({
  userId, source, upload, fields, clientAddress,
}) {
  if (!userId) return { ok: false, errorKey: 'error-notAuthorized' };
  if (!importSourceByKey(source)) return { ok: false, errorKey: 'invalid-import-source' };
  if (!upload?.tempPath) return { ok: false, errorKey: 'error-json-malformed' };
  try {
    const detectedMime = await detectedFileMime(upload.tempPath);
    if (detectedMime === 'application/zip') {
      await assertImportEnabled();
      const invocation = {
        userId,
        connection: { clientAddress: String(clientAddress || '') },
      };
      if (source === 'trello') {
        const bytes = await fs.promises.readFile(upload.tempPath);
        const imported = await DDP._CurrentMethodInvocation.withValue(invocation,
          async () => importZipBuffer(bytes, userId));
        return { ok: true, boardId: imported.boardIds?.[0], boardIds: imported.boardIds || [] };
      }
      if (source === 'wekan') {
        const archive = await readWekanZipArchive(upload.tempPath, {
          userId, ip: clientAddress,
        });
        const selected = parseImportFields(typeof fields === 'string' ? fields : undefined);
        const document = pruneImportDocument(archive.doc, selected);
        const creator = new WekanCreator({ membersMapping: {},
          attachmentStream: archive.attachmentStream });
        const timeout = Number.parseInt(process.env.WEKAN_IMPORT_TIMEOUT_MS, 10);
        const boardId = await DDP._CurrentMethodInvocation.withValue(invocation,
          async () => withDeadline(creator.create(document, null),
            Number.isFinite(timeout) ? timeout : 120000,
            () => new Meteor.Error('import-timeout', 'Import took too long and was aborted')));
        return { ok: true, boardId };
      }
      throw new Meteor.Error('invalid-import-source');
    }
    const bytes = await fs.promises.readFile(upload.tempPath);
    const document = source === 'excel'
      ? { excelBase64: bytes.toString('base64') }
      : parseImportText(source, bytes.toString('utf8'));
    return await invokeImport({ userId, source, document, fields, clientAddress });
  } catch (error) {
    return publicImportError(error);
  }
}

export async function importLegacyHtml4ScopedFile({
  userId, target, upload, fields, clientAddress,
}) {
  if (!userId) return { ok: false, errorKey: 'error-notAuthorized' };
  if (!upload?.tempPath) return { ok: false, errorKey: 'error-json-malformed' };
  try {
    await assertImportEnabled();
    const [user, board, card, checklist] = await Promise.all([
      Meteor.users.findOneAsync(userId, { fields: { _id: 1 } }),
      Boards.findOneAsync(target.boardId),
      Cards.findOneAsync({ _id: target.cardId, boardId: target.boardId }),
      Checklists.findOneAsync({
        _id: target.checklistId, boardId: target.boardId, cardId: target.cardId,
      }),
    ]);
    if (!user || !board || !board.isVisibleBy(user)
      || !allowIsBoardMemberWithWriteAccess(userId, board) || !card || !checklist) {
      throw new Meteor.Error('forbidden');
    }
    const selected = [...new Set((Array.isArray(fields) ? fields : [fields])
      .filter(value => typeof value === 'string'))]
      .filter(field => BOARD_EXPORT_FIELD_KEYS.includes(field));
    const detectedMime = await detectedFileMime(upload.tempPath);
    let document;
    let attachmentStream = null;
    if (detectedMime === 'application/zip') {
      const archive = await readWekanZipArchive(upload.tempPath, {
        userId, ip: clientAddress,
      });
      document = archive.doc;
      attachmentStream = archive.attachmentStream;
    } else {
      const bytes = await fs.promises.readFile(upload.tempPath);
      document = parseImportText('wekan', bytes.toString('utf8'));
    }
    const safeDocument = require('/server/lib/secureTransfer').secureTransfer(document, {
      direction: 'import', source: 'import:wekan-scoped-html4', userId, ip: clientAddress,
    });
    if (safeDocument._format && safeDocument._format !== 'wekan-board-1.0.0') {
      throw new Meteor.Error('invalid-format');
    }
    pruneImportDocument(safeDocument, selected.length ? selected : null);
    const { ScopedImporter } = require('/models/server/scopedImporter');
    const importer = new ScopedImporter(target, safeDocument, {
      userId, fields: selected.length ? selected : null, attachmentStream,
    });
    const timeout = Number.parseInt(process.env.WEKAN_IMPORT_TIMEOUT_MS, 10);
    const counts = await DDP._CurrentMethodInvocation.withValue({
      userId, connection: { clientAddress: String(clientAddress || '') },
    }, async () => withDeadline(importer.run(),
      Number.isFinite(timeout) ? timeout : 120000,
      () => new Meteor.Error('import-timeout', 'Import took too long and was aborted')));
    return { ok: true, counts };
  } catch (error) {
    return publicImportError(error);
  }
}

export { MAX_IMPORT_TEXT_BYTES, invokeImport, parseImportText, publicImportError };
