const Excel = require('../excel');

const workbook = new Excel.Workbook();
const worksheet = workbook.addWorksheet('ExampleWS');

worksheet.columns = [
  {header: 'Id', key: 'id', width: 10},
  {header: 'Name', key: 'name', width: 32},
  {header: 'D.O.B.', key: 'dob', width: 10},
];

// Add a row by sparse Array (assign to columns A, E & I)
const rowValues = [];
rowValues[1] = 4;
rowValues[5] = 'Kyle';
rowValues[9] = new Date();
worksheet.addRow(rowValues);

const rows = [
  [5, 'Bob', new Date()], // row by array
  {id: 6, name: 'Barbara', dob: new Date()},
];
worksheet.addRows(rows);

// write in File
const strFilename = process.argv[2];
workbook.xlsx.writeFile(strFilename).then(() => {
  console.log('file OK');
});
