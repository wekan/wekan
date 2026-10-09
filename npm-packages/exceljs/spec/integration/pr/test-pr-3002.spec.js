const ExcelJS = verquire('exceljs');

describe('github issues', () => {
  it('test issue 3000 - The worksheet MergeCell should be [A2:C4]', async () => {
    const reader = new ExcelJS.stream.xlsx.WorkbookReader(
      './spec/integration/data/test-issue-3000.xlsx',
      {
        entries: 'emit',
        sharedStrings: 'cache',
        styles: 'cache',
        worksheets: 'emit',
      }
    );
    for await (const worksheetReader of reader) {
      worksheetReader.on('mergeCell', mergeCell => {
        expect(mergeCell).to.equal('A2:C4');
      });
      worksheetReader.read();
    }
  });
});
