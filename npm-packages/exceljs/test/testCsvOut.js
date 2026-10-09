const Workbook = require('../lib/doc/workbook');

const filename = process.argv[2];

const wb = new Workbook();
const ws = wb.addWorksheet('blort');

ws.columns = [
  {header: 'Col 1', key: 'key', width: 25},
  {header: 'Col 2', key: 'name', width: 25},
  {header: 'Col 3', key: 'age', width: 21},
  {header: 'Col 4', key: 'addr1', width: 18},
  {header: 'Col 5', key: 'addr2', width: 8},
];

ws.getCell('A2').value = 7;
ws.getCell('B2').value = 'Hello, World!';

ws.getCell('C2').value = -5.55;

ws.getCell('D2').value = 3.14;
ws.getCell('D2').value = new Date(2015, 2, 10, 7, 8, 9);

ws.getCell('E2').value = `${['Hello', 'World'].join(', ')}!`;

ws.getCell('A3').value = {
  text: 'www.google.com',
  hyperlink: 'http://www.google.com',
};
ws.getCell('A4').value = 'Boo!';
ws.getCell('C4').value = 'Hoo!';

ws.getCell('A5').value = 1;
ws.getCell('B5').value = 2;
ws.getCell('C5').value = {formula: 'A5+B5', result: 3};

ws.getCell('A6').value = 'Hello';
ws.getCell('B6').value = 'World';
ws.getCell('C6').value = {
  formula: 'CONCATENATE(A6,", ",B6,"!")',
  result: 'Hello, World!',
};

ws.getCell('A7').value = 1;
ws.getCell('B7').value = 2;
ws.getCell('D7').value = 4;

ws.getCell('A10').value = '<';
ws.getCell('B10').value = '>';
ws.getCell('C10').value = '<a>';
ws.getCell('D10').value = '><';

const options = {
  dateFormat: 'DD/MM/YYYY HH:mm:ss',
};

wb.csv
  .writeFile(filename, options)
  .then(() => {
    console.log('Done.');
  })
  .catch(error => {
    console.log(error.message);
  });
