const _ = require('../lib/utils/under-dash.js');
const Excel = require('../excel');

// const { Workbook } = Excel;
const {WorkbookWriter} = Excel.stream.xlsx;

const filename = process.argv[2];

const wb = new WorkbookWriter({
  filename,
  useSharedStrings: false,
  useStyles: false,
});
const ws = wb.addWorksheet('blort');

const fonts = {
  arialBlackUI14: {
    name: 'Arial Black',
    family: 2,
    size: 14,
    underline: true,
    italic: true,
  },
  comicSansUdB16: {
    name: 'Comic Sans MS',
    family: 4,
    size: 16,
    underline: 'double',
    bold: true,
  },
};

const alignments = [
  {text: 'Top Left', alignment: {horizontal: 'left', vertical: 'top'}},
  {
    text: 'Middle Centre',
    alignment: {horizontal: 'center', vertical: 'middle'},
  },
  {
    text: 'Bottom Right',
    alignment: {horizontal: 'right', vertical: 'bottom'},
  },
  {text: 'Wrap Text', alignment: {wrapText: true}},
  {text: 'Indent 1', alignment: {indent: 1}},
  {text: 'Indent 2', alignment: {indent: 2}},
  {
    text: 'Rotate 15',
    alignment: {horizontal: 'right', vertical: 'bottom', textRotation: 15},
  },
  {
    text: 'Rotate 30',
    alignment: {horizontal: 'right', vertical: 'bottom', textRotation: 30},
  },
  {
    text: 'Rotate 45',
    alignment: {horizontal: 'right', vertical: 'bottom', textRotation: 45},
  },
  {
    text: 'Rotate 60',
    alignment: {horizontal: 'right', vertical: 'bottom', textRotation: 60},
  },
  {
    text: 'Rotate 75',
    alignment: {horizontal: 'right', vertical: 'bottom', textRotation: 75},
  },
  {
    text: 'Rotate 90',
    alignment: {horizontal: 'right', vertical: 'bottom', textRotation: 90},
  },
  {
    text: 'Rotate -15',
    alignment: {horizontal: 'right', vertical: 'bottom', textRotation: -55},
  },
  {
    text: 'Rotate -30',
    alignment: {horizontal: 'right', vertical: 'bottom', textRotation: -30},
  },
  {
    text: 'Rotate -45',
    alignment: {horizontal: 'right', vertical: 'bottom', textRotation: -45},
  },
  {
    text: 'Rotate -60',
    alignment: {horizontal: 'right', vertical: 'bottom', textRotation: -60},
  },
  {
    text: 'Rotate -75',
    alignment: {horizontal: 'right', vertical: 'bottom', textRotation: -75},
  },
  {
    text: 'Rotate -90',
    alignment: {horizontal: 'right', vertical: 'bottom', textRotation: -90},
  },
  {
    text: 'Vertical Text',
    alignment: {
      horizontal: 'right',
      vertical: 'bottom',
      textRotation: 'vertical',
    },
  },
];
// const badAlignments = [
//   { text: 'Rotate -91', alignment: { textRotation: -91 } },
//   { text: 'Rotate 91', alignment: { textRotation: 91 } },
//   { text: 'Indent -1', alignment: { indent: -1 } },
//   { text: 'Blank', alignment: {} },
// ];

const borders = {
  thin: {
    top: {style: 'thin'},
    left: {style: 'thin'},
    bottom: {style: 'thin'},
    right: {style: 'thin'},
  },
  doubleRed: {
    color: {argb: 'FFFF0000'},
    top: {style: 'double'},
    left: {style: 'double'},
    bottom: {style: 'double'},
    right: {style: 'double'},
  },
  thickRainbow: {
    top: {style: 'double', color: {argb: 'FFFF00FF'}},
    left: {style: 'double', color: {argb: 'FF00FFFF'}},
    bottom: {style: 'double', color: {argb: 'FF00FF00'}},
    right: {style: 'double', color: {argb: 'FF00FF'}},
    diagonal: {
      style: 'double',
      color: {argb: 'FFFFFF00'},
      up: true,
      down: true,
    },
  },
};

const fills = {
  redDarkVertical: {
    type: 'pattern',
    pattern: 'darkVertical',
    fgColor: {argb: 'FFFF0000'},
  },
  redGreenDarkTrellis: {
    type: 'pattern',
    pattern: 'darkTrellis',
    fgColor: {argb: 'FFFF0000'},
    bgColor: {argb: 'FF00FF00'},
  },
  blueWhiteHGrad: {
    type: 'gradient',
    gradient: 'angle',
    degree: 0,
    stops: [
      {position: 0, color: {argb: 'FF0000FF'}},
      {position: 1, color: {argb: 'FFFFFFFF'}},
    ],
  },
  rgbPathGrad: {
    type: 'gradient',
    gradient: 'path',
    center: {left: 0.5, top: 0.5},
    stops: [
      {position: 0, color: {argb: 'FFFF0000'}},
      {position: 0.5, color: {argb: 'FF00FF00'}},
      {position: 1, color: {argb: 'FF0000FF'}},
    ],
  },
};

