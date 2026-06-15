'use strict';

/**
 * Spec 25 — Excel (.xlsx) import and board PDF export (#395)
 *
 *  - Import a board from an .xlsx spreadsheet built in-test with exceljs.
 *  - Export a whole board to PDF over the REST API.
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
// exceljs lives in the repo root node_modules (used by the Excel importer).
const ExcelJS = require('../../../node_modules/@wekanteam/exceljs');

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

test.describe('Excel import & board PDF export', () => {
  test('#395 importing an .xlsx creates a board with the spreadsheet rows', async ({ loggedInPage }) => {
    // Build a minimal WeKan-style spreadsheet: header + one card row.
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Board');
    ws.addRow(['Title', 'Description', 'Status']);
    ws.addRow(['ExcelCardOne', 'imported from excel', 'ToDoExcel']);
    const buffer = Buffer.from(await wb.xlsx.writeBuffer());

    await loggedInPage.goto('/import/excel', { waitUntil: 'commit' });
    await loggedInPage
      .locator('.js-import-excel-file')
      .setInputFiles({ name: 'board.xlsx', mimeType: XLSX_MIME, buffer });

    // Submitting the form imports immediately (Excel skips member mapping).
    await loggedInPage.locator('form input[type=submit]').first().click();

    // Lands on the new board, which contains the imported card.
    await loggedInPage.waitForURL(/\/b\//, { timeout: 30_000 });
    await expect(loggedInPage.locator('body')).toContainText('ExcelCardOne', {
      timeout: 20_000,
    });

    // Cleanup the imported board (extract its id from the URL).
    const m = loggedInPage.url().match(/\/b\/([^/]+)\//);
    if (m) db.cleanup({ boardIds: [m[1]] });
  });

  test('board PDF export returns a PDF document', async ({ request, user, board }) => {
    const res = await request.get(`/api/boards/${board.boardId}/exportPDF`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('application/pdf');
    const body = await res.body();
    // A valid PDF starts with the "%PDF" magic bytes and is non-trivial.
    expect(body.slice(0, 4).toString('latin1')).toBe('%PDF');
    expect(body.length).toBeGreaterThan(200);
  });
});
