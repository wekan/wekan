const ExcelJS = verquire('exceljs');

// this file to contain integration tests created from github issues
const TEST_XLSX_FILE_NAME = './spec/out/wb.test.xlsx';

describe('github issues', () => {
  it('issue 234 - Broken XLSX because of "vertical tab" ascii character in a cell', () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Sheet1');

    // Start of Heading
    ws.getCell('A1').value = 'Hello, \x01World!';

    // Vertical Tab
    ws.getCell('A2').value = 'Hello, \x0bWorld!';

    return wb.xlsx
      .writeFile(TEST_XLSX_FILE_NAME)
      .then(() => {
        const wb2 = new ExcelJS.Workbook();
        return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
      })
      .then(wb2 => {
        const ws2 = wb2.getWorksheet('Sheet1');
        expect(ws2.getCell('A1').value).to.equal('Hello, World!');
        expect(ws2.getCell('A2').value).to.equal('Hello, World!');
      });
  });
});
