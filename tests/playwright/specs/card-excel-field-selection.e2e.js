'use strict';

// A card Excel export with only Description or only Labels selected skips
// loading the board's list and swimlane (and, for Description, the board
// itself). The shared card document then read `.title` of null and the
// download failed with "Export failed". tests/cardExportDocument.test.cjs pins
// the builder; this drives the real route.

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const ExcelJS = require('../../../node_modules/@wekanteam/exceljs');

async function workbookText(response) {
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('spreadsheetml.sheet');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await response.body());
  const values = [];
  workbook.eachSheet(sheet => sheet.eachRow(row => values.push(JSON.stringify(row.values))));
  return values.join('\n');
}

test('card Excel export works with only Description or only Labels selected', async ({ request, user, board }) => {
  const listId = board.listIds[0];
  const cardId = db.findCardIdByTitle({ boardId: board.boardId, title: 'Alpha Card' });
  const labelId = db.uid('label');
  db.updateOne('boards', { _id: board.boardId }, { $set: {
    title: 'Field Selection Board',
    labels: [{ _id: labelId, name: 'FieldSelectionLabel', color: 'green' }],
  } });
  db.updateOne('cards', { _id: cardId }, { $set: {
    description: 'Only the description is exported',
    labelIds: [labelId],
  } });
  const url = field => `/api/boards/${board.boardId}/lists/${listId}/cards/${cardId}/exportExcel`
    + `?authToken=${encodeURIComponent(user.token)}&fields=${field}`;

  const description = await workbookText(await request.get(url('description')));
  expect(description).toContain('Only the description is exported');
  // Negative: a field that was not selected is not in the workbook.
  expect(description).not.toContain('FieldSelectionLabel');
  expect(description).not.toContain('Field Selection Board');

  const labels = await workbookText(await request.get(url('labels')));
  expect(labels).toContain('FieldSelectionLabel');
  expect(labels).not.toContain('Only the description is exported');
  expect(labels).not.toContain('Field Selection Board');
});
