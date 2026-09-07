import { DDP } from 'meteor/ddp';
import { Meteor } from 'meteor/meteor';
import fs from 'fs';
import crypto from 'crypto';
import { pruneImportDocument } from '/models/lib/importParts';
import { assertImportEnabled } from '/models/lib/importExportSecurity';
import { withDeadline } from '/models/lib/withDeadline';
import { WekanCreator } from '/models/wekanCreator';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Checklists from '/models/checklists';
import { importZipBuffer } from '/server/routes/importTrelloZip';
const { assignedOnlyCardScope } = require('/models/lib/boardCardScope');
const { importSourceByKey } = require('/models/lib/importSources');
const { parseImportFields } = require('/models/lib/exportFields');
const { detectedFileMime } = require('/models/lib/fileTypeCorrection');
const { readWekanZipArchive } = require('/server/lib/wekanZipArchive');
const { BOARD_EXPORT_FIELD_KEYS } = require('/models/lib/exportFields');
const { allowIsBoardMemberWithWriteAccess } = require('/server/lib/utils');
const { membersFromImport } = require('/models/lib/importMembers');

const MAX_IMPORT_TEXT_BYTES = 5 * 1024 * 1024;
const MAX_WORKSPACE_NAME_LENGTH = 100;

function normalizeWorkspaceName(source, value) {
  if (source !== 'trello') return '';
  const name = typeof value === 'string' ? value.trim() : '';
  if (name.length > MAX_WORKSPACE_NAME_LENGTH || /[\u0000-\u001f\u007f]/.test(name)) {
    throw new Meteor.Error('invalid-workspace-name');
  }
  return name;
}

function workspaceByName(nodes, name) {
  for (const node of nodes || []) {
    if (node?.name === name) return node;
    const nested = workspaceByName(node?.children, name);
    if (nested) return nested;
  }
  return null;
}

async function assignImportedBoardsToWorkspace(userId, boardIds, workspaceName) {
  if (!workspaceName || !boardIds.length) return;
  const user = await Meteor.users.findOneAsync(userId, {
    fields: { 'profile.boardWorkspacesTree': 1 },
  });
  let workspace = workspaceByName(user?.profile?.boardWorkspacesTree, workspaceName);
  if (!workspace) {
    workspace = await Meteor.callAsync('createWorkspace', { parentId: null, name: workspaceName });
  }
  for (const boardId of boardIds) {
    await Meteor.callAsync('assignBoardToWorkspace', boardId, workspace.id);
  }
}

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

async function invokeImport({ userId, source, document, fields, clientAddress, workspaceName }) {
  const selected = parseImportFields(typeof fields === 'string' ? fields : undefined);
  const pruned = source === 'excel' ? document : pruneImportDocument(document, selected);
  const boardId = await DDP._CurrentMethodInvocation.withValue({
    userId,
    connection: { clientAddress: String(clientAddress || '') },
  }, async () => Meteor.callAsync('importBoard', pruned, { membersMapping: {} }, source, null));
  await DDP._CurrentMethodInvocation.withValue({
    userId, connection: { clientAddress: String(clientAddress || '') },
  }, async () => assignImportedBoardsToWorkspace(userId, [boardId], workspaceName));
  return { ok: true, boardId };
}

async function importDraft({ userId, source, document, fields, clientAddress, workspaceName }) {
  const selected = parseImportFields(typeof fields === 'string' ? fields : undefined);
  const safeDocument = require('/server/lib/secureTransfer').secureTransfer(document, {
    direction: 'import', source: `import:${source}-html4-draft`, userId, ip: clientAddress,
  });
  const pruned = pruneImportDocument(safeDocument, selected);
  const members = membersFromImport(source, pruned);
  if (members.length === 0) {
    return invokeImport({ userId, source, document: pruned, fields, clientAddress, workspaceName });
  }
  const usernames = [...new Set(members.map(member => member.username).filter(Boolean))];
  const matches = await Meteor.users.find({ username: { $in: usernames } }, {
    fields: { _id: 1, username: 1 }, limit: 2000,
  }).fetchAsync();
  const exact = new Map(matches.map(user => [user.username, user._id]));
  return {
    ok: true,
    pending: true,
    draft: {
      id: crypto.randomBytes(16).toString('hex'), source, document: pruned,
      fields: selected.join(','), workspaceName, createdAt: new Date(),
      members: members.map(member => ({ ...member, suggestedUserId: exact.get(member.username) || '' })),
    },
  };
}

