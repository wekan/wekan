const ExcelJS = verquire('exceljs');

// this file to contain integration tests created from github issues
const TEST_XLSX_FILE_NAME = './spec/out/wb.test.xlsx';

describe('github issues', () => {
  it('issue 275 - hyperlink with query arguments corrupts workbook', () => {
    const options = {
      filename: TEST_XLSX_FILE_NAME,
      useStyles: true,
    };
    const wb = new ExcelJS.stream.xlsx.WorkbookWriter(options);
    const ws = wb.addWorksheet('Sheet1');

    const hyperlink = {
      text: 'Somewhere with query params',
      hyperlink: 'www.somewhere.com?a=1&b=2&c=<>&d="\'"',
    };

    // Start of Heading
    ws.getCell('A1').value = hyperlink;
    ws.commit();

    return wb
      .commit()
      .then(() => {
        const wb2 = new ExcelJS.Workbook();
        return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
      })
      .then(wb2 => {
        const ws2 = wb2.getWorksheet('Sheet1');
        expect(ws2.getCell('A1').value).to.deep.equal(hyperlink);
      });
  });
});
