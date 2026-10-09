const simpleWorkbookModel = require('../data/simpleWorkbook.json');
const testUtils = require('../../utils/index');

const Excel = verquire('exceljs');

// =============================================================================
// Helpers

function createSimpleWorkbook() {
  const wb = new Excel.Workbook();
  const ws = wb.addWorksheet('blort');

  // plain number
  ws.getCell('A1').value = 7;
  ws.getCell('A1').name = 'Seven';

  // simple string
  ws.getCell('B1').value = 'Hello, World!';
  ws.getCell('B1').name = 'Hello';

  // floating point
  ws.getCell('C1').value = 3.14;

  // date-time
  ws.getCell('D1').value = new Date();
  ws.getCell('D1').dataValidation = {
    type: 'date',
    operator: 'greaterThan',
    showErrorMessage: true,
    allowBlank: true,
    formulae: [new Date(2016, 0, 1)],
  };
  // hyperlink
  ws.getCell('E1').value = {
    text: 'www.google.com',
    hyperlink: 'http://www.google.com',
  };

  // number formula
  ws.getCell('A2').value = {formula: 'A1', result: 7};
  ws.getCell('A2').name = 'TheFormula';

  // string formula
  ws.getCell('B2').value = {
    formula: 'CONCATENATE("Hello", ", ", "World!")',
    result: 'Hello, World!',
  };
  ws.getCell('B2').name = 'TheFormula';

  // date formula
  ws.getCell('C2').value = {formula: 'D1', result: new Date()};
  ws.getCell('C3').value = {formula: 'D1'};

  return wb;
}

// =============================================================================
// Tests

