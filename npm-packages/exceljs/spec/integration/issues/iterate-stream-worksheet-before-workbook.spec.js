const fs = require('fs');
const {Readable} = require('stream');

const ExcelJS = verquire('exceljs');

describe('WorkbookReader with worksheet entry before workbook.xml in ZIP', () => {
  it('should parse all rows when worksheet ZIP entry precedes workbook.xml', async () => {
    // test/data/simple_excel.xlsx has ZIP entry order:
    //   xl/worksheets/sheet1.xml *before* xl/workbook.xml
    // This triggers the iterateStream early-termination bug on macOS/Node 22.
    const buffer = fs.readFileSync('./test/data/simple_excel.xlsx');
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(stream, {
      worksheets: 'emit',
      sharedStrings: 'cache',
      styles: 'cache',
    });

    const rows = [];
    for await (const worksheetReader of workbookReader) {
      for await (const row of worksheetReader) {
        rows.push(row.values.slice(1));
      }
    }

    // simple_excel.xlsx: 1 header row + 5 data rows
    expect(rows).to.have.length(6);
    expect(rows[1]).to.deep.equal([1, 'John', 28, 'Engineer']);
  });
});
