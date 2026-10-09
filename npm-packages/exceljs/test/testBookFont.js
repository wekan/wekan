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
      worksheet.eachRow(row => {
        row.eachCell(cell => {
          if (cell.font.strike) {
            console.log(`Strikethrough: ${cell.value}`);
          }
        });
      });
    });
  })
  .catch(error => {
    console.log(error.message);
  });
