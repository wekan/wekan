import Excel from 'exceljs';

export const createWorkbook = function() {
  return new Excel.Workbook();
};
