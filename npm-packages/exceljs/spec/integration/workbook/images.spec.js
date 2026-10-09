const fs = require('fs');
const {promisify} = require('util');

const ExcelJS = verquire('exceljs');

const IMAGE_FILENAME = `${__dirname}/../data/image.png`;
const TEST_XLSX_FILE_NAME = './spec/out/wb.test.xlsx';
const fsReadFileAsync = promisify(fs.readFile);

// =============================================================================
// Tests

describe('Workbook', () => {
  describe('Images', () => {
    it('stores background image', () => {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('blort');
      let wb2;
      let ws2;
      const imageId = wb.addImage({
        filename: IMAGE_FILENAME,
        extension: 'jpeg',
      });

      ws.getCell('A1').value = 'Hello, World!';
      ws.addBackgroundImage(imageId);

      return wb.xlsx
        .writeFile(TEST_XLSX_FILE_NAME)
        .then(() => {
          wb2 = new ExcelJS.Workbook();
          return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
        })
        .then(() => {
          ws2 = wb2.getWorksheet('blort');
          expect(ws2).to.not.be.undefined();

          return fsReadFileAsync(IMAGE_FILENAME);
        })
        .then(imageData => {
          const backgroundId2 = ws2.getBackgroundImageId();
          const image = wb2.getImage(backgroundId2);

          expect(Buffer.compare(imageData, image.buffer)).to.equal(0);
        });
    });

    it('stores embedded image and hyperlink', () => {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('blort');
      let wb2;
      let ws2;

      const imageId = wb.addImage({
        filename: IMAGE_FILENAME,
        extension: 'jpeg',
      });

      ws.getCell('A1').value = 'Hello, World!';
      ws.getCell('A2').value = {
        hyperlink: 'http://www.somewhere.com',
        text: 'www.somewhere.com',
      };
      ws.addImage(imageId, 'C3:E6');

      return wb.xlsx
        .writeFile(TEST_XLSX_FILE_NAME)
        .then(() => {
          wb2 = new ExcelJS.Workbook();
          return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
        })
        .then(() => {
          ws2 = wb2.getWorksheet('blort');
          expect(ws2).to.not.be.undefined();

          expect(ws.getCell('A1').value).to.equal('Hello, World!');
          expect(ws.getCell('A2').value).to.deep.equal({
            hyperlink: 'http://www.somewhere.com',
            text: 'www.somewhere.com',
          });

          return fsReadFileAsync(IMAGE_FILENAME);
        })
        .then(imageData => {
          const images = ws2.getImages();
          expect(images.length).to.equal(1);

          const imageDesc = images[0];
          expect(imageDesc.range.tl.col).to.equal(2);
          expect(imageDesc.range.tl.row).to.equal(2);
          expect(imageDesc.range.br.col).to.equal(5);
          expect(imageDesc.range.br.row).to.equal(6);

          const image = wb2.getImage(imageDesc.imageId);
          expect(Buffer.compare(imageData, image.buffer)).to.equal(0);
        });
    });

    it('stores embedded image with oneCell', () => {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('blort');
      let wb2;
      let ws2;

      const imageId = wb.addImage({
        filename: IMAGE_FILENAME,
        extension: 'jpeg',
      });

      ws.addImage(imageId, {
        tl: {col: 0.1125, row: 0.4},
        br: {col: 2.101046875, row: 3.4},
        editAs: 'oneCell',
      });

      return wb.xlsx
        .writeFile(TEST_XLSX_FILE_NAME)
        .then(() => {
          wb2 = new ExcelJS.Workbook();
          return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
        })
        .then(() => {
          ws2 = wb2.getWorksheet('blort');
          expect(ws2).to.not.be.undefined();

          return fsReadFileAsync(IMAGE_FILENAME);
        })
        .then(imageData => {
          const images = ws2.getImages();
          expect(images.length).to.equal(1);

          const imageDesc = images[0];
          expect(imageDesc.range.editAs).to.equal('oneCell');

          const image = wb2.getImage(imageDesc.imageId);
          expect(Buffer.compare(imageData, image.buffer)).to.equal(0);
        });
    });

    it('stores embedded image with one-cell-anchor', () => {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('blort');
      let wb2;
      let ws2;

      const imageId = wb.addImage({
        filename: IMAGE_FILENAME,
        extension: 'jpeg',
      });

      ws.addImage(imageId, {
        tl: {col: 0.1125, row: 0.4},
        ext: {width: 100, height: 100},
        editAs: 'oneCell',
      });

      return wb.xlsx
        .writeFile(TEST_XLSX_FILE_NAME)
        .then(() => {
          wb2 = new ExcelJS.Workbook();
          return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
        })
        .then(() => {
          ws2 = wb2.getWorksheet('blort');
          expect(ws2).to.not.be.undefined();

          return fsReadFileAsync(IMAGE_FILENAME);
        })
        .then(imageData => {
          const images = ws2.getImages();
          expect(images.length).to.equal(1);

          const imageDesc = images[0];
          expect(imageDesc.range.editAs).to.equal('oneCell');
          expect(imageDesc.range.ext.width).to.equal(100);
          expect(imageDesc.range.ext.height).to.equal(100);

          const image = wb2.getImage(imageDesc.imageId);
          expect(Buffer.compare(imageData, image.buffer)).to.equal(0);
        });
    });

    it('stores embedded image with hyperlinks', () => {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('blort');
      let wb2;
      let ws2;

      const imageId = wb.addImage({
        filename: IMAGE_FILENAME,
        extension: 'jpeg',
      });

      ws.addImage(imageId, {
        tl: {col: 0.1125, row: 0.4},
        ext: {width: 100, height: 100},
        editAs: 'absolute',
        hyperlinks: {
          hyperlink: 'http://www.somewhere.com',
          tooltip: 'www.somewhere.com',
        },
      });

      return wb.xlsx
        .writeFile(TEST_XLSX_FILE_NAME)
        .then(() => {
          wb2 = new ExcelJS.Workbook();
          return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
        })
        .then(() => {
          ws2 = wb2.getWorksheet('blort');
          expect(ws2).to.not.be.undefined();

          return fsReadFileAsync(IMAGE_FILENAME);
        })
        .then(imageData => {
          const images = ws2.getImages();
          expect(images.length).to.equal(1);

          const imageDesc = images[0];
          expect(imageDesc.range.editAs).to.equal('absolute');
          expect(imageDesc.range.ext.width).to.equal(100);
          expect(imageDesc.range.ext.height).to.equal(100);

          expect(imageDesc.range.hyperlinks).to.deep.equal({
            hyperlink: 'http://www.somewhere.com',
            tooltip: 'www.somewhere.com',
          });

          const image = wb2.getImage(imageDesc.imageId);
          expect(Buffer.compare(imageData, image.buffer)).to.equal(0);
        });
    });

    it('image extensions should not be case sensitive', () => {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('blort');
      let wb2;
      let ws2;

      const imageId1 = wb.addImage({
        filename: IMAGE_FILENAME,
        extension: 'PNG',
      });

      const imageId2 = wb.addImage({
        filename: IMAGE_FILENAME,
        extension: 'JPEG',
      });

      ws.addImage(imageId1, {
        tl: {col: 0.1125, row: 0.4},
        ext: {width: 100, height: 100},
      });

      ws.addImage(imageId2, {
        tl: {col: 0.1125, row: 0.4},
        br: {col: 2.101046875, row: 3.4},
        editAs: 'oneCell',
      });

      return wb.xlsx
        .writeFile(TEST_XLSX_FILE_NAME)
        .then(() => {
          wb2 = new ExcelJS.Workbook();
          return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
        })
        .then(() => {
          ws2 = wb2.getWorksheet('blort');
          expect(ws2).to.not.be.undefined();

          return fsReadFileAsync(IMAGE_FILENAME);
        })
        .then(imageData => {
          const images = ws2.getImages();
          expect(images.length).to.equal(2);

          const imageDesc1 = images[0];
          expect(imageDesc1.range.ext.width).to.equal(100);
          expect(imageDesc1.range.ext.height).to.equal(100);
          const image1 = wb2.getImage(imageDesc1.imageId);

          const imageDesc2 = images[1];
          expect(imageDesc2.range.editAs).to.equal('oneCell');

          const image2 = wb2.getImage(imageDesc1.imageId);

          expect(Buffer.compare(imageData, image1.buffer)).to.equal(0);
          expect(Buffer.compare(imageData, image2.buffer)).to.equal(0);
        });
    });
  });
});
