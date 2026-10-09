const HrStopwatch = require('./utils/hr-stopwatch');

const Workbook = require('../lib/doc/workbook');

const filename = process.argv[2];

const wb = new Workbook();
const ws = wb.addWorksheet('blort');

ws.addRow([1, 2, 3, 4]);
ws.addRow(['one', 'two', 'three', 'four']);
ws.addRow(['une', 'deux', 'trois', 'quatre']);
ws.addRow(['uno', 'due', 'tre', 'quatro']);

ws.mergeCells('B2:C3');
ws.getCell('B2').alignment = {horizontal: 'center', vertical: 'middle'};

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
