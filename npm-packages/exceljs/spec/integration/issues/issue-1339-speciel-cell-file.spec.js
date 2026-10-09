const ExcelJS = verquire('exceljs');

// this file to contain integration tests created from github issues
const TEST_XLSX_FILE_NAME = './spec/out/wb.test.xlsx';

describe('github issues', () => {
  it('issue 1339 - Special cell value results invalid file', async () => {
    const wb = new ExcelJS.stream.xlsx.WorkbookWriter({
      filename: TEST_XLSX_FILE_NAME,
      useStyles: true,
      useSharedStrings: true,
    });
    const ws = wb.addWorksheet('Sheet1');
    const specialValues = [
      'constructor',
      'hasOwnProperty',
      'isPrototypeOf',
      'propertyIsEnumerable',
      'toLocaleString',
      'toString',
      'valueOf',
      '__defineGetter__',
      '__defineSetter__',
      '__lookupGetter__',
      '__lookupSetter__',
      '__proto__',
    ];
    for (let i = 0, len = specialValues.length; i < len; i++) {
      const value = specialValues[i];
      ws.addRow([value]);
      ws.getCell(`B${i + 1}`).value = value;
    }
    await wb.commit();
    const wb2 = new ExcelJS.Workbook();
    await wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
    const ws2 = wb2.getWorksheet('Sheet1');
    for (let i = 0, len = specialValues.length; i < len; i++) {
      const value = specialValues[i];
      expect(ws2.getCell(`A${i + 1}`).value).to.equal(value);
      expect(ws2.getCell(`B${i + 1}`).value).to.equal(value);
    }
  });
});
