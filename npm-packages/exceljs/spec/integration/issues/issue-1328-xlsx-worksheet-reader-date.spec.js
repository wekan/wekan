const ExcelJS = verquire('exceljs');
const fs = require('fs');

describe('github issues: Date field with cache style', () => {
  const rows = [];
  beforeEach(
    () =>
      new Promise((resolve, reject) => {
        const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(
          fs.createReadStream('./spec/integration/data/dateIssue.xlsx'),
          {
            worksheets: 'emit',
            styles: 'cache',
            sharedStrings: 'cache',
            hyperlinks: 'ignore',
            entries: 'ignore',
          }
        );
        workbookReader.read();
        workbookReader.on('worksheet', worksheet =>
          worksheet.on('row', row => rows.push(row.values[1]))
        );
        workbookReader.on('end', resolve);
        workbookReader.on('error', reject);
      })
  );
  it('issue 1328 - should emit row with Date Object', () => {
    expect(rows).that.deep.equals([
      'Date',
      new Date('2020-11-20T00:00:00.000Z'),
    ]);
  });
});
