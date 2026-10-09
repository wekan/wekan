const ExcelJS = verquire('exceljs');

const TEST_XLSX_FILE_NAME = './spec/out/wb.test.xlsx';

describe('pr related issues', () => {
  describe('pr 896 leading and trailing whitespace', () => {
    it('Should preserve leading and trailing whitespace', () => {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('foo');
      ws.getCell('A1').value = ' leading';
      ws.getCell('A1').note = ' leading';
      ws.getCell('B1').value = 'trailing ';
      ws.getCell('B1').note = 'trailing ';
      ws.getCell('C1').value = ' both ';
      ws.getCell('C1').note = ' both ';
      return wb.xlsx
        .writeFile(TEST_XLSX_FILE_NAME)
        .then(() => {
          const wb2 = new ExcelJS.Workbook();
          return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
        })
        .then(wb2 => {
          const ws2 = wb2.getWorksheet('foo');
          expect(ws2.getCell('A1').value).to.equal(' leading');
          expect(ws2.getCell('A1').note).to.equal(' leading');
          expect(ws2.getCell('B1').value).to.equal('trailing ');
          expect(ws2.getCell('B1').note).to.equal('trailing ');
          expect(ws2.getCell('C1').value).to.equal(' both ');
          expect(ws2.getCell('C1').note).to.equal(' both ');
        });
    });

    it('Should preserve newlines', () => {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('foo');
      ws.getCell('A1').value = 'Hello,\nWorld!';
      ws.getCell('A1').note = 'Later,\nAlligator!';
      ws.getCell('B1').value = ' Hello, \n World! ';
      ws.getCell('B1').note = ' Later, \n Alligator! ';
      return wb.xlsx
        .writeFile(TEST_XLSX_FILE_NAME)
        .then(() => {
          const wb2 = new ExcelJS.Workbook();
          return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
        })
        .then(wb2 => {
          const ws2 = wb2.getWorksheet('foo');
          expect(ws2.getCell('A1').value).to.equal('Hello,\nWorld!');
          expect(ws2.getCell('A1').note).to.equal('Later,\nAlligator!');
          expect(ws2.getCell('B1').value).to.equal(' Hello, \n World! ');
          expect(ws2.getCell('B1').note).to.equal(' Later, \n Alligator! ');
        });
    });
  });
});
