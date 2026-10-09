const ExcelJS = verquire('exceljs');

describe('github issues', () => {
  it('pull request 1431 - streaming reader should handle rich text within shared strings', async () => {
    const rowData = [
      {
        richText: [
          {font: {bold: true}, text: 'This should '},
          {font: {italic: true}, text: 'be one shared string value'},
        ],
      },
      'this should be the second shared string',
    ];

    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
      filename: './test.xlsx',
      useSharedStrings: true,
    });

    const sheet = workbook.addWorksheet('data');

    sheet.addRow(rowData);

    await workbook.commit();

    return new Promise((resolve, reject) => {
      const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(
        './test.xlsx',
        {
          entries: 'emit',
          hyperlinks: 'cache',
          sharedStrings: 'cache',
          styles: 'cache',
          worksheets: 'emit',
        }
      );

      workbookReader.on('worksheet', worksheet =>
        worksheet.on('row', row => {
          expect(row.values[1]).to.eql(rowData[0]);
          expect(row.values[2]).to.equal(rowData[1]);

          resolve();
        })
      );
      workbookReader.on('error', reject);

      workbookReader.read();
    });
  });
});