describe('Workbook', () => {
  it('stores shared string values properly', () => {
    const wb = new Excel.Workbook();
    const ws = wb.addWorksheet('blort');

    ws.getCell('A1').value = 'Hello, World!';

    ws.getCell('A2').value = 'Hello';
    ws.getCell('B2').value = 'World';
    ws.getCell('C2').value = {
      formula: 'CONCATENATE(A2, ", ", B2, "!")',
      result: 'Hello, World!',
    };

    ws.getCell('A3').value = `${['Hello', 'World'].join(', ')}!`;

    // A1 and A3 should reference the same string object
    expect(ws.getCell('A1').value).to.equal(ws.getCell('A3').value);

    // A1 and C2 should not reference the same object
    expect(ws.getCell('A1').value).to.equal(ws.getCell('C2').value.result);
  });

  it('assigns cell types properly', () => {
    const wb = createSimpleWorkbook();
    const ws = wb.getWorksheet('blort');

    expect(ws.getCell('A1').type).to.equal(Excel.ValueType.Number);
    expect(ws.getCell('B1').type).to.equal(Excel.ValueType.String);
    expect(ws.getCell('C1').type).to.equal(Excel.ValueType.Number);
    expect(ws.getCell('D1').type).to.equal(Excel.ValueType.Date);
    expect(ws.getCell('E1').type).to.equal(Excel.ValueType.Hyperlink);

    expect(ws.getCell('A2').type).to.equal(Excel.ValueType.Formula);
    expect(ws.getCell('B2').type).to.equal(Excel.ValueType.Formula);
    expect(ws.getCell('C2').type).to.equal(Excel.ValueType.Formula);
  });

  it('assigns rich text', () => {
    const wb = new Excel.Workbook();
    const ws = wb.addWorksheet('blort');
    ws.getCell('A1').value = {
      richText: [
        {
          font: {
            size: 12,
            color: {theme: 0},
            name: 'Calibri',
            family: 2,
            scheme: 'minor',
          },
          text: 'This is ',
        },
        {
          font: {
            italic: true,
            size: 12,
            color: {theme: 0},
            name: 'Calibri',
            scheme: 'minor',
          },
          text: 'a',
        },
        {
          font: {
            size: 12,
            color: {theme: 1},
            name: 'Calibri',
            family: 2,
            scheme: 'minor',
          },
          text: ' ',
        },
        {
          font: {
            size: 12,
            color: {argb: 'FFFF6600'},
            name: 'Calibri',
            scheme: 'minor',
          },
          text: 'colorful',
        },
        {
          font: {
            size: 12,
            color: {theme: 1},
            name: 'Calibri',
            family: 2,
            scheme: 'minor',
          },
          text: ' text ',
        },
        {
          font: {
            size: 12,
            color: {argb: 'FFCCFFCC'},
            name: 'Calibri',
            scheme: 'minor',
          },
          text: 'with',
        },
        {
          font: {
            size: 12,
            color: {theme: 1},
            name: 'Calibri',
            family: 2,
            scheme: 'minor',
          },
          text: ' in-cell ',
        },
        {
          font: {
            bold: true,
            size: 12,
            color: {theme: 1},
            name: 'Calibri',
            family: 2,
            scheme: 'minor',
          },
          text: 'format',
        },
      ],
    };

    expect(ws.getCell('A1').text).to.equal(
      'This is a colorful text with in-cell format'
    );
    expect(ws.getCell('A1').type).to.equal(Excel.ValueType.RichText);
  });

  it.skip('serialises to model', () => {
    const wb = createSimpleWorkbook();
    expect(wb.model).to.deep.equal(simpleWorkbookModel);
  });

  it('returns undefined for non-existant sheet', () => {
    const wb = new Excel.Workbook();
    wb.addWorksheet('first');
    expect(wb.getWorksheet('w00t')).to.equal(undefined);
  });

  it('returns undefined for sheet 0', () => {
    const wb = new Excel.Workbook();
    wb.addWorksheet('first');
    expect(wb.getWorksheet(0)).to.equal(undefined);
  });

  it('returns undefined for sheet 0 after accessing wb.worksheets or wb.eachSheet ', () => {
    const wb = new Excel.Workbook();
    const sheet = wb.addWorksheet('first');

    wb.eachSheet(() => {});
    const numSheets = wb.worksheets.length;

    expect(numSheets).to.equal(1);
    expect(wb.getWorksheet(0)).to.equal(undefined);
    expect(wb.getWorksheet(1) === sheet).to.equal(true);
  });

  describe('duplicateRows', () => {
    it('inserts duplicates', () => {
      const wb = new Excel.Workbook();
      const ws = wb.addWorksheet('blort');
      ws.getCell('A1').value = '1.1';
      ws.getCell('A1').font = testUtils.styles.fonts.arialBlackUI14;
      ws.getCell('B1').value = '1.2';
      ws.getCell('B1').font = testUtils.styles.fonts.comicSansUdB16;
      ws.getCell('C1').value = '1.3';
      ws.getCell('C1').fill = testUtils.styles.fills.redDarkVertical;
      ws.getRow(1).numFmt = testUtils.styles.numFmts.numFmt1;

      ws.getCell('A2').value = '2.1';
      ws.getCell('A2').alignment = testUtils.styles.namedAlignments.topLeft;
      ws.getCell('B2').value = '2.2';
      ws.getCell('B2').alignment =
        testUtils.styles.namedAlignments.middleCentre;
      ws.getCell('C2').value = '2.3';
      ws.getCell('C2').alignment = testUtils.styles.namedAlignments.bottomRight;
      ws.getRow(2).numFmt = testUtils.styles.numFmts.numFmt2;

      ws.duplicateRow(1, 2, true);
      expect(ws.getRow(1).values).to.deep.equal([, '1.1', '1.2', '1.3']);
      expect(ws.getRow(2).values).to.deep.equal([, '1.1', '1.2', '1.3']);
      expect(ws.getRow(3).values).to.deep.equal([, '1.1', '1.2', '1.3']);
      expect(ws.getRow(4).values).to.deep.equal([, '2.1', '2.2', '2.3']);

      for (let i = 1; i <= 3; i++) {
        expect(ws.getCell(`A${i}`).font).to.deep.equal(
          testUtils.styles.fonts.arialBlackUI14
        );
        expect(ws.getCell(`B${i}`).font).to.deep.equal(
          testUtils.styles.fonts.comicSansUdB16
        );
        expect(ws.getCell(`C${i}`).fill).to.deep.equal(
          testUtils.styles.fills.redDarkVertical
        );
      }
      expect(ws.getCell('A4').alignment).to.deep.equal(
        testUtils.styles.namedAlignments.topLeft
      );
      expect(ws.getCell('B4').alignment).to.deep.equal(
        testUtils.styles.namedAlignments.middleCentre
      );
      expect(ws.getCell('C4').alignment).to.deep.equal(
        testUtils.styles.namedAlignments.bottomRight
      );

      expect(ws.getRow(1).numFmt).to.equal(testUtils.styles.numFmts.numFmt1);
      expect(ws.getRow(2).numFmt).to.equal(testUtils.styles.numFmts.numFmt1);
      expect(ws.getRow(3).numFmt).to.equal(testUtils.styles.numFmts.numFmt1);
      expect(ws.getRow(4).numFmt).to.equal(testUtils.styles.numFmts.numFmt2);
    });

    it('overwrites with duplicates', () => {
      const wb = new Excel.Workbook();
      const ws = wb.addWorksheet('blort');
      ws.getCell('A1').value = '1.1';
      ws.getCell('A1').font = testUtils.styles.fonts.arialBlackUI14;
      ws.getCell('B1').value = '1.2';
      ws.getCell('B1').font = testUtils.styles.fonts.comicSansUdB16;
      ws.getCell('C1').value = '1.3';
      ws.getCell('C1').fill = testUtils.styles.fills.redDarkVertical;
      ws.getRow(1).numFmt = testUtils.styles.numFmts.numFmt1;

      ws.getCell('A2').value = '2.1';
      ws.getCell('A2').alignment = testUtils.styles.namedAlignments.topLeft;
      ws.getCell('B2').value = '2.2';
      ws.getCell('B2').alignment =
        testUtils.styles.namedAlignments.middleCentre;
      ws.getCell('C2').value = '2.3';
      ws.getCell('C2').alignment = testUtils.styles.namedAlignments.bottomRight;
      ws.getRow(2).numFmt = testUtils.styles.numFmts.numFmt2;

      ws.getCell('A3').value = '3.1';
      ws.getCell('A3').fill = testUtils.styles.fills.redGreenDarkTrellis;
      ws.getCell('B3').value = '3.2';
      ws.getCell('B3').fill = testUtils.styles.fills.blueWhiteHGrad;
      ws.getCell('C3').value = '3.3';
      ws.getCell('C3').fill = testUtils.styles.fills.rgbPathGrad;
      ws.getRow(3).font = testUtils.styles.fonts.broadwayRedOutline20;

      ws.duplicateRow(1, 1, false);
      expect(ws.getRow(1).values).to.deep.equal([, '1.1', '1.2', '1.3']);
      expect(ws.getRow(2).values).to.deep.equal([, '1.1', '1.2', '1.3']);
      expect(ws.getRow(3).values).to.deep.equal([, '3.1', '3.2', '3.3']);

      for (let i = 1; i <= 2; i++) {
        expect(ws.getCell(`A${i}`).font).to.deep.equal(
          testUtils.styles.fonts.arialBlackUI14
        );
        expect(ws.getCell(`A${i}`).alignment).to.be.undefined();
        expect(ws.getCell(`B${i}`).font).to.deep.equal(
          testUtils.styles.fonts.comicSansUdB16
        );
        expect(ws.getCell(`B${i}`).alignment).to.undefined();
        expect(ws.getCell(`C${i}`).fill).to.deep.equal(
          testUtils.styles.fills.redDarkVertical
        );
        expect(ws.getCell(`C${i}`).alignment).to.undefined();
      }

      expect(ws.getRow(1).numFmt).to.equal(testUtils.styles.numFmts.numFmt1);
      expect(ws.getRow(2).numFmt).to.equal(testUtils.styles.numFmts.numFmt1);
      expect(ws.getRow(3).numFmt).to.be.undefined();
      expect(ws.getRow(3).font).to.deep.equal(
        testUtils.styles.fonts.broadwayRedOutline20
      );
    });
  });
});
