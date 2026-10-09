const Excel = require('../lib/exceljs.nodejs.js');
const HrStopwatch = require('./utils/hr-stopwatch');

const [, , filename] = process.argv;

const wb = new Excel.Workbook();
const ws = wb.addWorksheet('Foo');
ws.getCell('B2').value = 5;
ws.getCell('B2').note = {
  texts: [
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

ws.getCell('D2').value = 'Zoo';
ws.getCell('D2').note = 'Plain Text Comment';

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
