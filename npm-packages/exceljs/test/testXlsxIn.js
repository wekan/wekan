'use strict';

const HrStopwatch = require('./utils/hr-stopwatch');
const Excel = require('../excel');

const filename = process.argv[2];
const wb = new Excel.Workbook();

const stopwatch = new HrStopwatch();
stopwatch.start();

wb.xlsx
  .readFile(filename)
  .then(() => {
    const micros = stopwatch.microseconds;

    console.log('Loaded', filename);
    console.log('Time taken:', micros / 1000000);

    wb.eachSheet((sheet, id) => {
      console.log(id, sheet.name);
    });
  })
  .catch(error => {
    console.error('something went wrong', error.stack);
  });
