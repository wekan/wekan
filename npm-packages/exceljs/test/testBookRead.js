const Workbook = require('../lib/doc/workbook');

const filename = process.argv[2];

const workbook = new Workbook();
workbook.xlsx
  .readFile(filename)
  .then(() => {
    workbook.eachSheet(worksheet => {
      console.log(
        `Sheet ${worksheet.id} - ${worksheet.name}, Dims=${JSON.stringify(
          worksheet.dimensions
        )}`
      );
    });
  })
  .catch(error => {
    console.log(error.message);
  });
