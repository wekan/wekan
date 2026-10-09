const Excel = require('../excel');

const filename = process.argv[2];

(async () => {
  const workbook = new Excel.stream.xlsx.WorkbookWriter({
    filename,
    useSharedStrings: true,
  });

  const worksheet = workbook.addWorksheet('myWorksheet');
  const sheetRow = worksheet.addRow(['Hello']);
  sheetRow.commit();

  worksheet.commit();
  await workbook.commit();
})();
