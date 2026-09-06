import { DDP } from 'meteor/ddp';
import { Meteor } from 'meteor/meteor';
import { pruneImportDocument } from '/models/lib/importParts';
const { importSourceByKey } = require('/models/lib/importSources');
const { parseImportFields } = require('/models/lib/exportFields');

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

export async function importLegacyHtml4Text({ userId, source, text, fields, clientAddress }) {
  if (!userId) return { ok: false, errorKey: 'error-notAuthorized' };
  if (!importSourceByKey(source)) return { ok: false, errorKey: 'invalid-import-source' };
  const input = typeof text === 'string' ? text : '';
  if (!input.trim()) return { ok: false, errorKey: 'error-json-malformed' };
  if (Buffer.byteLength(input, 'utf8') > MAX_IMPORT_TEXT_BYTES) {
    return { ok: false, errorKey: 'import-file-too-large' };
  }
  try {
    const selected = parseImportFields(typeof fields === 'string' ? fields : undefined);
    const document = pruneImportDocument(parseImportText(source, input), selected);
    const boardId = await DDP._CurrentMethodInvocation.withValue({
      userId,
      connection: { clientAddress: String(clientAddress || '') },
    }, async () => Meteor.callAsync('importBoard', document, { membersMapping: {} }, source, null));
    return { ok: true, boardId };
  } catch (error) {
    return publicImportError(error);
  }
}

export { MAX_IMPORT_TEXT_BYTES, parseImportText, publicImportError };
