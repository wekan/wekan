const ExcelJS = verquire('exceljs');

// this file to contain integration tests created from github issues
const TEST_XLSX_FILE_NAME = './spec/out/wb.test.xlsx';

describe('github issues', () => {
  describe('issue 219 - 1904 dates not supported', () => {
    it('Reading 1904.xlsx', () => {
      const wb = new ExcelJS.Workbook();
      return wb.xlsx.readFile('./spec/integration/data/1904.xlsx').then(() => {
        expect(wb.properties.date1904).to.equal(true);

        const ws = wb.getWorksheet('Sheet1');
        expect(ws.getCell('B4').value.toISOString()).to.equal(
          '1904-01-01T00:00:00.000Z'
        );
      });
    });
    it('Writing and Reading', () => {
      const wb = new ExcelJS.Workbook();
      wb.properties.date1904 = true;
      const ws = wb.addWorksheet('Sheet1');
      ws.getCell('B4').value = new Date('1904-01-01T00:00:00.000Z');
      return wb.xlsx
        .writeFile(TEST_XLSX_FILE_NAME)
        .then(() => {
          const wb2 = new ExcelJS.Workbook();
          return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
        })
        .then(wb2 => {
          expect(wb2.properties.date1904).to.equal(true);

          const ws2 = wb2.getWorksheet('Sheet1');
          expect(ws2.getCell('B4').value.toISOString()).to.equal(
            '1904-01-01T00:00:00.000Z'
          );
        });
    });
  });
});
