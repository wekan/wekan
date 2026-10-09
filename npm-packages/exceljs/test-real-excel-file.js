const path = require('path');
const ExcelJS = require('./excel');

async function testRealExcelFile() {
  // Step 1: Try to read an Excel file with a table
  const excelFilePath = path.join(__dirname, 'Test-Template.xlsx');

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(excelFilePath);

  // Step 2: Get the first worksheet and inspect it
  const worksheet = workbook.worksheets[0];

  // Step 3: Try to get table by any available name
  const tableNames = Object.keys(worksheet.tables);

  if (tableNames.length === 0) {
    return;
  }

  // Use the first table found
  const tableName = tableNames[0];
  const table = worksheet.getTable(tableName);

  if (!table) {
    return;
  }

  // Step 4: Try to add rows (this is where the bug happens)
  const mockTodos = [
    {_id: 'todo1', text: 'Buy groceries', progress: 0},
    {_id: 'todo2', text: 'Walk the dog', progress: 50},
    {_id: 'todo3', text: 'Finish project', progress: 100},
  ];

  for (const todo of mockTodos) {
    table.addRow([todo._id, todo.text, todo.progress]);
  }

  for (let rowNum = 1; rowNum <= 8; rowNum++) {
    const row = worksheet.getRow(rowNum);
    if (row.hasValues) {
      const values = [];
      row.eachCell((cell, colNum) => {
        values[colNum] = cell.value;
      });
    }
  }

  // Step 5: Save the modified file to see if it worked
  const outputPath = path.join(__dirname, 'Test-Output.xlsx');
  await workbook.xlsx.writeFile(outputPath);
}

// Run the test
testRealExcelFile();
