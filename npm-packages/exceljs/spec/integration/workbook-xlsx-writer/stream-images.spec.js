const {Readable} = require('stream');

const ExcelJS = verquire('exceljs');

const TEST_XLSX_FILE_NAME = './spec/out/wb-stream-images.test.xlsx';
// A 1x1 PNG.
const PNG = Buffer.from(
  '89504e470d0a1a0a0000000d4948445200000001000000010806000000' +
    '1f15c4890000000d4944415478da63f8ffff3f0005fe02fea7a6c5e10000000049454e44ae426082',
  'hex'
);

describe('WorkbookWriter images', () => {
  it('places images over cells and reads each image only when it is written', async () => {
    const wb = new ExcelJS.stream.xlsx.WorkbookWriter({filename: TEST_XLSX_FILE_NAME});
    let opened = 0;
    let open = 0;
    let maxOpen = 0;
    const lazy = () => () => {
      opened++;
      open++;
      maxOpen = Math.max(maxOpen, open);
      const stream = Readable.from([PNG.subarray(0, 10), PNG.subarray(10)]);
      stream.on('end', () => {
        open--;
      });
      return stream;
    };
    const ids = [0, 1, 2, 3].map(() => wb.addImage({stream: lazy(), extension: 'png'}));
    const fromBuffer = wb.addImage({buffer: PNG, extension: 'png'});

    const ws = wb.addWorksheet('One');
    ws.addRow(['Title']).commit();
    ws.addImage(ids[0], 'C1:D3');
    ws.addRow(['Row 2']).commit();
    ws.addImage(ids[1], {tl: {col: 1, row: 5}, ext: {width: 50, height: 40}});
    ws.addImage(ids[1], 'F1:G2');
    ws.addImage(fromBuffer, 'H1:H1');
    ws.addRow(['Row 3']).commit();
    ws.addBackgroundImage(ids[2]);
    const ws2 = wb.addWorksheet('Two');
    ws2.addRow(['a']).commit();
    ws2.addImage(ids[3], 'B2:C3');
    ws.commit();
    ws2.commit();

    expect(opened).to.equal(0);
    await wb.commit();
    expect(opened).to.equal(4);
    expect(maxOpen).to.equal(1);

    const wb2 = new ExcelJS.Workbook();
    await wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
    const [one, two] = wb2.worksheets;
    // An anchor does not make rows, so addRow is not moved by it.
    expect(one.getRow(3).values.slice(1)).to.deep.equal(['Row 3']);
    expect(one.getImages().length).to.equal(4);
    expect(one.getImages()[0].range.tl.nativeCol).to.equal(2);
    expect(two.getImages().length).to.equal(1);
    expect(wb2.model.media.length).to.equal(5);
    wb2.model.media.forEach(medium => {
      expect(Buffer.from(medium.buffer).equals(PNG)).to.equal(true);
    });
  });

  it('rejects the commit when an image stream fails', async () => {
    const wb = new ExcelJS.stream.xlsx.WorkbookWriter({filename: TEST_XLSX_FILE_NAME});
    const id = wb.addImage({
      stream: () =>
        new Readable({
          read() {
            this.destroy(new Error('gone'));
          },
        }),
      extension: 'png',
    });
    const ws = wb.addWorksheet('x');
    ws.addImage(id, 'A1:B2');
    ws.commit();
    let error;
    try {
      await wb.commit();
    } catch (e) {
      error = e;
    }
    expect(error && error.message).to.equal('gone');
  });

  it('rejects an image whose stream is not a stream', async () => {
    const wb = new ExcelJS.stream.xlsx.WorkbookWriter({filename: TEST_XLSX_FILE_NAME});
    wb.addImage({stream: () => 'not a stream', extension: 'png'});
    wb.addWorksheet('x').commit();
    let error;
    try {
      await wb.commit();
    } catch (e) {
      error = e;
    }
    expect(error && error.message).to.match(/not a readable stream/);
  });
});
