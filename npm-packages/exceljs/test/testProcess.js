const Excel = require('../excel');

const [, , inputFile, outputFile] = process.argv;

const wb = new Excel.Workbook();

let passed = true;
const assert = function(value, failMessage, passMessage) {
  if (!value) {
    if (failMessage) {
      console.error(failMessage);
    }
    passed = false;
  } else if (passMessage) {
    console.log(passMessage);
  }
};

// assuming file created by testBookOut
wb.xlsx
  .readFile(inputFile)
  .then(() => {
    console.log('Loaded', inputFile);

    wb.eachSheet(sheet => {
      console.log(sheet.name);
    });

    const ws = wb.getWorksheet('Sheet1');

    assert(ws, 'Expected to find a worksheet called sheet1');

    ws.getCell('B1').value = new Date();
    ws.getCell('B1').numFmt = 'hh:mm:ss';

    ws.addRow([1, 'hello']);
    return wb.xlsx.writeFile(outputFile);
  })
  .then(() => {
    assert(passed, 'Something went wrong', 'All tests passed!');
  })
  .catch(error => {
    console.error(error.message);
    console.error(error.stack);
  });
