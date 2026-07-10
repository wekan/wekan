import Excel from '@wekanteam/exceljs';

export const createWorkbook = function() {
  return new Excel.Workbook();
};

// Streaming workbook writer: flushes rows straight to `stream` (the HTTP
// response) as they are committed, instead of holding the whole workbook in
// memory. Used by board Excel export so a board with thousands of cards exports
// with bounded RAM. useStyles/useSharedStrings keep the styled output identical
// to the in-memory Workbook.
export const createWorkbookWriter = function(stream) {
  return new Excel.stream.xlsx.WorkbookWriter({
    stream,
    useStyles: true,
    useSharedStrings: true,
  });
};
