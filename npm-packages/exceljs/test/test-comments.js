const Excel = require('../lib/exceljs.nodejs.js');

const wb = new Excel.Workbook();
wb.xlsx
  .readFile(require.resolve('./data/comments.xlsx'))
  .then(() => {
    wb.worksheets.forEach(sheet => {
      console.info(sheet.getCell('A1').model);
      sheet.getCell('B2').value = 'Zeb';
      sheet.getCell('B2').comment = {
        texts: [
          {
            font: {
              size: 12,
              color: {theme: 0},
              name: 'Calibri',
              family: 2,
              scheme: 'minor',
            },
            text: 'This is ',
          },
          {
            font: {
              italic: true,
              size: 12,
              color: {theme: 0},
              name: 'Calibri',
              scheme: 'minor',
            },
            text: 'a',
          },
          {
            font: {
              size: 12,
              color: {theme: 1},
              name: 'Calibri',
              family: 2,
              scheme: 'minor',
            },
            text: ' ',
          },
          {
            font: {
              size: 12,
              color: {argb: 'FFFF6600'},
              name: 'Calibri',
              scheme: 'minor',
            },
            text: 'colorful',
          },
          {
            font: {
              size: 12,
              color: {theme: 1},
              name: 'Calibri',
              family: 2,
              scheme: 'minor',
            },
            text: ' text ',
          },
          {
            font: {
              size: 12,
              color: {argb: 'FFCCFFCC'},
              name: 'Calibri',
              scheme: 'minor',
            },
            text: 'with',
          },
          {
            font: {
              size: 12,
              color: {theme: 1},
              name: 'Calibri',
              family: 2,
              scheme: 'minor',
            },
            text: ' in-cell ',
          },
          {
            font: {
              bold: true,
              size: 12,
              color: {theme: 1},
              name: 'Calibri',
              family: 2,
              scheme: 'minor',
            },
            text: 'format',
          },
        ],
      };

      // sheet.getCell('D2').value = 'Zoo';
      // sheet.getCell('D2').comment = 'Plain Text Comment';
    });

    return wb.xlsx.writeFile(`${__dirname}/data/test.xlsx`);
  })
  .catch(console.error);
