const testUtils = require('../../utils/index');

const Excel = verquire('exceljs');

describe('Worksheet', () => {
  describe('Styles', () => {
    it('sets row styles', () => {
      const wb = new Excel.Workbook();
      const ws = wb.addWorksheet('basket');

      ws.getCell('A1').value = 5;
      ws.getCell('A1').numFmt = testUtils.styles.numFmts.numFmt1;
      ws.getCell('A1').font = testUtils.styles.fonts.arialBlackUI14;

      ws.getCell('C1').value = 'Hello, World!';
      ws.getCell('C1').alignment = testUtils.styles.namedAlignments.bottomRight;
      ws.getCell('C1').border = testUtils.styles.borders.doubleRed;
      ws.getCell('C1').fill = testUtils.styles.fills.redDarkVertical;

      ws.getRow(1).numFmt = testUtils.styles.numFmts.numFmt2;
      ws.getRow(1).font = testUtils.styles.fonts.comicSansUdB16;
      ws.getRow(1).alignment = testUtils.styles.namedAlignments.middleCentre;
      ws.getRow(1).border = testUtils.styles.borders.thin;
      ws.getRow(1).fill = testUtils.styles.fills.redGreenDarkTrellis;

      expect(ws.getCell('A1').numFmt).to.deep.equal(
        testUtils.styles.numFmts.numFmt2
      );
      expect(ws.getCell('A1').font).to.deep.equal(
        testUtils.styles.fonts.comicSansUdB16
      );
      expect(ws.getCell('A1').alignment).to.deep.equal(
        testUtils.styles.namedAlignments.middleCentre
      );
      expect(ws.getCell('A1').border).to.deep.equal(
        testUtils.styles.borders.thin
      );
      expect(ws.getCell('A1').fill).to.deep.equal(
        testUtils.styles.fills.redGreenDarkTrellis
      );

      expect(ws.findCell('B1')).to.be.undefined();

      expect(ws.getCell('C1').numFmt).to.deep.equal(
        testUtils.styles.numFmts.numFmt2
      );
      expect(ws.getCell('C1').font).to.deep.equal(
        testUtils.styles.fonts.comicSansUdB16
      );
      expect(ws.getCell('C1').alignment).to.deep.equal(
        testUtils.styles.namedAlignments.middleCentre
      );
      expect(ws.getCell('C1').border).to.deep.equal(
        testUtils.styles.borders.thin
      );
      expect(ws.getCell('C1').fill).to.deep.equal(
        testUtils.styles.fills.redGreenDarkTrellis
      );

      // when we 'get' the previously null cell, it should inherit the row styles
      expect(ws.getCell('B1').numFmt).to.deep.equal(
        testUtils.styles.numFmts.numFmt2
      );
      expect(ws.getCell('B1').font).to.deep.equal(
        testUtils.styles.fonts.comicSansUdB16
      );
      expect(ws.getCell('B1').alignment).to.deep.equal(
        testUtils.styles.namedAlignments.middleCentre
      );
      expect(ws.getCell('B1').border).to.deep.equal(
        testUtils.styles.borders.thin
      );
      expect(ws.getCell('B1').fill).to.deep.equal(
        testUtils.styles.fills.redGreenDarkTrellis
      );
    });

    it('sets col styles', () => {
      const wb = new Excel.Workbook();
      const ws = wb.addWorksheet('basket');

      ws.getCell('A1').value = 5;
      ws.getCell('A1').numFmt = testUtils.styles.numFmts.numFmt1;
      ws.getCell('A1').font = testUtils.styles.fonts.arialBlackUI14;

      ws.getCell('A3').value = 'Hello, World!';
      ws.getCell('A3').alignment = testUtils.styles.namedAlignments.bottomRight;
      ws.getCell('A3').border = testUtils.styles.borders.doubleRed;
      ws.getCell('A3').fill = testUtils.styles.fills.redDarkVertical;

      ws.getColumn('A').numFmt = testUtils.styles.numFmts.numFmt2;
      ws.getColumn('A').font = testUtils.styles.fonts.comicSansUdB16;
      ws.getColumn('A').alignment =
        testUtils.styles.namedAlignments.middleCentre;
      ws.getColumn('A').border = testUtils.styles.borders.thin;
      ws.getColumn('A').fill = testUtils.styles.fills.redGreenDarkTrellis;

      expect(ws.getCell('A1').numFmt).to.deep.equal(
        testUtils.styles.numFmts.numFmt2
      );
      expect(ws.getCell('A1').font).to.deep.equal(
        testUtils.styles.fonts.comicSansUdB16
      );
      expect(ws.getCell('A1').alignment).to.deep.equal(
        testUtils.styles.namedAlignments.middleCentre
      );
      expect(ws.getCell('A1').border).to.deep.equal(
        testUtils.styles.borders.thin
      );
      expect(ws.getCell('A1').fill).to.deep.equal(
        testUtils.styles.fills.redGreenDarkTrellis
      );

      expect(ws.findRow(2)).to.be.undefined();

      expect(ws.getCell('A3').numFmt).to.deep.equal(
        testUtils.styles.numFmts.numFmt2
      );
      expect(ws.getCell('A3').font).to.deep.equal(
        testUtils.styles.fonts.comicSansUdB16
      );
      expect(ws.getCell('A3').alignment).to.deep.equal(
        testUtils.styles.namedAlignments.middleCentre
      );
      expect(ws.getCell('A3').border).to.deep.equal(
        testUtils.styles.borders.thin
      );
      expect(ws.getCell('A3').fill).to.deep.equal(
        testUtils.styles.fills.redGreenDarkTrellis
      );

      // when we 'get' the previously null cell, it should inherit the column styles
      expect(ws.getCell('A2').numFmt).to.deep.equal(
        testUtils.styles.numFmts.numFmt2
      );
      expect(ws.getCell('A2').font).to.deep.equal(
        testUtils.styles.fonts.comicSansUdB16
      );
      expect(ws.getCell('A2').alignment).to.deep.equal(
        testUtils.styles.namedAlignments.middleCentre
      );
      expect(ws.getCell('A2').border).to.deep.equal(
        testUtils.styles.borders.thin
      );
      expect(ws.getCell('A2').fill).to.deep.equal(
        testUtils.styles.fills.redGreenDarkTrellis
      );
    });
  });
});
