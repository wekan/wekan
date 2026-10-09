const ExcelJS = verquire('exceljs');

const TEST_XLSX_FILE_NAME = './spec/out/wb.test.xlsx';

describe('github issues', () => {
  it('pull request 1334 - Fix the error that comment does not delete at spliceColumn', async () => {
    (async () => {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('testSheet');

      ws.addRow([
        'test1',
        'test2',
        'test3',
        'test4',
        'test5',
        'test6',
        'test7',
        'test8',
      ]);

      const row = ws.getRow(1);
      row.getCell(1).note = 'test1';
      row.getCell(2).note = 'test2';
      row.getCell(3).note = 'test3';
      row.getCell(4).note = 'test4';

      ws.spliceColumns(2, 1);

      expect(row.getCell(1).note).to.equal('test1');
      expect(row.getCell(2).note).to.equal('test3');
      expect(row.getCell(3).note).to.equal('test4');
      expect(row.getCell(4).note).to.equal(undefined);

      await wb.xlsx.writeFile(TEST_XLSX_FILE_NAME);
    })();
  });
});