export async function finishLegacyHtml4Import({
  userId, draft, memberUsernames = [], clientAddress,
}) {
  if (!userId || !draft || !Array.isArray(draft.members) || !draft.document) {
    return { ok: false, errorKey: 'error-notAuthorized' };
  }
  try {
    const wanted = memberUsernames.map(value => String(value || '').trim().slice(0, 500));
    const unique = [...new Set(wanted.filter(Boolean))];
    const targets = unique.length ? await Meteor.users.find({ username: { $in: unique } }, {
      fields: { _id: 1, username: 1 }, limit: 2000,
    }).fetchAsync() : [];
    const byUsername = new Map(targets.map(user => [user.username, user._id]));
    if (unique.some(username => !byUsername.has(username))) {
      throw new Meteor.Error('user-not-found');
    }
    const membersMapping = Object.create(null);
    draft.members.forEach((member, index) => {
      const username = wanted[index];
      if (username) membersMapping[member.id] = byUsername.get(username);
    });
    const boardId = await DDP._CurrentMethodInvocation.withValue({
      userId, connection: { clientAddress: String(clientAddress || '') },
    }, async () => Meteor.callAsync('importBoard', draft.document,
      { membersMapping }, draft.source, null));
    await DDP._CurrentMethodInvocation.withValue({
      userId, connection: { clientAddress: String(clientAddress || '') },
    }, async () => assignImportedBoardsToWorkspace(userId, [boardId], draft.workspaceName));
    return { ok: true, boardId };
  } catch (error) {
    return publicImportError(error);
  }
}

export async function importLegacyHtml4Text({
  userId, source, text, fields, clientAddress, workspaceName,
}) {
  if (!userId) return { ok: false, errorKey: 'error-notAuthorized' };
  if (!importSourceByKey(source)) return { ok: false, errorKey: 'invalid-import-source' };
  const input = typeof text === 'string' ? text : '';
  if (!input.trim()) return { ok: false, errorKey: 'error-json-malformed' };
  if (Buffer.byteLength(input, 'utf8') > MAX_IMPORT_TEXT_BYTES) {
    return { ok: false, errorKey: 'import-file-too-large' };
  }
  try {
    const normalizedWorkspace = normalizeWorkspaceName(source, workspaceName);
    return await importDraft({ userId, source, document: parseImportText(source, input),
      fields, clientAddress, workspaceName: normalizedWorkspace });
  } catch (error) {
    return publicImportError(error);
  }
}

export async function importLegacyHtml4File({
  userId, source, upload, fields, clientAddress, workspaceName,
}) {
  if (!userId) return { ok: false, errorKey: 'error-notAuthorized' };
  if (!importSourceByKey(source)) return { ok: false, errorKey: 'invalid-import-source' };
  if (!upload?.tempPath) return { ok: false, errorKey: 'error-json-malformed' };
  try {
    const normalizedWorkspace = normalizeWorkspaceName(source, workspaceName);
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
        const boardIds = imported.boardIds || [];
        await DDP._CurrentMethodInvocation.withValue(invocation,
          async () => assignImportedBoardsToWorkspace(userId, boardIds, normalizedWorkspace));
        return { ok: true, boardId: boardIds[0], boardIds };
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
    return await importDraft({ userId, source, document, fields, clientAddress,
      workspaceName: normalizedWorkspace });
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
    const [user, board] = await Promise.all([
      Meteor.users.findOneAsync(userId, { fields: { _id: 1 } }),
      Boards.findOneAsync(target.boardId),
    ]);
    const card = board ? await Cards.findOneAsync({
      _id: target.cardId, boardId: target.boardId,
      ...(assignedOnlyCardScope(board, userId) || {}),
    }) : null;
    const checklist = target.checklistId ? await Checklists.findOneAsync({
      _id: target.checklistId, boardId: target.boardId, cardId: target.cardId,
    }) : null;
    if (!user || !board || !board.isVisibleBy(user)
      || !allowIsBoardMemberWithWriteAccess(userId, board) || !card
      || (target.checklistId && !checklist)) {
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

export { MAX_IMPORT_TEXT_BYTES, MAX_WORKSPACE_NAME_LENGTH, assignImportedBoardsToWorkspace,
  importDraft, invokeImport, normalizeWorkspaceName, parseImportText, publicImportError };
