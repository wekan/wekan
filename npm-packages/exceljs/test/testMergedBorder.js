const Workbook = require('../lib/doc/workbook');

const filename = process.argv[2];

const wb = new Workbook();
const ws = wb.addWorksheet('blort');

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
};

ws.getCell('B2').value = 'Hello';
ws.mergeCells('B2:C2');
ws.getCell('B2').border = borders.thin;

ws.getCell('E2').value = 'World';
ws.mergeCells('E2:F3');
ws.getCell('E2').border = borders.thin;
ws.getCell('F2').border = borders.thin;
ws.getCell('E3').border = borders.thin;
ws.getCell('F3').border = borders.thin;

ws.getCell('H2').value = 'Broke';
ws.getCell('H2').border = borders.thin;
ws.mergeCells('H2:I3');
ws.getCell('I3').style = {};

wb.xlsx
  .writeFile(filename)
  .then(() => {
    console.log('Done.');
  })
  .catch(error => {
    console.log(error.message);
  });
