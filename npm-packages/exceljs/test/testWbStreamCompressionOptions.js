const Excel = require('../excel');
const utils = require('../spec/utils/index');

const filename = process.argv[2];
console.log(filename);
const optionsBestCompression = {
  filename,
  useStyles: true,
  zip: {
    zlib: {level: 9}, // Sets the compression level.
  },
};
const wb = new Excel.stream.xlsx.WorkbookWriter(optionsBestCompression);
const ws = wb.addWorksheet('blort');

const style = {
  font: utils.styles.fonts.comicSansUdB16,
  alignment: utils.styles.alignments[1].alignment,
};
ws.columns = [
  {header: 'A1', width: 10},
  {header: 'B1', width: 20, style},
  {header: 'C1', width: 30},
];

ws.getRow(2).font = utils.styles.fonts.broadwayRedOutline20;

ws.getCell('A2').value = 'A2';
ws.getCell('B2').value = 'B2';
ws.getCell('C2').value = 'C2';
ws.getCell('A3').value = 'A3';
ws.getCell('B3').value = 'B3';
ws.getCell('C3').value = 'C3';

wb.commit().then(() => {
  console.log('Done');
  // var wb2 = new Excel.Workbook();
  // return wb2.xlsx.readFile('./wb.test2.xlsx');
});

const filename2 = process.argv[3];
console.log(filename2);
const optionsBestSpeed = {
  filename: filename2,
  useStyles: true,
  zip: {
    zlib: {level: 1}, // Sets the compression level.
  },
};
const wb2 = new Excel.stream.xlsx.WorkbookWriter(optionsBestSpeed);
const ws2 = wb2.addWorksheet('blort');

ws2.columns = [
  {header: 'A1', width: 10},
  {header: 'B1', width: 20, style},
  {header: 'C1', width: 30},
];

ws2.getRow(2).font = utils.styles.fonts.broadwayRedOutline20;

ws2.getCell('A2').value = 'A2';
ws2.getCell('B2').value = 'B2';
ws2.getCell('C2').value = 'C2';
ws2.getCell('A3').value = 'A3';
ws2.getCell('B3').value = 'B3';
ws2.getCell('C3').value = 'C3';

wb2.commit().then(() => {
  console.log('Done');
  // var wb2 = new Excel.Workbook();
  // return wb2.xlsx.readFile('./wb.test2.xlsx');
});

const filename3 = process.argv[4];
console.log(filename3);
const options = {
  filename: filename3,
  useStyles: true,
};
const wb3 = new Excel.stream.xlsx.WorkbookWriter(options);
const ws3 = wb3.addWorksheet('blort');

ws3.columns = [
  {header: 'A1', width: 10},
  {header: 'B1', width: 20, style},
  {header: 'C1', width: 30},
];

ws3.getRow(2).font = utils.styles.fonts.broadwayRedOutline20;

ws3.getCell('A2').value = 'A2';
ws3.getCell('B2').value = 'B2';
ws3.getCell('C2').value = 'C2';
ws3.getCell('A3').value = 'A3';
ws3.getCell('B3').value = 'B3';
ws3.getCell('C3').value = 'C3';

wb3.commit().then(() => {
  console.log('Done');
  // var wb2 = new Excel.Workbook();
  // return wb2.xlsx.readFile('./wb.test2.xlsx');
});
