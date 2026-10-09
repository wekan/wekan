const ExcelJS = verquire('exceljs');

const TEST_CSV_FILE_NAME = './spec/out/issue-995-encoding.test.csv';
const HEBREW_TEST_STRING = 'משהו שכתוב בעברית';

describe('github issues', () => {
  it('issue 995 - encoding option works fine', () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('wheee');
    ws.getCell('A1').value = HEBREW_TEST_STRING;

    const options = {
      encoding: 'UTF-8',
    };
    return wb.csv
      .writeFile(TEST_CSV_FILE_NAME, options)
      .then(() => {
        const ws2 = new ExcelJS.Workbook();
        return ws2.csv.readFile(TEST_CSV_FILE_NAME, options);
      })
      .then(ws2 => {
        expect(ws2.getCell('A1').value).to.equal(HEBREW_TEST_STRING);
      });
  }).timeout(6000);
});
