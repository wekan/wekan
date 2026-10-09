// --------------------------------------------------
// This enables the generation of a XLSX pivot table
// with several restrictions
//
// Last updated: 2023-10-19
// --------------------------------------------------
/* eslint-disable */

function main(filepath) {
  const Excel = require('../lib/exceljs.nodejs.js');

  const workbook = new Excel.Workbook();

  const worksheet1 = workbook.addWorksheet('Sheet1');
  worksheet1.addRows([
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    ['a1', 'b1', 'c1', 'd1', 'e1', 'f1', 4, 5],
    ['a1', 'b2', 'c1', 'd2', 'e1', 'f1', 4, 5],
    ['a2', 'b1', 'c2', 'd1', 'e2', 'f1', 14, 24],
    ['a2', 'b2', 'c2', 'd2', 'e2', 'f2', 24, 35],
    ['a3', 'b1', 'c3', 'd1', 'e3', 'f2', 34, 45],
    ['a3', 'b2', 'c3', 'd2', 'e3', 'f2', 44, 45],
  ]);

  const worksheet2 = workbook.addWorksheet('Sheet2');
  worksheet2.addPivotTable({
    // Source of data: the entire sheet range is taken;
    // akin to `worksheet1.getSheetValues()`.
    sourceSheet: worksheet1,
    // Pivot table fields: values indicate field names;
    // they come from the first row in `worksheet1`.
    rows: ['A', 'B', 'E'],
    columns: ['C', 'D'],
    values: ['H'], // only 1 item possible for now
    metric: 'sum', // only 'sum' possible for now
  });

  save(workbook, filepath);
}

function save(workbook, filepath) {
  const HrStopwatch = require('./utils/hr-stopwatch');
  const stopwatch = new HrStopwatch();
  stopwatch.start();

  workbook.xlsx.writeFile(filepath).then(() => {
    const microseconds = stopwatch.microseconds;
    console.log('Done.');
    console.log('Time taken:', microseconds);
  });
}

const [, , filepath] = process.argv;
main(filepath);
