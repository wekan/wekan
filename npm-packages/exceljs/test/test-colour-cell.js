const HrStopwatch = require('./utils/hr-stopwatch');

const Workbook = require('../lib/doc/workbook');

const filename = process.argv[2];

const wb = new Workbook();
const ws = wb.addWorksheet('blort');

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

ws.addRow([1, 2, 3, 4]);
ws.addRow(['one', 'two', 'three', 'four']);
ws.addRow(['une', 'deux', 'trois', 'quatre']);
ws.addRow(['uno', 'due', 'tre', 'quatro']);

ws.getCell('B2').fill = fills.redDarkVertical;

const stopwatch = new HrStopwatch();
stopwatch.start();
wb.xlsx
  .writeFile(filename)
  .then(() => {
    const micros = stopwatch.microseconds;
    console.log('Done.');
    console.log('Time taken:', micros);
  })
  .catch(error => {
    console.log(error.message);
  });
