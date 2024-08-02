import Excel from '@wekanteam/exceljs';

export const createWorkbook = function() {
  return new Excel.Workbook();
};
