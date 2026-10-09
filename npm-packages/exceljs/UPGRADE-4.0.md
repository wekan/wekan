# UPGRADE FROM 3.x to 4.0

## `wb.createInputStream()` deprecation

| ExcelJS V3.9.*                                                      | ExcelJS v4                         |
|---------------------------------------------------------------------|------------------------------------|
|`stream.pipe(workbook.xlsx.createInputStream());`                    | `await workbook.xlsx.read(stream)` |
|                                                                     |                                    |


## Stream Reading

While upgrading to version 4 you get more ways to stream reading file.

### Iterating over all rows in all sheets.

We strongly recommend using this way, because it's 20% faster than any other and you get flow control

``` js
const workbook = new ExcelJS.stream.xlsx.WorkbookReader('./file.xlsx');
for await (const worksheetReader of workbookReader) {
  for await (const row of worksheetReader) {
    // ...

    // continue, break, return
  }
}
```

### Iterating over all events.

```js
const options = {
  sharedStrings: 'emit',
  hyperlinks: 'emit',
  worksheets: 'emit',
};
const workbook = new ExcelJS.stream.xlsx.WorkbookReader('./file.xlsx', options);
for await (const {eventType, value} of workbook.parse()) {
  switch (eventType) {
    case 'shared-strings':
      // value is the shared string
    case 'worksheet':
      // value is the worksheetReader
    case 'hyperlinks':
      // value is the hyperlinksReader
  }
}
```

### As a readable stream.

```js
const options = {
  sharedStrings: 'emit',
  hyperlinks: 'emit',
  worksheets: 'emit',
};
const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader('./file.xlsx', options);
workbookReader.read();
workbookReader.on('worksheet', worksheet => {
  worksheet.on('row', row => {
  });
});
workbookReader.on('shared-strings', sharedString => {
  // ...
});
workbookReader.on('hyperlinks', hyperlinksReader => {
  // ...
});
workbookReader.on('end', () => {
  // ...
});
workbookReader.on('error', (err) => {
  // ...
});
```
