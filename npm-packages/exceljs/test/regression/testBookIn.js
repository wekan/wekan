/* eslint-disable node/no-unpublished-require */
const _ = require('../../lib/utils/under-dash');
const ExcelJS = require('../../lib/exceljs.nodejs');

const HrStopwatch = require('./utils/hr-stopwatch');

const filename = process.argv[2];

const wb = new ExcelJS.Workbook();

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
  {
    text: 'Wrap Text - Wrapping Wrapping Wrappity Wrap Wrap Wrap',
    alignment: {wrapText: true},
  },
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

const borders = {
  thin: {
    top: {style: 'thin'},
    left: {style: 'thin'},
    bottom: {style: 'thin'},
    right: {style: 'thin'},
  },
  doubleRed: {
    top: {style: 'double', color: {argb: 'FFFF0000'}},
    left: {style: 'double', color: {argb: 'FFFF0000'}},
    bottom: {style: 'double', color: {argb: 'FFFF0000'}},
    right: {style: 'double', color: {argb: 'FFFF0000'}},
  },
  thickRainbow: {
    top: {style: 'double', color: {argb: 'FFFF00FF'}},
    left: {style: 'double', color: {argb: 'FF00FFFF'}},
    bottom: {style: 'double', color: {argb: 'FF00FF00'}},
    right: {style: 'double', color: {argb: 'FFFF00FF'}},
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

let passed = true;
const assert = function(value, failMessage, passMessage) {
  if (!value) {
    if (failMessage) console.log(failMessage);
    passed = false;
  } else if (passMessage) console.log(passMessage);
};

const assertFont = function(value, expected, address) {
  assert(value, `Expected to find font object at ${address}`);
  _.each(expected, (item, name) => {
    assert(
      value[name] === expected[name],
      `Expected ${address}.font[${name}] to be ${expected[name]}, but was ${value[name]}`
    );
  });
  _.each(value, (item, name) => {
    assert(
      expected[name],
      `Found unexpected ${address}.font[${name}] = ${value[name]}`
    );
  });
};

const assertEqual = function(address, name, value, expected) {
  assert(
    _.isEqual(value, expected),
    `Expected Cell[${address}] ${name} to be ${JSON.stringify(
      expected
    )}, was ${JSON.stringify(value)}`
  );
};

const stopwatch = new HrStopwatch();
stopwatch.start();

// assuming file created by testBookOut
wb.xlsx.readFile(filename).then(() => {
  const micros = stopwatch.microseconds;

  console.log('Loaded', filename);
  console.log('Time taken:', micros);

  const ws = wb.getWorksheet('blort');

  assert(ws, 'Expected to find a worksheet called blort');

  const column1 = ws.getColumn(1);
  assert(
    column1 && column1.width === 25,
    `Expected column width of col 1 to be 25, was ${column1.width}`
  );
  const column9 = ws.getColumn(9);
  assert(
    column9 && column9.hidden,
    `Expected column 9 to be hidden: \n${JSON.stringify(
      column9.defn,
      null,
      '  '
    )}`
  );

  const row16 = ws.getRow(16);
  assert(row16 && row16.hidden, 'Expected row 16 to be hidden');

  assert(ws.getCell('A2').value === 7, 'Expected A2 === 7');
  assert(
    ws.getCell('B2').value === 'Hello, World!',
    `Expected B2 === "Hello, World!", was "${ws.getCell('B2').value}"`
  );
  assertFont(ws.getCell('B2').font, fonts.comicSansUdB16, 'B2');
  assertEqual('B2', 'border', ws.getCell('B2').border, borders.thin);

  assert(
    Math.abs(ws.getCell('C2').value + 5.55) < 0.000001,
    `Expected C2 === -5.55, was${ws.getCell('C2').value}`
  );
  assert(
    ws.getCell('C2').numFmt === '"£"#,##0.00;[Red]-"£"#,##0.00',
    `Expected C2 numFmt to be "£"#,##0.00;[Red]-"£"#,##0.00, was ${
      ws.getCell('C2').numFmt
    }`
  );
  assertFont(ws.getCell('C2').font, fonts.arialBlackUI14, 'C2');

  assert(
    ws.getCell('D2').value instanceof Date,
    `expected D2 to be a Date, was ${ws.getCell('D2').value}`
  );
  assertEqual('D2', 'border', ws.getCell('D2').border, borders.doubleRed);

  assert(
    ws.getCell('C5').value.formula,
    `Expected C5 to be a formula, was ${JSON.stringify(ws.getCell('C5').value)}`
  );
  assertEqual('C6', 'border', ws.getCell('C6').border, borders.thickRainbow);

  assert(
    ws.getCell('A9').numFmt === '# ?/?',
    `Expected A9 numFmt to be "# ?/?", was ${ws.getCell('A9').numFmt}`
  );
  assert(
    ws.getCell('B9').numFmt === 'h:mm:ss',
    `Expected B9 numFmt to be "h:mm:ss", was ${ws.getCell('B9').numFmt}`
  );
  assert(
    ws.getCell('C9').numFmt === '0.00%',
    `Expected C9 numFmt to be "0.00%", was ${ws.getCell('C9').numFmt}`
  );
  assert(
    ws.getCell('D9').numFmt === '[Green]#,##0 ;[Red](#,##0)',
    `Expected D9 numFmt to be "[Green]#,##0 ;[Red](#,##0)", was ${
      ws.getCell('D9').numFmt
    }`
  );
  assert(
    ws.getCell('E9').numFmt === '#0.000',
    `Expected E9 numFmt to be "#0.000", was ${ws.getCell('E9').numFmt}`
  );
  assert(
    ws.getCell('F9').numFmt === '# ?/?%',
    `Expected F9 numFmt to be "# ?/?%", was ${ws.getCell('F9').numFmt}`
  );

  assert(
    ws.getCell('A10').value === '<',
    `Expected A10 to be "<", was "${ws.getCell('A10').value}"`
  );
  assert(
    ws.getCell('B10').value === '>',
    `Expected A10 to be ">", was "${ws.getCell('B10').value}"`
  );
  assert(
    ws.getCell('C10').value === '<a>',
    `Expected A10 to be "<a>", was "${ws.getCell('C10').value}"`
  );
  assert(
    ws.getCell('D10').value === '><',
    `Expected A10 to be "><", was "${ws.getCell('D10').value}"`
  );

  assert(
    ws.getRow(11).height === 40,
    `Expected Row 11 to be height 40, was ${ws.getRow(11).height}`
  );
  _.each(alignments, (alignment, index) => {
    const rowNumber = 11;
    const colNumber = index + 1;
    const cell = ws.getCell(rowNumber, colNumber);
    assert(
      cell.value === alignment.text,
      `Expected Cell[${rowNumber},${colNumber}] to be ${alignment.text}, was ${cell.value}`
    );
    assert(
      _.isEqual(cell.alignment, alignment.alignment),
      `Expected Cell[${rowNumber},${colNumber}] alignment to be ${JSON.stringify(
        alignment.alignment
      )}, was ${JSON.stringify(cell.alignment)}`
    );
  });

  const row12 = ws.getRow(12);
  assert(
    row12.height === 40,
    `Expected Row 12 to be height 40, was ${row12.height}`
  );
  assert(
    _.isEqual(row12.getCell(1).fill, fills.blueWhiteHGrad),
    `Expected [12,1] fill to be ${JSON.stringify(
      fills.blueWhiteHGrad
    )}, was ${JSON.stringify(row12.getCell(1).fill)}`
  );
  assert(
    _.isEqual(row12.getCell(2).fill, fills.redDarkVertical),
    `Expected [12,2] fill to be ${JSON.stringify(
      fills.redDarkVertical
    )}, was ${JSON.stringify(row12.getCell(2).fill)}`
  );
  assert(
    _.isEqual(row12.getCell(3).fill, fills.redGreenDarkTrellis),
    `Expected [12,3] fill to be ${JSON.stringify(
      fills.redGreenDarkTrellis
    )}, was ${JSON.stringify(row12.getCell(3).fill)}`
  );
  assert(
    _.isEqual(row12.getCell(4).fill, fills.rgbPathGrad),
    `Expected [12,4] fill to be ${JSON.stringify(
      fills.rgbPathGrad
    )}, was ${JSON.stringify(row12.getCell(4).fill)}`
  );

  assertFont(ws.getRow(13).font, fonts.arialBlackUI14, 'Row 13');
  assertFont(ws.getCell('H12').font, fonts.comicSansUdB16, 'H12');
  assertFont(ws.getCell('G13').font, fonts.arialBlackUI14, 'G13');
  assertFont(ws.getCell('H13').font, fonts.arialBlackUI14, 'H13');
  assertFont(ws.getCell('I13').font, fonts.arialBlackUI14, 'I13');
  assertFont(ws.getCell('H14').font, fonts.comicSansUdB16, 'H14');

  assert(
    ws.getCell('H12').value === 'Foo',
    `Expected H12 to be "Foo", was "${ws.getCell('H12').value}"`
  );
  assert(
    ws.getCell('G13').value === 'Foo',
    `Expected G13 to be "Foo", was "${ws.getCell('G13').value}"`
  );
  assert(
    ws.getCell('H13').value === 'Bar',
    `Expected H13 to be "Bar", was "${ws.getCell('H13').value}"`
  );
  assert(
    ws.getCell('I13').value === 'Baz',
    `Expected I13 to be "Baz", was "${ws.getCell('I13').value}"`
  );
  assert(
    ws.getCell('H14').value === 'Baz',
    `Expected H14 to be "Baz", was "${ws.getCell('H14').value}"`
  );

  assert(passed, 'Something went wrong', 'All tests passed!');
});
