import { Meteor } from 'meteor/meteor';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Checklists from '/models/checklists';
import { Exporter } from '/models/exporter';
import { ExporterBoardPDF } from '/models/server/ExporterCardPDF';
import { ExporterExcelBoard } from '/models/server/ExporterExcelBoard';
import { ExporterZip } from '/models/server/ExporterZip';
import { TAPi18n } from '/imports/i18n';
const { BOARD_EXPORT_FIELD_KEYS } = require('/models/lib/exportFields');
const { attachmentDisposition, exportFilename } = require('/models/lib/exportFilename');
const { assertExportEnabled } = require('/models/lib/importExportSecurity');
const { assignedOnlyCardScope } = require('/models/lib/boardCardScope');

const FORMATS = new Set(['pdf', 'xlsx', 'json', 'json-no-attachments', 'zip']);

function selectedFields(value) {
  const values = Array.isArray(value) ? value : value == null ? [] : [value];
  const selected = [...new Set(values.map(String))]
    .filter(field => BOARD_EXPORT_FIELD_KEYS.includes(field));
  return selected.length ? selected : null;
}

async function serveLegacyHtml4ScopedExport({
  res, userId, boardId, cardId, checklistId = '', format, exportFields,
}) {
  if (!userId || !FORMATS.has(format)) throw new Meteor.Error('error-notAuthorized');
  await assertExportEnabled();
  const [user, board] = await Promise.all([
    Meteor.users.findOneAsync(userId, { fields: {
      'profile.language': 1, 'profile.dateFormat': 1,
    } }),
    Boards.findOneAsync(boardId),
  ]);
  if (!user || !board || !board.isVisibleBy(user)) throw new Meteor.Error('forbidden');
  const card = await Cards.findOneAsync({
    _id: cardId, boardId, ...(assignedOnlyCardScope(board, userId) || {}),
  });
  const checklist = checklistId
    ? await Checklists.findOneAsync({ _id: checklistId, boardId, cardId }) : null;
  if (!card || (checklistId && !checklist)) {
    throw new Meteor.Error('forbidden');
  }
  const language = user.profile?.language || 'en';
  await TAPi18n.ensureLanguageLoaded(language);
  const fields = selectedFields(exportFields);
  const scope = checklistId ? { checklistId } : { cardId };
  const kind = checklistId ? 'checklist' : 'card';
  const title = checklistId ? checklist.title : card.title;
  if (format === 'pdf') {
    const exporter = new ExporterBoardPDF(
      boardId, language, '', user.profile?.dateFormat || 'YYYY-MM-DD', fields, scope,
    );
    await exporter.build(res);
    return;
  }
  if (format === 'xlsx') {
    const exporter = new ExporterExcelBoard(
      boardId, language, fields, user.profile?.dateFormat || 'YYYY-MM-DD', '', scope,
    );
    await exporter.build(res);
    return;
  }
  if (format === 'zip') {
    const exporter = new ExporterZip(boardId, { fields, scope, userLanguage: language });
    await exporter.build(res, exportFilename(kind, key => TAPi18n.__(key, '', language),
      title || 1, 'zip'));
    return;
  }
  const exporter = new Exporter(boardId, undefined, {
    excludeAttachments: format === 'json-no-attachments',
    fields,
    scope,
    userLanguage: language,
  });
  const filename = exportFilename(kind, key => TAPi18n.__(key, '', language),
    title || 1, 'json');
  res.statusCode = 200;
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', attachmentDisposition(filename));
  await exporter.buildStream(res);
  res.end();
}

const serveLegacyHtml4ChecklistExport = serveLegacyHtml4ScopedExport;

export {
  FORMATS, selectedFields, serveLegacyHtml4ChecklistExport, serveLegacyHtml4ScopedExport,
};