ws.columns = [
  {header: 'Col 1', key: 'key', width: 25},
  {header: 'Col 2', key: 'name', width: 32},
  {header: 'Col 3', key: 'age', width: 21},
  {header: 'Col 4', key: 'addr1', width: 18},
  {header: 'Col 5', key: 'addr2', width: 8},
  {header: 'Col 6', width: 8},
  {header: 'Col 7', width: 8},
  {
    header: 'Col 8',
    width: 8,
    style: {font: fonts.comicSansUdB16, alignment: alignments[1].alignment},
  },
];

ws.getCell('A2').value = 7;
ws.getCell('B2').value = 'Hello, World!';
ws.getCell('B2').font = fonts.comicSansUdB16;
ws.getCell('B2').border = borders.thin;

ws.getCell('C2').value = -5.55;
ws.getCell('C2').numFmt = '"£"#,##0.00;[Red]-"£"#,##0.00';
ws.getCell('C2').font = fonts.arialBlackUI14;

ws.getCell('D2').value = 3.14;
ws.getCell('D2').value = new Date();
ws.getCell('D2').numFmt = 'd-mmm-yyyy';
ws.getCell('D2').font = fonts.comicSansUdB16;
ws.getCell('D2').border = borders.doubleRed;

ws.getCell('E2').value = `${['Hello', 'World'].join(', ')}!`;
ws.getRow(2).commit();

ws.getCell('A3').value = {
  text: 'www.google.com',
  hyperlink: 'http://www.google.com',
};
ws.getCell('A4').value = 'Boo!';
ws.getCell('C4').value = 'Hoo!';
ws.mergeCells('A4', 'C4');
ws.getRow(4).commit();

ws.getCell('A5').value = 1;
ws.getCell('B5').value = 2;
ws.getCell('C5').value = {formula: 'A5+B5', result: 3};
ws.getRow(5).commit();

ws.getCell('A6').value = 'Hello';
ws.getCell('B6').value = 'World';
ws.getCell('C6').value = {
  formula: 'CONCATENATE(A6,", ",B6,"!")',
  result: 'Hello, World!',
};
ws.getCell('C6').border = borders.thickRainbow;
ws.getRow(6).commit();

ws.getCell('A7').value = 1;
ws.getCell('B7').value = 2;
ws.getCell('C7').value = {formula: 'A7+B7'};
ws.getRow(7).commit();

const now = new Date();
ws.getCell('A8').value = now;
ws.getCell('B8').value = 0;
ws.getCell('C8').value = {formula: 'A8+B8', result: now};
ws.getRow(8).commit();

ws.getCell('A9').value = 1.6;
ws.getCell('A9').numFmt = '# ?/?';
ws.getCell('B9').value = 1.6;
ws.getCell('B9').numFmt = 'h:mm:ss';
ws.getCell('C9').value = 0.016;
ws.getCell('C9').numFmt = '0.00%';
ws.getCell('D9').value = 1.6;
ws.getCell('D9').numFmt = '[Green]#,##0 ;[Red](#,##0)';
ws.getCell('E9').value = 1.6;
ws.getCell('E9').numFmt = '#0.000';
ws.getCell('F9').value = 0.016;
ws.getCell('F9').numFmt = '# ?/?%';
ws.getRow(9).commit();

ws.getCell('A10').value = '<';
ws.getCell('B10').value = '>';
ws.getCell('C10').value = '<a>';
ws.getCell('D10').value = '><';
ws.getRow(10).commit();

ws.getRow(11).height = 40;
_.each(alignments, (alignment, index) => {
  const rowNumber = 11;
  const colNumber = index + 1;
  const cell = ws.getCell(rowNumber, colNumber);
  cell.value = alignment.text;
  cell.alignment = alignment.alignment;
});
ws.getRow(11).commit();

const row12 = ws.getRow(12);
row12.height = 40;
row12.getCell(1).value = 'Blue White Horizontal Gradient';
row12.getCell(1).fill = fills.blueWhiteHGrad;
row12.getCell(2).value = 'Red Dark Vertical';
row12.getCell(2).fill = fills.redDarkVertical;
row12.getCell(3).value = 'Red Green Dark Trellis';
row12.getCell(3).fill = fills.redGreenDarkTrellis;
row12.getCell(4).value = 'RGB Path Gradient';
row12.getCell(4).fill = fills.rgbPathGrad;

// row and column styles
ws.getRow(13).font = fonts.arialBlackUI14;
ws.getCell('H12').value = 'Foo';
ws.getCell('G13').value = 'Foo';
ws.getCell('H13').value = 'Bar';
ws.getCell('I13').value = 'Baz';
ws.getCell('H14').value = 'Baz';
// ws.getRow(13).commit();

wb.commit()
  .then(() => {
    console.log('Done.');
  })
  .catch(error => {
    console.log(error.message);
  });
