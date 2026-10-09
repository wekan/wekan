# ExcelJS

This package is ExcelJS with updated dependencies,
used at Meteor 3 WeKan with Node.js 22.x.

[![Build Status](https://github.com/exceljs/exceljs/actions/workflows/tests.yml/badge.svg?branch=master&event=push)](https://github.com/exceljs/exceljs/actions/workflows/tests.yml)

Read, manipulate and write spreadsheet data and styles to XLSX and JSON.

Reverse engineered from Excel spreadsheet files as a project.

# Translations

* [中文文档](README_zh.md)

# Installation

```shell
npm install exceljs
```

# New Features!

* Merged [Add pivot table with limitations #2551](https://github.com/exceljs/exceljs/pull/2551). <br/> Many thanks to Protobi and <a href="https://github.com/mikez">Michael</a> for this contribution!
* Merged [fix: styles rendering in case when "numFmt" is present in conditional formatting rules (resolves #1814) #1815](https://github.com/exceljs/exceljs/pull/1815). <br/> Many thanks to [@andreykrupskii](https://github.com/andreykrupskii) for this contribution!
* Merged [inlineStr cell type support #1575 #1576](https://github.com/exceljs/exceljs/pull/1576). <br/> Many thanks to [@drdmitry](https://github.com/drdmitry) for this contribution!
* Merged [Fix parsing of boolean attributes #1849](https://github.com/exceljs/exceljs/pull/1849). <br/> Many thanks to [@bno1](https://github.com/bno1) for this contribution!
* Merged [add optional custom auto-filter to table #1670](https://github.com/exceljs/exceljs/pull/1670). <br/> Many thanks to [@thambley](https://github.com/thambley) for this contribution!
* Merged [Deep copy inherited style #1850](https://github.com/exceljs/exceljs/pull/1850). <br/> Many thanks to [@ikzhr](https://github.com/ikzhr) for this contribution!
* Merged [Upgrade actions/cache and actions/setup-node #1846](https://github.com/exceljs/exceljs/pull/1846). <br/> Many thanks to [@cclauss](https://github.com/cclauss) for this contribution!
* Merged [Check object keys in isEqual #1831](https://github.com/exceljs/exceljs/pull/1831). <br/> Many thanks to [@bno1](https://github.com/bno1) for this contribution!
* Merged [Add v17 to testing workflow #1856](https://github.com/exceljs/exceljs/pull/1856). <br/> Many thanks to [@Siemienik](https://github.com/Siemienik) for this contribution!
* Merged [Upgrade jszip to its latest version to date. This version does not have any vulnerability found by Snyk so far #1895](https://github.com/exceljs/exceljs/pull/1895). <br/> Many thanks to [@ValerioSevilla](https://github.com/ValerioSevilla) for this contribution!
* Merged [Update README.md #1677](https://github.com/exceljs/exceljs/pull/1677). <br/> Many thanks to [@xjrcode](https://github.com/xjrcode) for this contribution!
* Merged [(docs): set prototype of RegExp correctly. #1700](https://github.com/exceljs/exceljs/pull/1700). <br/> Many thanks to [@joeldenning](https://github.com/joeldenning) for this contribution!
* Merged [Added timeouts to github actions #1733](https://github.com/exceljs/exceljs/pull/1733). <br/> Many thanks to [@alexbjorlig](https://github.com/alexbjorlig) for this contribution!
* Merged [fix issue 1676 #1701](https://github.com/exceljs/exceljs/pull/1701). <br/> Many thanks to [@skypesky](https://github.com/skypesky) for this contribution!
* Merged [ExcelJS/ExcelJS#2237 : Update CI Tests, Drop support for Node v8  #2242](https://github.com/exceljs/exceljs/pull/2242). <br/> Many thanks to [@Siemienik](https://github.com/Siemienik) for this contribution!
* Merged [Fix types for getWorksheet() #2223](https://github.com/exceljs/exceljs/pull/2223). <br/> Many thanks to [@hfhchan-plb](https://github.com/hfhchan-plb) for this contribution!
* Merged [add characters cannot be used for worksheet name #2126](https://github.com/exceljs/exceljs/pull/2126). <br/> Many thanks to [@tkm-kj](https://github.com/tkm-kj) for this contribution!
* Merged [Fix issue #1753 Reject promise when workbook reader is writing to temporary file stream and error occurs #1756](https://github.com/exceljs/exceljs/pull/1756). <br/> Many thanks to [@pauliusg](https://github.com/pauliusg) for this contribution!
* Merged [README.md to have correct link for Streaming XLSX #2186](https://github.com/exceljs/exceljs/pull/2186). <br/> Many thanks to [@wulfsolter](https://github.com/wulfsolter) for this contribution!
* Merged [Added a polyfill of promise.finally to support lower versions of Firefox. #1982](https://github.com/exceljs/exceljs/pull/1982). <br/> Many thanks to [@DemoJj](https://github.com/DemoJj) for this contribution!
* Merged [Fix read this.worksheet before assign it #1934](https://github.com/exceljs/exceljs/pull/1934). <br/> Many thanks to [@ZyqGitHub1](https://github.com/ZyqGitHub1) for this contribution!
* Merged [chore: upgrade jszip to ^3.10.1 #2211](https://github.com/exceljs/exceljs/pull/2211). <br/> Many thanks to [@jarrod-cocoon](https://github.com/jarrod-cocoon) for this contribution!
* Merged [fixed spelling error in README.md file #2208](https://github.com/exceljs/exceljs/pull/2208). <br/> Many thanks to [@HugoP27](https://github.com/HugoP27) for this contribution!
* Merged [fix: Fix xlsx.writeFile() not catching error when error occurs #2244](https://github.com/exceljs/exceljs/pull/2244). <br/> Many thanks to [@zurmokeeper](https://github.com/zurmokeeper) for this contribution!
* Merged [Improve worksheets' naming validation logic. #2257](https://github.com/exceljs/exceljs/pull/2257). <br/> Many thanks to [@Siemienik](https://github.com/Siemienik) for this contribution!
* Merged [fix issue 2125 - spliceRows remove last row #2140](https://github.com/exceljs/exceljs/pull/2140). <br/> Many thanks to [@babu-ch](https://github.com/babu-ch) for this contribution!
* Merged [fix: fix the loss of column attributes due to incorrect column order #2222](https://github.com/exceljs/exceljs/pull/2222). <br/> Many thanks to [@cpaiyueyue](https://github.com/cpaiyueyue) for this contribution!
* Merged [Fix: Sheet Properties Types #2327](https://github.com/exceljs/exceljs/pull/2327). <br/> Many thanks to [@albeniraouf](https://github.com/albeniraouf) for this contribution!
* Merged [Use node 18 LTS for tsc, and benchmark. Add node 20. to test matrix. … #2354](https://github.com/exceljs/exceljs/pull/2354). <br/> Many thanks to [@Siemienik](https://github.com/Siemienik) for this contribution!
* Merged [Add missing tooltip attribute to CellHyperlinkValue index.d.ts #2350](https://github.com/exceljs/exceljs/pull/2350). <br/> Many thanks to [@NiklasPor](https://github.com/NiklasPor) for this contribution!
* Merged [Increase resilience to generating large workbooks #2320](https://github.com/exceljs/exceljs/pull/2320). <br/> Many thanks to [@hfhchan-plb](https://github.com/hfhchan-plb) for this contribution!
* Merged [repair all 'c2fo.io' links ('c2fo.github.io') #2324](https://github.com/exceljs/exceljs/pull/2324). <br/> Many thanks to [@justintunev7](https://github.com/justintunev7) for this contribution!
* Merged [fix: fix type definitions about last column, formula values and protection #2309](https://github.com/exceljs/exceljs/pull/2309). <br/> Many thanks to [@gltjk](https://github.com/gltjk) for this contribution!
* Merged [fix: add spinCount field for WorksheetProtection type #2284](https://github.com/exceljs/exceljs/pull/2284). <br/> Many thanks to [@damingerdai](https://github.com/damingerdai) for this contribution!
* Merged [Add type definition for WorksheetModel.merges #2281](https://github.com/exceljs/exceljs/pull/2281). <br/> Many thanks to [@ytjmt](https://github.com/ytjmt) for this contribution!

# Contributions

Contributions are very welcome! It helps me know what features are desired or what bugs are causing the most pain.

I have just one request; If you submit a pull request for a bugfix, please add a unit-test or integration-test (in the spec folder) that catches the problem.
 Even a PR that just has a failing test is fine - I can analyse what the test is doing and fix the code from that.

Note: Please try to avoid modifying the package version in a PR.
Versions are updated on release and any change will most likely result in merge collisions.

To be clear, all contributions added to this library will be included in the library's MIT licence.

### Let's chat together:

[![SiemaTeam](https://discordapp.com/api/guilds/976854442009825321/widget.png?style=banner2)](https://discord.gg/siema)

# Contents

<ul>
  <li><a href="#importing">Importing</a></li>
  <li>
    <a href="#interface">Interface</a>
    <ul>
      <li><a href="#create-a-workbook">Create a Workbook</a></li>
      <li><a href="#set-workbook-properties">Set Workbook Properties</a></li>
      <li><a href="#workbook-views">Workbook Views</a></li>
      <li><a href="#add-a-worksheet">Add a Worksheet</a></li>
      <li><a href="#remove-a-worksheet">Remove a Worksheet</a></li>
      <li><a href="#access-worksheets">Access Worksheets</a></li>
      <li><a href="#worksheet-state">Worksheet State</a></li>
      <li><a href="#worksheet-properties">Worksheet Properties</a></li>
      <li><a href="#page-setup">Page Setup</a></li>
      <li><a href="#headers-and-footers">Headers and Footers</a></li>
      <li>
        <a href="#worksheet-views">Worksheet Views</a>
        <ul>
          <li><a href="#frozen-views">Frozen Views</a></li>
          <li><a href="#split-views">Split Views</a></li>
        </ul>
      </li>
      <li><a href="#auto-filters">Auto Filters</a></li>
      <li><a href="#columns">Columns</a></li>
      <li><a href="#rows">Rows</a>
        <ul>
          <li><a href="#add-rows">Add Rows</a></li>
          <li><a href="#handling-individual-cells">Handling Individual Cells</a></li>
          <li><a href="#merged-cells">Merged Cells</a></li>
          <li><a href="#insert-rows">Insert Rows</a></li>
          <li><a href="#splice">Splice</a></li>
          <li><a href="#duplicate-a-row">Duplicate Row</a></li>
        </ul>
      </li>
      <li><a href="#defined-names">Defined Names</a></li>
      <li><a href="#data-validations">Data Validations</a></li>
      <li><a href="#cell-comments">Cell Comments</a></li>
      <li><a href="#tables">Tables</a></li>
      <li><a href="#styles">Styles</a>
        <ul>
          <li><a href="#number-formats">Number Formats</a></li>
          <li><a href="#fonts">Fonts</a></li>
          <li><a href="#alignment">Alignment</a></li>
          <li><a href="#borders">Borders</a></li>
          <li><a href="#fills">Fills</a></li>
          <li><a href="#rich-text">Rich Text</a></li>
        </ul>
      </li>
      <li><a href="#conditional-formatting">Conditional Formatting</a></li>
      <li><a href="#outline-levels">Outline Levels</a></li>
      <li><a href="#images">Images</a></li>
      <li><a href="#sheet-protection">Sheet Protection</a></li>
      <li><a href="#file-io">File I/O</a>
        <ul>
          <li><a href="#xlsx">XLSX</a>
            <ul>
              <li><a href="#reading-xlsx">Reading XLSX</a></li>
              <li><a href="#writing-xlsx">Writing XLSX</a></li>
            </ul>
          </li>
          <li><a href="#csv">CSV</a>
            <ul>
              <li><a href="#reading-csv">Reading CSV</a></li>
              <li><a href="#writing-csv">Writing CSV</a></li>
            </ul>
          </li>
          <li><a href="#streaming-io">Streaming I/O</a>
            <ul>
              <li><a href="#streaming-xlsx">Streaming XLSX</a></li>
            </ul>
          </li>
        </ul>
      </li>
    </ul>
  </li>
  <li><a href="#browser">Browser</a></li>
  <li>
    <a href="#value-types">Value Types</a>
    <ul>
      <li><a href="#null-value">Null Value</a></li>
      <li><a href="#merge-cell">Merge Cell</a></li>
      <li><a href="#number-value">Number Value</a></li>
      <li><a href="#string-value">String Value</a></li>
      <li><a href="#date-value">Date Value</a></li>
      <li><a href="#hyperlink-value">Hyperlink Value</a></li>
      <li>
        <a href="#formula-value">Formula Value</a>
        <ul>
          <li><a href="#shared-formula">Shared Formula</a></li>
          <li><a href="#formula-type">Formula Type</a></li>
          <li><a href="#array-formula">Array Formula</a></li>
        </ul>
      </li>
      <li><a href="#rich-text-value">Rich Text Value</a></li>
      <li><a href="#boolean-value">Boolean Value</a></li>
      <li><a href="#error-value">Error Value</a></li>
    </ul>
  </li>
  <li><a href="#config">Config</a></li>
  <li><a href="#known-issues">Known Issues</a></li>
  <li><a href="#release-history">Release History</a></li>
</ul>

# Importing[⬆](#contents)<!-- Link generated with jump2header -->

```javascript
const ExcelJS = require('exceljs');
```

## ES5 Imports[⬆](#contents)<!-- Link generated with jump2header -->

To use the ES5 transpiled code, for example for node.js versions older than 10, use the dist/es5 path.

```javascript
const ExcelJS = require('exceljs/dist/es5');
```

**Note:** The ES5 build has an implicit dependency on a number of polyfills which are no longer
 explicitly added by exceljs.
 You will need to add "core-js" and "regenerator-runtime" to your dependencies and
 include the following requires in your code before the exceljs import:

```javascript
// polyfills required by exceljs
require('core-js/modules/es.promise');
require('core-js/modules/es.string.includes');
require('core-js/modules/es.object.assign');
require('core-js/modules/es.object.keys');
require('core-js/modules/es.symbol');
require('core-js/modules/es.symbol.async-iterator');
require('regenerator-runtime/runtime');

const ExcelJS = require('exceljs/dist/es5');
```

For IE 11, you'll also need a polyfill to support unicode regex patterns. For example,

```js
const rewritePattern = require('regexpu-core');
const {generateRegexpuOptions} = require('@babel/helper-create-regexp-features-plugin/lib/util');

const {RegExp} = global;
try {
  new RegExp('a', 'u');
} catch (err) {
  global.RegExp = function(pattern, flags) {
    if (flags && flags.includes('u')) {
      return new RegExp(rewritePattern(pattern, flags, generateRegexpuOptions({flags, pattern})));
    }
    return new RegExp(pattern, flags);
  };
  global.RegExp.prototype = RegExp.prototype;
}
```

## Browserify[⬆](#contents)<!-- Link generated with jump2header -->

ExcelJS publishes two browserified bundles inside the dist/ folder:

One with implicit dependencies on core-js polyfills...
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/6.26.0/polyfill.js"></script>
<script src="exceljs.js"></script>
```

And one without...
```html
<script src="--your-project's-pollyfills-here--"></script>
<script src="exceljs.bare.js"></script>
```


# Interface[⬆](#contents)<!-- Link generated with jump2header -->

## Create a Workbook[⬆](#contents)<!-- Link generated with jump2header -->

```javascript
const workbook = new ExcelJS.Workbook();
```

## Set Workbook Properties[⬆](#contents)<!-- Link generated with jump2header -->

```javascript
workbook.creator = 'Me';
workbook.lastModifiedBy = 'Her';
workbook.created = new Date(1985, 8, 30);
workbook.modified = new Date();
workbook.lastPrinted = new Date(2016, 9, 27);
```

```javascript
// Set workbook dates to 1904 date system
workbook.properties.date1904 = true;
```

## Set Calculation Properties[⬆](#contents)<!-- Link generated with jump2header -->

```javascript
// Force workbook calculation on load
workbook.calcProperties.fullCalcOnLoad = true;
```

## Workbook Views[⬆](#contents)<!-- Link generated with jump2header -->

The Workbook views controls how many separate windows Excel will open when viewing the workbook.

```javascript
workbook.views = [
  {
    x: 0, y: 0, width: 10000, height: 20000,
    firstSheet: 0, activeTab: 1, visibility: 'visible'
  }
]
```

## Add a Worksheet[⬆](#contents)<!-- Link generated with jump2header -->

```javascript
const sheet = workbook.addWorksheet('My Sheet');
```

Use the second parameter of the addWorksheet function to specify options for the worksheet.

For Example:

```javascript
// create a sheet with red tab colour
const sheet = workbook.addWorksheet('My Sheet', {properties:{tabColor:{argb:'FFC0000'}}});

// create a sheet where the grid lines are hidden
const sheet = workbook.addWorksheet('My Sheet', {views: [{showGridLines: false}]});

// create a sheet with the first row and column frozen
const sheet = workbook.addWorksheet('My Sheet', {views:[{state: 'frozen', xSplit: 1, ySplit:1}]});

// Create worksheets with headers and footers
const sheet = workbook.addWorksheet('My Sheet', {
  headerFooter:{firstHeader: "Hello Exceljs", firstFooter: "Hello World"}
});

// create new sheet with pageSetup settings for A4 - landscape
const worksheet =  workbook.addWorksheet('My Sheet', {
  pageSetup:{paperSize: 9, orientation:'landscape'}
});
```

## Remove a Worksheet[⬆](#contents)<!-- Link generated with jump2header -->

Use the worksheet `id` to remove the sheet from workbook.

For Example:

```javascript
// Create a worksheet
const sheet = workbook.addWorksheet('My Sheet');

// Remove the worksheet using worksheet id
workbook.removeWorksheet(sheet.id)
```

## Access Worksheets[⬆](#contents)<!-- Link generated with jump2header -->
```javascript
// Iterate over all sheets
// Note: workbook.worksheets.forEach will still work but this is better
workbook.eachSheet(function(worksheet, sheetId) {
  // ...
});

// fetch sheet by name
const worksheet = workbook.getWorksheet('My Sheet');

// fetch sheet by id
// INFO: Be careful when using it!
// It tries to access to `worksheet.id` field. Sometimes (really very often) workbook has worksheets with id not starting from 1.
// For instance It happens when any worksheet has been deleted.
// It's much more safety when you assume that ids are random. And stop to use this function.
// If you need to access all worksheets in a loop please look to the next example.
const worksheet = workbook.getWorksheet(1);

// access by `worksheets` array:
workbook.worksheets[0]; //the first one;

```

It's important to know that `workbook.getWorksheet(1) != Workbook.worksheets[0]` and `workbook.getWorksheet(1) != Workbook.worksheets[1]`,
because `workbook.worksheets[0].id` may have any value.

## Worksheet State[⬆](#contents)<!-- Link generated with jump2header -->

```javascript
// make worksheet visible
worksheet.state = 'visible';

// make worksheet hidden
worksheet.state = 'hidden';

// make worksheet hidden from 'hide/unhide' dialog
worksheet.state = 'veryHidden';
```

## Worksheet Properties[⬆](#contents)<!-- Link generated with jump2header -->

Worksheets support a property bucket to allow control over some features of the worksheet.

```javascript
// create new sheet with properties
const worksheet = workbook.addWorksheet('sheet', {properties:{tabColor:{argb:'FF00FF00'}}});

// create a new sheet writer with properties
const worksheetWriter = workbookWriter.addWorksheet('sheet', {properties:{outlineLevelCol:1}});

// adjust properties afterwards (not supported by worksheet-writer)
worksheet.properties.outlineLevelCol = 2;
worksheet.properties.defaultRowHeight = 15;
```

**Supported Properties**

| Name             | Default    | Description |
| ---------------- | ---------- | ----------- |
| tabColor         | undefined  | Color of the tabs |
| outlineLevelCol  | 0          | The worksheet column outline level |
| outlineLevelRow  | 0          | The worksheet row outline level |
| defaultRowHeight | 15         | Default row height |
| defaultColWidth  | (optional) | Default column width |
| dyDescent        | 55         | TBD |

### Worksheet Metrics[⬆](#contents)<!-- Link generated with jump2header -->

Some new metrics have been added to Worksheet...

| Name              | Description |
| ----------------- | ----------- |
| rowCount          | The total row size of the document. Equal to the row number of the last row that has values. |
| actualRowCount    | A count of the number of rows that have values. If a mid-document row is empty, it will not be included in the count. |
| columnCount       | The total column size of the document. Equal to the maximum cell count from all of the rows |
| actualColumnCount | A count of the number of columns that have values. |


## Page Setup[⬆](#contents)<!-- Link generated with jump2header -->

All properties that can affect the printing of a sheet are held in a pageSetup object on the sheet.

```javascript
// create new sheet with pageSetup settings for A4 - landscape
const worksheet =  workbook.addWorksheet('sheet', {
  pageSetup:{paperSize: 9, orientation:'landscape'}
});

// create a new sheet writer with pageSetup settings for fit-to-page
const worksheetWriter = workbookWriter.addWorksheet('sheet', {
  pageSetup:{fitToPage: true, fitToHeight: 5, fitToWidth: 7}
});

// adjust pageSetup settings afterwards
worksheet.pageSetup.margins = {
  left: 0.7, right: 0.7,
  top: 0.75, bottom: 0.75,
  header: 0.3, footer: 0.3
};

// Set Print Area for a sheet
worksheet.pageSetup.printArea = 'A1:G20';

// Set multiple Print Areas by separating print areas with '&&'
worksheet.pageSetup.printArea = 'A1:G10&&A11:G20';

// Repeat specific rows on every printed page
worksheet.pageSetup.printTitlesRow = '1:3';

// Repeat specific columns on every printed page
worksheet.pageSetup.printTitlesColumn = 'A:C';
```

**Supported pageSetup settings**

| Name                  | Default       | Description |
| --------------------- | ------------- | ----------- |
| margins               |               | Whitespace on the borders of the page. Units are inches. |
| orientation           | 'portrait'    | Orientation of the page - i.e. taller (portrait) or wider (landscape) |
| horizontalDpi         | 4294967295    | Horizontal Dots per Inch. Default value is -1 |
| verticalDpi           | 4294967295    | Vertical Dots per Inch. Default value is -1 |
| fitToPage             |               | Whether to use fitToWidth and fitToHeight or scale settings. Default is based on presence of these settings in the pageSetup object - if both are present, scale wins (i.e. default will be false) |
| pageOrder             | 'downThenOver'| Which order to print the pages - one of ['downThenOver', 'overThenDown'] |
| blackAndWhite         | false         | Print without colour |
| draft                 | false         | Print with less quality (and ink) |
| cellComments          | 'None'        | Where to place comments - one of ['atEnd', 'asDisplayed', 'None'] |
| errors                | 'displayed'   | Where to show errors - one of ['dash', 'blank', 'NA', 'displayed'] |
| scale                 | 100           | Percentage value to increase or reduce the size of the print. Active when fitToPage is false |
| fitToWidth            | 1             | How many pages wide the sheet should print on to. Active when fitToPage is true  |
| fitToHeight           | 1             | How many pages high the sheet should print on to. Active when fitToPage is true  |
| paperSize             |               | What paper size to use (see below) |
| showRowColHeaders     | false         | Whether to show the row numbers and column letters |
| showGridLines         | false         | Whether to show grid lines |
| firstPageNumber       |               | Which number to use for the first page |
| horizontalCentered    | false         | Whether to center the sheet data horizontally |
| verticalCentered      | false         | Whether to center the sheet data vertically |

**Example Paper Sizes**

| Name                          | Value     |
| ----------------------------- | --------- |
| Letter                        | undefined |
| Legal                         |  5        |
| Executive                     |  7        |
| A3                            |  8        |
| A4                            |  9        |
| A5                            |  11       |
| B5 (JIS)                      |  13       |
| Envelope #10                  |  20       |
| Envelope DL                   |  27       |
| Envelope C5                   |  28       |
| Envelope B5                   |  34       |
| Envelope Monarch              |  37       |
| Double Japan Postcard Rotated |  82       |
| 16K 197x273 mm                |  119      |

## Headers and Footers[⬆](#contents)<!-- Link generated with jump2header -->

Here's how to add headers and footers.
The added content is mainly text, such as time, introduction, file information, etc., and you can set the style of the text.
In addition, you can set different texts for the first page and even page.

Note: Images are not currently supported.

```javascript

// Create worksheets with headers and footers
var sheet = workbook.addWorksheet('sheet', {
  headerFooter:{firstHeader: "Hello Exceljs", firstFooter: "Hello World"}
});
// Create worksheets with headers and footers
var worksheetWriter = workbookWriter.addWorksheet('sheet', {
  headerFooter:{firstHeader: "Hello Exceljs", firstFooter: "Hello World"}
});
// Set footer (default centered), result: "Page 2 of 16"
worksheet.headerFooter.oddFooter = "Page &P of &N";

// Set the footer (default centered) to bold, resulting in: "Page 2 of 16"
worksheet.headerFooter.oddFooter = "Page &P of &N";

// Set the left footer to 18px and italicize. Result: "Page 2 of 16"
worksheet.headerFooter.oddFooter = "&LPage &P of &N";

// Set the middle header to gray Aril, the result: "52 exceljs"
worksheet.headerFooter.oddHeader = "&C&KCCCCCC&\"Aril\"52 exceljs";

// Set the left, center, and right text of the footer. Result: “Exceljs” in the footer left. “demo.xlsx” in the footer center. “Page 2” in the footer right
worksheet.headerFooter.oddFooter = "&Lexceljs&C&F&RPage &P";

// Add different header & footer for the first page
worksheet.headerFooter.differentFirst = true;
worksheet.headerFooter.firstHeader = "Hello Exceljs";
worksheet.headerFooter.firstFooter = "Hello World"
```

**Supported headerFooter settings**

| Name              | Default   | Description |
| ----------------- | --------- | ----------- |
| differentFirst    | false     | Set the value of differentFirst as true, which indicates that headers/footers for first page are different from the other pages |
| differentOddEven  | false     | Set the value of differentOddEven as true, which indicates that headers/footers for odd and even pages are different |
| oddHeader         | null      | Set header string for odd(default) pages, could format the string |
| oddFooter         | null      | Set footer string for odd(default) pages, could format the string |
| evenHeader        | null      | Set header string for even pages, could format the string |
| evenFooter        | null      | Set footer string for even pages, could format the string |
| firstHeader       | null      | Set header string for the first page, could format the string |
| firstFooter       | null      | Set footer string for the first page, could format the string |

**Script Commands**

| Commands     | Description |
| ------------ | ----------- |
| &L           | Set position to the left |
| &C           | Set position to the center |
| &R           | Set position to the right |
| &P           | The current page number |
| &N           | The total number of pages |
| &D           | The current date |
| &T           | The current time |
| &G           | A picture |
| &A           | The worksheet name |
| &F           | The file name |
| &B           | Make text bold |
| &I           | Italicize text |
| &U           | Underline text |
| &"font name" | font name, for example &"Aril" |
| &font size   | font size, for example 12 |
| &KHEXCode    | font color, for example &KCCCCCC |

## Worksheet Views[⬆](#contents)<!-- Link generated with jump2header -->

Worksheets now support a list of views, that control how Excel presents the sheet:

* frozen - where a number of rows and columns to the top and left are frozen in place. Only the bottom right section will scroll
* split - where the view is split into 4 sections, each semi-independently scrollable.

Each view also supports various properties:

| Name              | Default   | Description |
| ----------------- | --------- | ----------- |
| state             | 'normal'  | Controls the view state - one of normal, frozen or split |
| rightToLeft       | false     | Sets the worksheet view's orientation to right-to-left |
| activeCell        | undefined | The currently selected cell |
| showRuler         | true      | Shows or hides the ruler in Page Layout |
| showRowColHeaders | true      | Shows or hides the row and column headers (e.g. A1, B1 at the top and 1,2,3 on the left |
| showGridLines     | true      | Shows or hides the gridlines (shown for cells where borders have not been defined) |
| zoomScale         | 100       | Percentage zoom to use for the view |
| zoomScaleNormal   | 100       | Normal zoom for the view |
| style             | undefined | Presentation style - one of pageBreakPreview or pageLayout. Note pageLayout is not compatible with frozen views |

### Frozen Views[⬆](#contents)<!-- Link generated with jump2header -->

Frozen views support the following extra properties:

| Name              | Default   | Description |
| ----------------- | --------- | ----------- |
| xSplit            | 0         | How many columns to freeze. To freeze rows only, set this to 0 or undefined |
| ySplit            | 0         | How many rows to freeze. To freeze columns only, set this to 0 or undefined |
| topLeftCell       | special   | Which cell will be top-left in the bottom-right pane. Note: cannot be a frozen cell. Defaults to first unfrozen cell |

```javascript
worksheet.views = [
  {state: 'frozen', xSplit: 2, ySplit: 3, topLeftCell: 'G10', activeCell: 'A1'}
];
```

### Split Views[⬆](#contents)<!-- Link generated with jump2header -->

Split views support the following extra properties:

| Name              | Default   | Description |
| ----------------- | --------- | ----------- |
| xSplit            | 0         | How many points from the left to place the splitter. To split vertically, set this to 0 or undefined |
| ySplit            | 0         | How many points from the top to place the splitter. To split horizontally, set this to 0 or undefined  |
| topLeftCell       | undefined | Which cell will be top-left in the bottom-right pane. |
| activePane        | undefined | Which pane will be active - one of topLeft, topRight, bottomLeft and bottomRight |

```javascript
worksheet.views = [
  {state: 'split', xSplit: 2000, ySplit: 3000, topLeftCell: 'G10', activeCell: 'A1'}
];
```

## Auto filters[⬆](#contents)<!-- Link generated with jump2header -->

It is possible to apply an auto filter to your worksheet.

```javascript
worksheet.autoFilter = 'A1:C1';
```

While the range string is the standard form of the autoFilter, the worksheet will also support the
following values:

```javascript
// Set an auto filter from A1 to C1
worksheet.autoFilter = {
  from: 'A1',
  to: 'C1',
}

// Set an auto filter from the cell in row 3 and column 1
// to the cell in row 5 and column 12
worksheet.autoFilter = {
  from: {
    row: 3,
    column: 1
  },
  to: {
    row: 5,
    column: 12
  }
}

// Set an auto filter from D3 to the
// cell in row 7 and column 5
worksheet.autoFilter = {
  from: 'D3',
  to: {
    row: 7,
    column: 5
  }
}
```

## Columns[⬆](#contents)<!-- Link generated with jump2header -->

```javascript
// Add column headers and define column keys and widths
// Note: these column structures are a workbook-building convenience only,
// apart from the column width, they will not be fully persisted.
worksheet.columns = [
  { header: 'Id', key: 'id', width: 10 },
  { header: 'Name', key: 'name', width: 32 },
  { header: 'D.O.B.', key: 'DOB', width: 10, outlineLevel: 1 }
];

// Access an individual columns by key, letter and 1-based column number
const idCol = worksheet.getColumn('id');
const nameCol = worksheet.getColumn('B');
const dobCol = worksheet.getColumn(3);

// set column properties

// Note: will overwrite cell value C1
dobCol.header = 'Date of Birth';

// Note: this will overwrite cell values C1:C2
dobCol.header = ['Date of Birth', 'A.K.A. D.O.B.'];

// from this point on, this column will be indexed by 'dob' and not 'DOB'
dobCol.key = 'dob';

dobCol.width = 15;

// Hide the column if you'd like
dobCol.hidden = true;

// set an outline level for columns
worksheet.getColumn(4).outlineLevel = 0;
worksheet.getColumn(5).outlineLevel = 1;

// columns support a readonly field to indicate the collapsed state based on outlineLevel
expect(worksheet.getColumn(4).collapsed).to.equal(false);
expect(worksheet.getColumn(5).collapsed).to.equal(true);

// iterate over all current cells in this column
dobCol.eachCell(function(cell, rowNumber) {
  // ...
});

// iterate over all current cells in this column including empty cells
dobCol.eachCell({ includeEmpty: true }, function(cell, rowNumber) {
  // ...
});

// add a column of new values
worksheet.getColumn(6).values = [1,2,3,4,5];

// add a sparse column of values
worksheet.getColumn(7).values = [,,2,3,,5,,7,,,,11];

// cut one or more columns (columns to the right are shifted left)
// If column properties have been defined, they will be cut or moved accordingly
// Known Issue: If a splice causes any merged cells to move, the results may be unpredictable
worksheet.spliceColumns(3,2);

// remove one column and insert two more.
// Note: columns 4 and above will be shifted right by 1 column.
// Also: If the worksheet has more rows than values in the column inserts,
//  the rows will still be shifted as if the values existed
const newCol3Values = [1,2,3,4,5];
const newCol4Values = ['one', 'two', 'three', 'four', 'five'];
worksheet.spliceColumns(3, 1, newCol3Values, newCol4Values);

```

## Rows[⬆](#contents)<!-- Link generated with jump2header -->

```javascript
// Get a row object. If it doesn't already exist, a new empty one will be returned
const row = worksheet.getRow(5);

// Get multiple row objects. If it doesn't already exist, new empty ones will be returned
const rows = worksheet.getRows(5, 2); // start, length (>0, else undefined is returned)

// Get the last editable row in a worksheet (or undefined if there are none)
const row = worksheet.lastRow;

// Set a specific row height
row.height = 42.5;

// make row hidden
row.hidden = true;

// set an outline level for rows
worksheet.getRow(4).outlineLevel = 0;
worksheet.getRow(5).outlineLevel = 1;

// rows support a readonly field to indicate the collapsed state based on outlineLevel
expect(worksheet.getRow(4).collapsed).to.equal(false);
expect(worksheet.getRow(5).collapsed).to.equal(true);


row.getCell(1).value = 5; // A5's value set to 5
row.getCell('name').value = 'Zeb'; // B5's value set to 'Zeb' - assuming column 2 is still keyed by name
row.getCell('C').value = new Date(); // C5's value set to now

// Get a row as a sparse array
// Note: interface change: worksheet.getRow(4) ==> worksheet.getRow(4).values
row = worksheet.getRow(4).values;
expect(row[5]).toEqual('Kyle');

// assign row values by contiguous array (where array element 0 has a value)
row.values = [1,2,3];
expect(row.getCell(1).value).toEqual(1);
expect(row.getCell(2).value).toEqual(2);
expect(row.getCell(3).value).toEqual(3);

// assign row values by sparse array  (where array element 0 is undefined)
const values = []
values[5] = 7;
values[10] = 'Hello, World!';
row.values = values;
expect(row.getCell(1).value).toBeNull();
expect(row.getCell(5).value).toEqual(7);
expect(row.getCell(10).value).toEqual('Hello, World!');

// assign row values by object, using column keys
row.values = {
  id: 13,
  name: 'Thing 1',
  dob: new Date()
};

// Insert a page break below the row
row.addPageBreak();

// Iterate over all rows that have values in a worksheet
worksheet.eachRow(function(row, rowNumber) {
  console.log('Row ' + rowNumber + ' = ' + JSON.stringify(row.values));
});

// Iterate over all rows (including empty rows) in a worksheet
worksheet.eachRow({ includeEmpty: true }, function(row, rowNumber) {
  console.log('Row ' + rowNumber + ' = ' + JSON.stringify(row.values));
});

// Iterate over all non-null cells in a row
row.eachCell(function(cell, colNumber) {
  console.log('Cell ' + colNumber + ' = ' + cell.value);
});

// Iterate over all cells in a row (including empty cells)
row.eachCell({ includeEmpty: true }, function(cell, colNumber) {
  console.log('Cell ' + colNumber + ' = ' + cell.value);
});

// Commit a completed row to stream
row.commit();

// row metrics
const rowSize = row.cellCount;
const numValues = row.actualCellCount;
```

## Add Rows[⬆](#contents)<!-- Link generated with jump2header -->

```javascript
// Add a couple of Rows by key-value, after the last current row, using the column keys
worksheet.addRow({id: 1, name: 'John Doe', dob: new Date(1970,1,1)});
worksheet.addRow({id: 2, name: 'Jane Doe', dob: new Date(1965,1,7)});

// Add a row by contiguous Array (assign to columns A, B & C)
worksheet.addRow([3, 'Sam', new Date()]);

// Add a row by sparse Array (assign to columns A, E & I)
const rowValues = [];
rowValues[1] = 4;
rowValues[5] = 'Kyle';
rowValues[9] = new Date();
worksheet.addRow(rowValues);

// Add a row with inherited style
// This new row will have same style as last row
// And return as row object
const newRow = worksheet.addRow(rowValues, 'i');

// Add an array of rows
const rows = [
  [5,'Bob',new Date()], // row by array
  {id:6, name: 'Barbara', dob: new Date()}
];
// add new rows and return them as array of row objects
const newRows = worksheet.addRows(rows);

// Add an array of rows with inherited style
// These new rows will have same styles as last row
// and return them as array of row objects
const newRowsStyled = worksheet.addRows(rows, 'i');
```
| Parameter | Description | Default Value |
| -------------- | ----------------- | -------- |
| value/s    | The new row/s values |  |
| style            | 'i' for inherit from row above, 'i+' to include empty cells, 'n' for none | *'n'* |

## Handling Individual Cells[⬆](#contents)<!-- Link generated with jump2header -->

```javascript
const cell = worksheet.getCell('C3');

// Modify/Add individual cell
cell.value = new Date(1968, 5, 1);

// query a cell's type
expect(cell.type).toEqual(Excel.ValueType.Date);

// use string value of cell
myInput.value = cell.text;

// use html-safe string for rendering...
const html = '<div>' + cell.html + '</div>';

```

## Merged Cells[⬆](#contents)<!-- Link generated with jump2header -->

```javascript
// merge a range of cells
worksheet.mergeCells('A4:B5');

// ... merged cells are linked
worksheet.getCell('B5').value = 'Hello, World!';
expect(worksheet.getCell('B5').value).toBe(worksheet.getCell('A4').value);
expect(worksheet.getCell('B5').master).toBe(worksheet.getCell('A4'));

// ... merged cells share the same style object
expect(worksheet.getCell('B5').style).toBe(worksheet.getCell('A4').style);
worksheet.getCell('B5').style.font = myFonts.arial;
expect(worksheet.getCell('A4').style.font).toBe(myFonts.arial);

// unmerging the cells breaks the style links
worksheet.unMergeCells('A4');
expect(worksheet.getCell('B5').style).not.toBe(worksheet.getCell('A4').style);
expect(worksheet.getCell('B5').style.font).not.toBe(myFonts.arial);

// merge by top-left, bottom-right
worksheet.mergeCells('K10', 'M12');

// merge by start row, start column, end row, end column (equivalent to K10:M12)
worksheet.mergeCells(10,11,12,13);
```

## Insert Rows[⬆](#contents)<!-- Link generated with jump2header -->

```javascript
insertRow(pos, value, style = 'n')
insertRows(pos, values, style = 'n')

// Insert a couple of Rows by key-value, shifting down rows every time
worksheet.insertRow(1, {id: 1, name: 'John Doe', dob: new Date(1970,1,1)});
worksheet.insertRow(1, {id: 2, name: 'Jane Doe', dob: new Date(1965,1,7)});

// Insert a row by contiguous Array (assign to columns A, B & C)
worksheet.insertRow(1, [3, 'Sam', new Date()]);

// Insert a row by sparse Array (assign to columns A, E & I)
var rowValues = [];
rowValues[1] = 4;
rowValues[5] = 'Kyle';
rowValues[9] = new Date();
// insert new row and return as row object
const insertedRow = worksheet.insertRow(1, rowValues);

// Insert a row, with inherited style
// This new row will have same style as row on top of it
// And return as row object
const insertedRowInherited = worksheet.insertRow(1, rowValues, 'i');

// Insert a row, keeping original style
// This new row will have same style as it was previously
// And return as row object
const insertedRowOriginal = worksheet.insertRow(1, rowValues, 'o');

// Insert an array of rows, in position 1, shifting down current position 1 and later rows by 2 rows
var rows = [
  [5,'Bob',new Date()], // row by array
  {id:6, name: 'Barbara', dob: new Date()}
];
// insert new rows and return them as array of row objects
const insertedRows = worksheet.insertRows(1, rows);

// Insert an array of rows, with inherited style
// These new rows will have same style as row on top of it
// And return them as array of row objects
const insertedRowsInherited = worksheet.insertRows(1, rows, 'i');

// Insert an array of rows, keeping original style
// These new rows will have same style as it was previously in 'pos' position
const insertedRowsOriginal = worksheet.insertRows(1, rows, 'o');

```
| Parameter | Description | Default Value |
| -------------- | ----------------- | -------- |
| pos          | Row number where you want to insert, pushing down all rows from there |  |
| value/s    | The new row/s values |  |
| style            | 'i' for inherit from row above, , 'i+' to include empty cells, 'o' for original style, 'o+' to include empty cells, 'n' for none | *'n'* |

## Splice[⬆](#contents)<!-- Link generated with jump2header -->

```javascript
// Cut one or more rows (rows below are shifted up)
// Known Issue: If a splice causes any merged cells to move, the results may be unpredictable
worksheet.spliceRows(4, 3);

// remove one row and insert two more.
// Note: rows 4 and below will be shifted down by 1 row.
const newRow3Values = [1, 2, 3, 4, 5];
const newRow4Values = ['one', 'two', 'three', 'four', 'five'];
worksheet.spliceRows(3, 1, newRow3Values, newRow4Values);

// Cut one or more cells (cells to the right are shifted left)
// Note: this operation will not affect other rows
row.splice(3, 2);

// remove one cell and insert two more (cells to the right of the cut cell will be shifted right)
row.splice(4, 1, 'new value 1', 'new value 2');
```
| Parameter | Description | Default Value |
| -------------- | ----------------- | -------- |
| start    | Starting point to splice from |  |
| count    | Number of rows/cells to remove |  |
| ...inserts            | New row/cell values to insert |  |

## Duplicate a Row[⬆](#contents)<!-- Link generated with jump2header -->

```javascript
duplicateRow(start, amount = 1, insert = true)

const wb = new ExcelJS.Workbook();
const ws = wb.addWorksheet('duplicateTest');
ws.getCell('A1').value = 'One';
ws.getCell('A2').value = 'Two';
ws.getCell('A3').value = 'Three';
ws.getCell('A4').value = 'Four';

// This line will duplicate the row 'One' twice but it will replace rows 'Two' and 'Three'
// if third param was true so it would insert 2 new rows with the values and styles of row 'One'
ws.duplicateRow(1,2,false);
```

| Parameter | Description | Default Value |
| -------------- | ----------------- | -------- |
| start          | Row number you want to duplicate (first in excel is 1) |  |
| amount    | The times you want to duplicate the row | 1 |
| insert            | *true* if you want to insert new rows for the duplicates, or *false* if you want to replace them | *true* |



## Defined Names[⬆](#contents)<!-- Link generated with jump2header -->

Individual cells (or multiple groups of cells) can have names assigned to them.
 The names can be used in formulas and data validation (and probably more).

```javascript
// assign (or get) a name for a cell (will overwrite any other names that cell had)
worksheet.getCell('A1').name = 'PI';
expect(worksheet.getCell('A1').name).to.equal('PI');

// assign (or get) an array of names for a cell (cells can have more than one name)
worksheet.getCell('A1').names = ['thing1', 'thing2'];
expect(worksheet.getCell('A1').names).to.have.members(['thing1', 'thing2']);

// remove a name from a cell
worksheet.getCell('A1').removeName('thing1');
expect(worksheet.getCell('A1').names).to.have.members(['thing2']);
```

## Data Validations[⬆](#contents)<!-- Link generated with jump2header -->

Cells can define what values are valid or not and provide prompting to the user to help guide them.

Validation types can be one of the following:

| Type       | Description |
| ---------- | ----------- |
| list       | Define a discrete set of valid values. Excel will offer these in a dropdown for easy entry |
| whole      | The value must be a whole number |
| decimal    | The value must be a decimal number |
| textLength | The value may be text but the length is controlled |
| custom     | A custom formula controls the valid values |

For types other than list or custom, the following operators affect the validation:

| Operator              | Description |
| --------------------  | ----------- |
| between               | Values must lie between formula results |
| notBetween            | Values must not lie between formula results |
| equal                 | Value must equal formula result |
| notEqual              | Value must not equal formula result |
| greaterThan           | Value must be greater than formula result |
| lessThan              | Value must be less than formula result |
| greaterThanOrEqual    | Value must be greater than or equal to formula result |
| lessThanOrEqual       | Value must be less than or equal to formula result |

```javascript
// Specify list of valid values (One, Two, Three, Four).
// Excel will provide a dropdown with these values.
worksheet.getCell('A1').dataValidation = {
  type: 'list',
  allowBlank: true,
  formulae: ['"One,Two,Three,Four"']
};

// Specify list of valid values from a range.
// Excel will provide a dropdown with these values.
worksheet.getCell('A1').dataValidation = {
  type: 'list',
  allowBlank: true,
  formulae: ['$D$5:$F$5']
};

// Specify Cell must be a whole number that is not 5.
// Show the user an appropriate error message if they get it wrong
worksheet.getCell('A1').dataValidation = {
  type: 'whole',
  operator: 'notEqual',
  showErrorMessage: true,
  formulae: [5],
  errorStyle: 'error',
  errorTitle: 'Five',
  error: 'The value must not be Five'
};

// Specify Cell must be a decimal number between 1.5 and 7.
// Add 'tooltip' to help guid the user
worksheet.getCell('A1').dataValidation = {
  type: 'decimal',
  operator: 'between',
  allowBlank: true,
  showInputMessage: true,
  formulae: [1.5, 7],
  promptTitle: 'Decimal',
  prompt: 'The value must between 1.5 and 7'
};

// Specify Cell must be have a text length less than 15
worksheet.getCell('A1').dataValidation = {
  type: 'textLength',
  operator: 'lessThan',
  showErrorMessage: true,
  allowBlank: true,
  formulae: [15]
};

// Specify Cell must be have be a date before 1st Jan 2016
worksheet.getCell('A1').dataValidation = {
  type: 'date',
  operator: 'lessThan',
  showErrorMessage: true,
  allowBlank: true,
  formulae: [new Date(2016,0,1)]
};
```

## Cell Comments[⬆](#contents)<!-- Link generated with jump2header -->

Add old style comment to a cell

```javascript
// plain text note
worksheet.getCell('A1').note = 'Hello, ExcelJS!';

// colourful formatted note
ws.getCell('B1').note = {
  texts: [
    {'font': {'size': 12, 'color': {'theme': 0}, 'name': 'Calibri', 'family': 2, 'scheme': 'minor'}, 'text': 'This is '},
    {'font': {'italic': true, 'size': 12, 'color': {'theme': 0}, 'name': 'Calibri', 'scheme': 'minor'}, 'text': 'a'},
    {'font': {'size': 12, 'color': {'theme': 1}, 'name': 'Calibri', 'family': 2, 'scheme': 'minor'}, 'text': ' '},
    {'font': {'size': 12, 'color': {'argb': 'FFFF6600'}, 'name': 'Calibri', 'scheme': 'minor'}, 'text': 'colorful'},
    {'font': {'size': 12, 'color': {'theme': 1}, 'name': 'Calibri', 'family': 2, 'scheme': 'minor'}, 'text': ' text '},
    {'font': {'size': 12, 'color': {'argb': 'FFCCFFCC'}, 'name': 'Calibri', 'scheme': 'minor'}, 'text': 'with'},
    {'font': {'size': 12, 'color': {'theme': 1}, 'name': 'Calibri', 'family': 2, 'scheme': 'minor'}, 'text': ' in-cell '},
    {'font': {'bold': true, 'size': 12, 'color': {'theme': 1}, 'name': 'Calibri', 'family': 2, 'scheme': 'minor'}, 'text': 'format'},
  ],
  margins: {
    insetmode: 'custom',
    inset: [0.25, 0.25, 0.35, 0.35]
  },
  protection: {
    locked: True,
    lockText: False
  },
  editAs: 'twoCells',
};
```

### Cell Comments Properties[⬆](#contents)<!-- Link generated with jump2header -->

The following table defines the properties supported by cell comments.

| Field     | Required | Default Value | Description |
| --------  | -------- | ------------- | ----------- |
| texts     | Y        |               | The text of the comment |
| margins | N        | {}  | Determines the value of margins for automatic or custom cell comments
| protection   | N        | {} | Specifying the lock status of objects and object text using protection attributes |
| editAs   | N        | 'absolute' | Use the 'editAs' attribute to specify how the annotation is anchored to the cell  |

### Cell Comments Margins

Determine the page margin setting mode of the cell annotation, automatic or custom mode.

```javascript
ws.getCell('B1').note.margins = {
  insetmode: 'custom',
  inset: [0.25, 0.25, 0.35, 0.35]
}
```

### Supported Margins Properties[⬆](#contents)<!-- Link generated with jump2header -->

| Property     | Required | Default Value | Description |
| --------  | -------- | ------------- | ----------- |
| insetmode     | N        |    'auto'           | Determines whether comment margins are set automatically and the value is 'auto' or 'custom' |
| inset | N        | [0.13, 0.13, 0.25, 0.25]  | Whitespace on the borders of the comment. Units are centimeter. Direction is left, top, right, bottom |

Note: This  ```inset``` setting takes effect only when the value of ```insetmode``` is 'custom'.

### Cell Comments Protection

Specifying the lock status of objects and object text using protection attributes.

```javascript
ws.getCell('B1').note.protection = {
  locked: 'False',
  lockText: 'False',
};
```

### Supported Protection Properties[⬆](#contents)<!-- Link generated with jump2header -->

| Property     | Required | Default Value | Description |
| --------  | -------- | ------------- | ----------- |
| locked     | N        |    'True'           | This element specifies that the object is locked when the sheet is protected |
| lockText | N        | 'True'  | This element specifies that the text of the object is locked |

Note: Locked objects are valid only when the worksheet is protected.

### Cell Comments EditAs[⬆](#contents)<!-- Link generated with jump2header -->

The cell comments can also have the property 'editAs' which will control how the comments is anchored to the cell(s).
It can have one of the following values:

```javascript
ws.getCell('B1').note.editAs = 'twoCells';
```

| Value     | Description |
| --------- | ----------- |
| twoCells | It specifies that the size and position of the note varies with cells |
| oneCells   | It specifies that the size of the note is fixed and the position changes with the cell |
| absolute  | This is the default. Comments will not be moved or sized with cells |

## Tables[⬆](#contents)<!-- Link generated with jump2header -->

Tables allow for in-sheet manipulation of tabular data.

To add a table to a worksheet, define a table model and call addTable:

```javascript
// add a table to a sheet
ws.addTable({
  name: 'MyTable',
  ref: 'A1',
  headerRow: true,
  totalsRow: true,
  style: {
    theme: 'TableStyleDark3',
    showRowStripes: true,
  },
  columns: [
    {name: 'Date', totalsRowLabel: 'Totals:', filterButton: true},
    {name: 'Amount', totalsRowFunction: 'sum', filterButton: false},
  ],
  rows: [
    [new Date('2019-07-20'), 70.10],
    [new Date('2019-07-21'), 70.60],
    [new Date('2019-07-22'), 70.10],
  ],
});
```

Note: Adding a table to a worksheet will modify the sheet by placing
headers and row data to the sheet.
Any data on the sheet covered by the resulting table (including headers and
totals) will be overwritten.

### Table Properties[⬆](#contents)<!-- Link generated with jump2header -->

The following table defines the properties supported by tables.

| Table Property | Description       | Required | Default Value |
| -------------- | ----------------- | -------- | ------------- |
| name           | The name of the table | Y |    |
| displayName    | The display name of the table | N | name |
| ref            | Top left cell of the table | Y |   |
| headerRow      | Show headers at top of table | N | true |
| totalsRow      | Show totals at bottom of table | N | false |
| style          | Extra style properties | N | {} |
| columns        | Column definitions | Y |   |
| rows           | Rows of data | Y |   |

### Table Style Properties[⬆](#contents)<!-- Link generated with jump2header -->

The following table defines the properties supported within the table
style property.

| Style Property     | Description       | Required | Default Value |
| ------------------ | ----------------- | -------- | ------------- |
| theme              | The colour theme of the table | N |  'TableStyleMedium2'  |
| showFirstColumn    | Highlight the first column (bold) | N |  false  |
| showLastColumn     | Highlight the last column (bold) | N |  false  |
| showRowStripes     | Alternate rows shown with background colour | N |  false  |
| showColumnStripes  | Alternate rows shown with background colour | N |  false  |

### Table Column Properties[⬆](#contents)<!-- Link generated with jump2header -->

The following table defines the properties supported within each table
column.

| Column Property    | Description       | Required | Default Value |
| ------------------ | ----------------- | -------- | ------------- |
| name               | The name of the column, also used in the header | Y |    |
| filterButton       | Switches the filter control in the header | N |  false  |
| totalsRowLabel     | Label to describe the totals row (first column) | N | 'Total' |
| totalsRowFunction  | Name of the totals function | N | 'none' |
| totalsRowFormula   | Optional formula for custom functions | N |   |

### Totals Functions[⬆](#contents)<!-- Link generated with jump2header -->

The following table list the valid values for the totalsRowFunction property
defined by columns. If any value other than 'custom' is used, it is not
necessary to include the associated formula as this will be inserted
by the table.

| Totals Functions   | Description       |
| ------------------ | ----------------- |
| none               | No totals function for this column |
| average            | Compute average for the column |
| countNums          | Count the entries that are numbers |
| count              | Count of entries |
| max                | The maximum value in this column |
| min                | The minimum value in this column |
| stdDev             | The standard deviation for this column |
| var                | The variance for this column |
| sum                | The sum of entries for this column |
| custom             | A custom formula. Requires an associated totalsRowFormula value. |

### Table Style Themes[⬆](#contents)<!-- Link generated with jump2header -->

Valid theme names follow the following pattern:

* "TableStyle[Shade][Number]"

Shades, Numbers can be one of:

* Light, 1-21
* Medium, 1-28
* Dark, 1-11

For no theme, use the value null.

Note: custom table themes are not supported by exceljs yet.

### Modifying Tables[⬆](#contents)<!-- Link generated with jump2header -->

Tables support a set of manipulation functions that allow data to be
added or removed and some properties to be changed. Since many of these
operations may have on-sheet effects, the changes must be committed
once complete.

All index values in the table are zero based, so the first row number
and first column number is 0.

**Adding or Removing Headers and Totals**

```javascript
const table = ws.getTable('MyTable');

// turn header row on
table.headerRow = true;

// turn totals row off
table.totalsRow = false;

// commit the table changes into the sheet
table.commit();
```

**Relocating a Table**

```javascript
const table = ws.getTable('MyTable');

// table top-left move to D4
table.ref = 'D4';

// commit the table changes into the sheet
table.commit();
```

**Adding and Removing Rows**

```javascript
const table = ws.getTable('MyTable');

// remove first two rows
table.removeRows(0, 2);

// insert new rows at index 5
table.addRow([new Date('2019-08-05'), 5, 'Mid'], 5);

// append new row to bottom of table
table.addRow([new Date('2019-08-10'), 10, 'End']);

// commit the table changes into the sheet
table.commit();
```

**Adding and Removing Columns**

```javascript
const table = ws.getTable('MyTable');

// remove second column
table.removeColumns(1, 1);

// insert new column (with data) at index 1
table.addColumn(
  {name: 'Letter', totalsRowFunction: 'custom', totalsRowFormula: 'ROW()', totalsRowResult: 6, filterButton: true},
  ['a', 'b', 'c', 'd'],
  2
);

// commit the table changes into the sheet
table.commit();
```

**Change Column Properties**

```javascript
const table = ws.getTable('MyTable');

// Get Column Wrapper for second column
const column = table.getColumn(1);

// set some properties
column.name = 'Code';
column.filterButton = true;
column.style = {font:{bold: true, name: 'Comic Sans MS'}};
column.totalsRowLabel = 'Totals';
column.totalsRowFunction = 'custom';
column.totalsRowFormula = 'ROW()';
column.totalsRowResult = 10;

// commit the table changes into the sheet
table.commit();
```


## Styles[⬆](#contents)<!-- Link generated with jump2header -->

Cells, Rows and Columns each support a rich set of styles and formats that affect how the cells are displayed.

Styles are set by assigning the following properties:

* <a href="#number-formats">numFmt</a>
* <a href="#fonts">font</a>
* <a href="#alignment">alignment</a>
* <a href="#borders">border</a>
* <a href="#fills">fill</a>

```javascript
// assign a style to a cell
ws.getCell('A1').numFmt = '0.00%';

// Apply styles to worksheet columns
ws.columns = [
  { header: 'Id', key: 'id', width: 10 },
  { header: 'Name', key: 'name', width: 32, style: { font: { name: 'Arial Black' } } },
  { header: 'D.O.B.', key: 'DOB', width: 10, style: { numFmt: 'dd/mm/yyyy' } }
];

// Set Column 3 to Currency Format
ws.getColumn(3).numFmt = '"£"#,##0.00;[Red]\-"£"#,##0.00';

// Set Row 2 to Comic Sans.
ws.getRow(2).font = { name: 'Comic Sans MS', family: 4, size: 16, underline: 'double', bold: true };
```

When a style is applied to a row or column, it will be applied to all currently existing cells in that row or column.
 Also, any new cell that is created will inherit its initial styles from the row and column it belongs to.

If a cell's row and column both define a specific style (e.g. font), the cell will use the row style over the column style.
 However if the row and column define different styles (e.g. column.numFmt and row.font), the cell will inherit the font from the row and the numFmt from the column.

Caveat: All the above properties (with the exception of numFmt, which is a string), are JS object structures.
 If the same style object is assigned to more than one spreadsheet entity, then each entity will share the same style object.
 If the style object is later modified before the spreadsheet is serialized, then all entities referencing that style object will be modified too.
 This behaviour is intended to prioritize performance by reducing the number of JS objects created.
 If you want the style objects to be independent, you will need to clone them before assigning them.
 Also, by default, when a document is read from file (or stream) if spreadsheet entities share similar styles, then they will reference the same style object too.

### Number Formats[⬆](#contents)<!-- Link generated with jump2header -->

```javascript
// display value as '1 3/5'
ws.getCell('A1').value = 1.6;
ws.getCell('A1').numFmt = '# ?/?';

// display value as '1.60%'
ws.getCell('B1').value = 0.016;
ws.getCell('B1').numFmt = '0.00%';
```

### Fonts[⬆](#contents)<!-- Link generated with jump2header -->

```javascript

// for the wannabe graphic designers out there
ws.getCell('A1').font = {
  name: 'Comic Sans MS',
  family: 4,
  size: 16,
  underline: true,
  bold: true
};

// for the graduate graphic designers...
ws.getCell('A2').font = {
  name: 'Arial Black',
  color: { argb: 'FF00FF00' },
  family: 2,
  size: 14,
  italic: true
};

// for the vertical align
ws.getCell('A3').font = {
  vertAlign: 'superscript'
};

// note: the cell will store a reference to the font object assigned.
// If the font object is changed afterwards, the cell font will change also...
const font = { name: 'Arial', size: 12 };
ws.getCell('A3').font = font;
font.size = 20; // Cell A3 now has font size 20!

// Cells that share similar fonts may reference the same font object after
// the workbook is read from file or stream
```

| Font Property | Description       | Example Value(s) |
| ------------- | ----------------- | ---------------- |
| name          | Font name. | 'Arial', 'Calibri', etc. |
| family        | Font family for fallback. An integer value. | 1 - Serif, 2 - Sans Serif, 3 - Mono, Others - unknown |
| scheme        | Font scheme. | 'minor', 'major', 'none' |
| charset       | Font charset. An integer value. | 1, 2, etc. |
| size          | Font size. An integer value. | 9, 10, 12, 16, etc. |
| color         | Colour description, an object containing an ARGB value. | { argb: 'FFFF0000'} |
| bold          | Font **weight** | true, false |
| italic        | Font *slope* | true, false |
| underline     | Font <u>underline</u> style | true, false, 'none', 'single', 'double', 'singleAccounting', 'doubleAccounting' |
| strike        | Font <strike>strikethrough</strike> | true, false |
| outline       | Font outline | true, false |
| vertAlign     | Vertical align | 'superscript', 'subscript'

### Alignment[⬆](#contents)<!-- Link generated with jump2header -->

```javascript
// set cell alignment to top-left, middle-center, bottom-right
ws.getCell('A1').alignment = { vertical: 'top', horizontal: 'left' };
ws.getCell('B1').alignment = { vertical: 'middle', horizontal: 'center' };
ws.getCell('C1').alignment = { vertical: 'bottom', horizontal: 'right' };

// set cell to wrap-text
ws.getCell('D1').alignment = { wrapText: true };

// set cell indent to 1
ws.getCell('E1').alignment = { indent: 1 };

// set cell text rotation to 30deg upwards, 45deg downwards and vertical text
ws.getCell('F1').alignment = { textRotation: 30 };
ws.getCell('G1').alignment = { textRotation: -45 };
ws.getCell('H1').alignment = { textRotation: 'vertical' };
```

**Valid Alignment Property Values**

| horizontal       | vertical    | wrapText | shrinkToFit | indent  | readingOrder | textRotation |
| ---------------- | ----------- | -------- | ----------- | ------- | ------------ | ------------ |
| left             | top         | true     | true        | integer | rtl          | 0 to 90      |
| center           | middle      | false    | false       |         | ltr          | -1 to -90    |
| right            | bottom      |          |             |         |              | vertical     |
| fill             | distributed |          |             |         |              |              |
| justify          | justify     |          |             |         |              |              |
| centerContinuous |             |          |             |         |              |              |
| distributed      |             |          |             |         |              |              |


### Borders[⬆](#contents)<!-- Link generated with jump2header -->

```javascript
// set single thin border around A1
ws.getCell('A1').border = {
  top: {style:'thin'},
  left: {style:'thin'},
  bottom: {style:'thin'},
  right: {style:'thin'}
};

// set double thin green border around A3
ws.getCell('A3').border = {
  top: {style:'double', color: {argb:'FF00FF00'}},
  left: {style:'double', color: {argb:'FF00FF00'}},
  bottom: {style:'double', color: {argb:'FF00FF00'}},
  right: {style:'double', color: {argb:'FF00FF00'}}
};

// set thick red cross in A5
ws.getCell('A5').border = {
  diagonal: {up: true, down: true, style:'thick', color: {argb:'FFFF0000'}}
};
```

**Valid Border Styles**

* thin
* dotted
* dashDot
* hair
* dashDotDot
* slantDashDot
* mediumDashed
* mediumDashDotDot
* mediumDashDot
* medium
* double
* thick

### Fills[⬆](#contents)<!-- Link generated with jump2header -->

```javascript
// fill A1 with red darkVertical stripes
ws.getCell('A1').fill = {
  type: 'pattern',
  pattern:'darkVertical',
  fgColor:{argb:'FFFF0000'}
};

// fill A2 with yellow dark trellis and blue behind
ws.getCell('A2').fill = {
  type: 'pattern',
  pattern:'darkTrellis',
  fgColor:{argb:'FFFFFF00'},
  bgColor:{argb:'FF0000FF'}
};

// fill A3 with solid coral
ws.getCell('A3').fill = {
  type: 'pattern',
  pattern:'solid',
  fgColor:{argb:'F08080'},
};

// fill A4 with blue-white-blue gradient from left to right
ws.getCell('A4').fill = {
  type: 'gradient',
  gradient: 'angle',
  degree: 0,
  stops: [
    {position:0, color:{argb:'FF0000FF'}},
    {position:0.5, color:{argb:'FFFFFFFF'}},
    {position:1, color:{argb:'FF0000FF'}}
  ]
};


// fill A5 with red-green gradient from center
ws.getCell('A5').fill = {
  type: 'gradient',
  gradient: 'path',
  center:{left:0.5,top:0.5},
  stops: [
    {position:0, color:{argb:'FFFF0000'}},
    {position:1, color:{argb:'FF00FF00'}}
  ]
};
```

#### Pattern Fills[⬆](#contents)<!-- Link generated with jump2header -->

| Property | Required | Description |
| -------- | -------- | ----------- |
| type     | Y        | Value: 'pattern'<br/>Specifies this fill uses patterns |
| pattern  | Y        | Specifies type of pattern (see <a href="#valid-pattern-types">Valid Pattern Types</a> below) |
| fgColor  | N        | Specifies the pattern foreground color. Default is black. |
| bgColor  | N        | Specifies the pattern background color. Default is white. |

Note: If you want to fill a cell using the `solid` pattern, then you don't need to specify `bgColor`.
See example above for cell `A3` with a `solid` pattern and a coral `fgColor`.


**Valid Pattern Types**

* none
* solid
* darkGray
* mediumGray
* lightGray
* gray125
* gray0625
* darkHorizontal
* darkVertical
* darkDown
* darkUp
* darkGrid
* darkTrellis
* lightHorizontal
* lightVertical
* lightDown
* lightUp
* lightGrid
* lightTrellis

#### Gradient Fills[⬆](#contents)<!-- Link generated with jump2header -->

| Property | Required | Description |
| -------- | -------- | ----------- |
| type     | Y        | Value: 'gradient'<br/>Specifies this fill uses gradients |
| gradient | Y        | Specifies gradient type. One of ['angle', 'path'] |
| degree   | angle    | For 'angle' gradient, specifies the direction of the gradient. 0 is from the left to the right. Values from 1 - 359 rotates the direction clockwise |
| center   | path     | For 'path' gradient. Specifies the relative coordinates for the start of the path. 'left' and 'top' values range from 0 to 1 |
| stops    | Y        | Specifies the gradient colour sequence. Is an array of objects containing position and color starting with position 0 and ending with position 1. Intermediary positions may be used to specify other colours on the path. |

**Caveats**

Using the interface above it may be possible to create gradient fill effects not possible using the XLSX editor program.
For example, Excel only supports angle gradients of 0, 45, 90 and 135.
Similarly the sequence of stops may also be limited by the UI with positions [0,1] or [0,0.5,1] as the only options.
Take care with this fill to be sure it is supported by the target XLSX viewers.

### Rich Text[⬆](#contents)<!-- Link generated with jump2header -->

Individual cells now support rich text or in-cell formatting.
 Rich text values can control the font properties of any number of sub-strings within the text value.
 See <a href="font">Fonts</a> for a complete list of details on what font properties are supported.

```javascript

ws.getCell('A1').value = {
  'richText': [
    {'font': {'size': 12,'color': {'theme': 0},'name': 'Calibri','family': 2,'scheme': 'minor'},'text': 'This is '},
    {'font': {'italic': true,'size': 12,'color': {'theme': 0},'name': 'Calibri','scheme': 'minor'},'text': 'a'},
    {'font': {'size': 12,'color': {'theme': 1},'name': 'Calibri','family': 2,'scheme': 'minor'},'text': ' '},
    {'font': {'size': 12,'color': {'argb': 'FFFF6600'},'name': 'Calibri','scheme': 'minor'},'text': 'colorful'},
    {'font': {'size': 12,'color': {'theme': 1},'name': 'Calibri','family': 2,'scheme': 'minor'},'text': ' text '},
    {'font': {'size': 12,'color': {'argb': 'FFCCFFCC'},'name': 'Calibri','scheme': 'minor'},'text': 'with'},
    {'font': {'size': 12,'color': {'theme': 1},'name': 'Calibri','family': 2,'scheme': 'minor'},'text': ' in-cell '},
    {'font': {'bold': true,'size': 12,'color': {'theme': 1},'name': 'Calibri','family': 2,'scheme': 'minor'},'text': 'format'}
  ]
};

expect(ws.getCell('A1').text).to.equal('This is a colorful text with in-cell format');
expect(ws.getCell('A1').type).to.equal(Excel.ValueType.RichText);

```

### Cell Protection[⬆](#contents)<!-- Link generated with jump2header -->

Cell level protection can be modified using the protection property.

```javascript
ws.getCell('A1').protection = {
  locked: false,
  hidden: true,
};
```

**Supported Protection Properties**

| Property | Default | Description |
| -------- | ------- | ----------- |
| locked   | true    | Specifies whether a cell will be locked if the sheet is protected. |
| hidden   | false   | Specifies whether a cell's formula will be visible if the sheet is protected. |

## Conditional Formatting[⬆](#contents)<!-- Link generated with jump2header -->

Conditional formatting allows a sheet to show specific styles, icons, etc
depending on cell values or any arbitrary formula.

Conditional formatting rules are added at the sheet level and will typically
cover a range of cells.

Multiple rules can be applied to a given cell range and each rule will apply
its own style.

If multiple rules affect a given cell, the rule priority value will determine
which rule wins out if competing styles collide.
The rule with the lower priority value wins.
If priority values are not specified for a given rule, ExcelJS will assign them
in ascending order.

Note: at present, only a subset of conditional formatting rules are supported.
Specifically, only the formatting rules that do not require XML rendering
inside an &lt;extLst&gt; element. This means that datasets and three specific
icon sets (3Triangles, 3Stars, 5Boxes) are not supported.

```javascript
// add a checkerboard pattern to A1:E7 based on row + col being even or odd
worksheet.addConditionalFormatting({
  ref: 'A1:E7',
  rules: [
    {
      type: 'expression',
      formulae: ['MOD(ROW()+COLUMN(),2)=0'],
      style: {fill: {type: 'pattern', pattern: 'solid', bgColor: {argb: 'FF00FF00'}}},
    }
  ]
})
```

**Supported Conditional Formatting Rule Types**

| Type         | Description |
| ------------ | ----------- |
| expression   | Any custom function may be used to activate the rule. |
| cellIs       | Compares cell value with supplied formula using specified operator |
| top10        | Applies formatting to cells with values in top (or bottom) ranges |
| aboveAverage | Applies formatting to cells with values above (or below) average |
| colorScale   | Applies a coloured background to cells based on where their values lie in the range |
| iconSet      | Adds one of a range of icons to cells based on value |
| containsText | Applies formatting based on whether cell a specific text |
| timePeriod   | Applies formatting based on whether cell datetime value lies within a specified range |

### Expression[⬆](#contents)<!-- Link generated with jump2header -->

| Field    | Optional | Default | Description |
| -------- | -------- | ------- | ----------- |
| type     |          |         | 'expression' |
| priority | Y        | &lt;auto&gt;  | determines priority ordering of styles |
| formulae |          |         | array of 1 formula string that returns a true/false value. To reference the cell value, use the top-left cell address |
| style    |          |         | style structure to apply if the formula returns true |

### Cell Is[⬆](#contents)<!-- Link generated with jump2header -->

| Field    | Optional | Default | Description |
| -------- | -------- | ------- | ----------- |
| type     |          |         | 'cellIs' |
| priority | Y        | &lt;auto&gt;  | determines priority ordering of styles |
| operator |          |         | how to compare cell value with formula result |
| formulae |          |         | array of 1 formula string that returns the value to compare against each cell |
| style    |          |         | style structure to apply if the comparison returns true |

**Cell Is Operators**

| Operator    | Description |
| ----------- | ----------- |
| equal       | Apply format if cell value equals formula value |
| greaterThan | Apply format if cell value is greater than formula value |
| lessThan    | Apply format if cell value is less than formula value |
| between     | Apply format if cell value is between two formula values (inclusive) |


### Top 10[⬆](#contents)<!-- Link generated with jump2header -->

| Field    | Optional | Default | Description |
| -------- | -------- | ------- | ----------- |
| type     |          |         | 'top10' |
| priority | Y        | &lt;auto&gt;  | determines priority ordering of styles |
| rank     | Y        | 10      | specifies how many top (or bottom) values are included in the formatting |
| percent  | Y        | false   | if true, the rank field is a percentage, not an absolute |
| bottom   | Y        | false   | if true, the bottom values are included instead of the top |
| style    |          |         | style structure to apply if the comparison returns true |

### Above Average[⬆](#contents)<!-- Link generated with jump2header -->

| Field         | Optional | Default | Description |
| ------------- | -------- | ------- | ----------- |
| type          |          |         | 'aboveAverage' |
| priority      | Y        | &lt;auto&gt;  | determines priority ordering of styles |
| aboveAverage  | Y        | false   | if true, the rank field is a percentage, not an absolute |
| style         |          |         | style structure to apply if the comparison returns true |

### Color Scale[⬆](#contents)<!-- Link generated with jump2header -->

| Field         | Optional | Default | Description |
| ------------- | -------- | ------- | ----------- |
| type          |          |         | 'colorScale' |
| priority      | Y        | &lt;auto&gt;  | determines priority ordering of styles |
| cfvo          |          |         | array of 2 to 5 Conditional Formatting Value Objects specifying way-points in the value range |
| color         |          |         | corresponding array of colours to use at given way points |
| style         |          |         | style structure to apply if the comparison returns true |

### Icon Set[⬆](#contents)<!-- Link generated with jump2header -->

| Field         | Optional | Default | Description |
| ------------- | -------- | ------- | ----------- |
| type          |          |         | 'iconSet' |
| priority      | Y        | &lt;auto&gt;  | determines priority ordering of styles |
| iconSet       | Y        | 3TrafficLights | name of icon set to use |
| showValue     |          | true    | Specifies whether the cells in the applied range display the icon and cell value, or the icon only |
| reverse       |          | false   | Specifies whether the icons in the icon set specified in iconSet are show in reserve order. If custom equals "true" this value must be ignored |
| custom        |          |  false  | Specifies whether a custom set of icons is used |
| cfvo          |          |         | array of 2 to 5 Conditional Formatting Value Objects specifying way-points in the value range |
| style         |          |         | style structure to apply if the comparison returns true |

### Data Bar[⬆](#contents)<!-- Link generated with jump2header -->

| Field      | Optional | Default | Description |
| ---------- | -------- | ------- | ----------- |
| type       |          |         | 'dataBar' |
| priority   | Y        | &lt;auto&gt;  | determines priority ordering of styles |
| minLength  |          | 0       | Specifies the length of the shortest data bar in this conditional formatting range |
| maxLength  |          | 100     | Specifies the length of the longest data bar in this conditional formatting range |
| showValue  |          | true    | Specifies whether the cells in the conditional formatting range display both the data bar and the numeric value or the data bar |
| gradient   |          | true    | Specifies whether the data bar has a gradient fill |
| border     |          | true    | Specifies whether the data bar has a border |
| negativeBarColorSameAsPositive  |                | true        | Specifies whether the data bar has a negative bar color that is different from the positive bar color |
| negativeBarBorderColorSameAsPositive  |          | true        | Specifies whether the data bar has a negative border color that is different from the positive border color |
| axisPosition  |       | 'auto'             | Specifies the axis position for the data bar |
| direction  |          | 'leftToRight'      | Specifies the direction of the data bar |
| cfvo          |          |         | array of 2 to 5 Conditional Formatting Value Objects specifying way-points in the value range |
| style         |          |         | style structure to apply if the comparison returns true |

### Contains Text[⬆](#contents)<!-- Link generated with jump2header -->

| Field    | Optional | Default | Description |
| -------- | -------- | ------- | ----------- |
| type     |          |         | 'containsText' |
| priority | Y        | &lt;auto&gt;  | determines priority ordering of styles |
| operator |          |         | type of text comparison |
| text     |          |         | text to search for |
| style    |          |         | style structure to apply if the comparison returns true |

**Contains Text Operators**

| Operator          | Description |
| ----------------- | ----------- |
| containsText      | Apply format if cell value contains the value specified in the 'text' field |
| containsBlanks    | Apply format if cell value contains blanks |
| notContainsBlanks | Apply format if cell value does not contain blanks |
| containsErrors    | Apply format if cell value contains errors |
| notContainsErrors | Apply format if cell value does not contain errors |

### Time Period[⬆](#contents)<!-- Link generated with jump2header -->

| Field      | Optional | Default | Description |
| ---------- | -------- | ------- | ----------- |
| type       |          |         | 'timePeriod' |
| priority   | Y        | &lt;auto&gt;  | determines priority ordering of styles |
| timePeriod |          |         | what time period to compare cell value to |
| style      |          |         | style structure to apply if the comparison returns true |

**Time Periods**

| Time Period       | Description |
| ----------------- | ----------- |
| lastWeek          | Apply format if cell value falls within the last week |
| thisWeek          | Apply format if cell value falls in this week |
| nextWeek          | Apply format if cell value falls in the next week |
| yesterday         | Apply format if cell value is equal to yesterday |
| today             | Apply format if cell value is equal to today |
| tomorrow          | Apply format if cell value is equal to tomorrow |
| last7Days         | Apply format if cell value falls within the last 7 days |
| lastMonth         | Apply format if cell value falls in last month |
| thisMonth         | Apply format if cell value falls in this month |
| nextMonth         | Apply format if cell value falls in next month |

## Outline Levels[⬆](#contents)<!-- Link generated with jump2header -->

Excel supports outlining; where rows or columns can be expanded or collapsed depending on what level of detail the user wishes to view.

Outline levels can be defined in column setup:
```javascript
worksheet.columns = [
  { header: 'Id', key: 'id', width: 10 },
  { header: 'Name', key: 'name', width: 32 },
  { header: 'D.O.B.', key: 'DOB', width: 10, outlineLevel: 1 }
];
```

Or directly on the row or column
```javascript
worksheet.getColumn(3).outlineLevel = 1;
worksheet.getRow(3).outlineLevel = 1;
```

The sheet outline levels can be set on the worksheet
```javascript
// set column outline level
worksheet.properties.outlineLevelCol = 1;

// set row outline level
worksheet.properties.outlineLevelRow = 1;
```

Note: adjusting outline levels on rows or columns or the outline levels on the worksheet will incur a side effect of also modifying the collapsed property of all rows or columns affected by the property change. E.g.:
```javascript
worksheet.properties.outlineLevelCol = 1;

worksheet.getColumn(3).outlineLevel = 1;
expect(worksheet.getColumn(3).collapsed).to.be.true;

worksheet.properties.outlineLevelCol = 2;
expect(worksheet.getColumn(3).collapsed).to.be.false;
```

The outline properties can be set on the worksheet

```javascript
worksheet.properties.outlineProperties = {
  summaryBelow: false,
  summaryRight: false,
};
```

## Images[⬆](#contents)<!-- Link generated with jump2header -->

Adding images to a worksheet is a two-step process.
First, the image is added to the workbook via the addImage() function which will also return an imageId value.
Then, using the imageId, the image can be added to the worksheet either as a tiled background or covering a cell range.

Note: As of this version, adjusting or transforming the image is not supported.

The streaming WorkbookWriter supports `worksheet.addImage(imageId, range)` and
`worksheet.addBackgroundImage(imageId)` too. There an image may also be given as
`{ stream, extension }`, where `stream` is a readable stream or a function that
returns one: images are written one after another, and a function is called only
when its image is written, so a workbook of many large images holds one at a time.

### Add Image to Workbook[⬆](#contents)<!-- Link generated with jump2header -->

The Workbook.addImage function supports adding images by filename or by Buffer.
Note that in both cases, the extension must be specified.
Valid extension values include 'jpeg', 'png', 'gif'.

```javascript
// add image to workbook by filename
const imageId1 = workbook.addImage({
  filename: 'path/to/image.jpg',
  extension: 'jpeg',
});

// add image to workbook by buffer
const imageId2 = workbook.addImage({
  buffer: fs.readFileSync('path/to.image.png'),
  extension: 'png',
});

// add image to workbook by base64
const myBase64Image = "data:image/png;base64,iVBORw0KG...";
const imageId2 = workbook.addImage({
  base64: myBase64Image,
  extension: 'png',
});
```

### Add image background to worksheet[⬆](#contents)<!-- Link generated with jump2header -->

Using the image id from Workbook.addImage, the background to a worksheet can be set using the addBackgroundImage function

```javascript
// set background
worksheet.addBackgroundImage(imageId1);
```

### Add image over a range[⬆](#contents)<!-- Link generated with jump2header -->

Using the image id from Workbook.addImage, an image can be embedded within the worksheet to cover a range.
The coordinates calculated from the range will cover from the top-left of the first cell to the bottom right of the second.

```javascript
// insert an image over B2:D6
worksheet.addImage(imageId2, 'B2:D6');
```

Using a structure instead of a range string, it is possible to partially cover cells.

Note that the coordinate system used for this is zero based, so the top-left of A1 will be { col: 0, row: 0 }.
Fractions of cells can be specified by using floating point numbers, e.g. the midpoint of A1 is { col: 0.5, row: 0.5 }.

```javascript
// insert an image over part of B2:D6
worksheet.addImage(imageId2, {
  tl: { col: 1.5, row: 1.5 },
  br: { col: 3.5, row: 5.5 }
});
```

The cell range can also have the property 'editAs' which will control how the image is anchored to the cell(s)
It can have one of the following values:

| Value     | Description |
| --------- | ----------- |
| undefined | It specifies the image will be moved and sized with cells |
| oneCell   | This is the default. Image will be moved with cells but not sized |
| absolute  | Image will not be moved or sized with cells |

```javascript
ws.addImage(imageId, {
  tl: { col: 0.1125, row: 0.4 },
  br: { col: 2.101046875, row: 3.4 },
  editAs: 'oneCell'
});
```

### Add image to a cell[⬆](#contents)<!-- Link generated with jump2header -->

You can add an image to a cell and then define its width and height in pixels at 96dpi.

```javascript
worksheet.addImage(imageId2, {
  tl: { col: 0, row: 0 },
  ext: { width: 500, height: 200 }
});
```

### Add image with hyperlinks[⬆](#contents)<!-- Link generated with jump2header -->

You can add an image with hyperlinks to a cell, and defines the hyperlinks in image range.

```javascript
worksheet.addImage(imageId2, {
  tl: { col: 0, row: 0 },
  ext: { width: 500, height: 200 },
  hyperlinks: {
    hyperlink: 'http://www.somewhere.com',
    tooltip: 'http://www.somewhere.com'
  }
});
```

## Sheet Protection[⬆](#contents)<!-- Link generated with jump2header -->

Worksheets can be protected from modification by adding a password.

```javascript
await worksheet.protect('the-password', options);
```

Worksheet protection can also be removed:

```javascript
worksheet.unprotect();
```


See <a href="#cell-protection">Cell Protection</a> for details on how
to modify individual cell protection.

**Note:** While the protect() function returns a Promise indicating
that it is async, the current implementation runs on the main
thread and will use approx 600ms on an average CPU. This can be adjusted
by setting the spinCount, which can be used to make the process either
faster or more resilient.

### Sheet Protection Options[⬆](#contents)<!-- Link generated with jump2header -->

| Field               | Default | Description |
| ------------------- | ------- | ----------- |
| selectLockedCells   | true    | Lets the user select locked cells |
| selectUnlockedCells | true    | Lets the user select unlocked cells |
| formatCells         | false   | Lets the user format cells |
| formatColumns       | false   | Lets the user format columns |
| formatRows          | false   | Lets the user format rows |
| insertRows          | false   | Lets the user insert rows |
| insertColumns       | false   | Lets the user insert columns |
| insertHyperlinks    | false   | Lets the user insert hyperlinks |
| deleteRows          | false   | Lets the user delete rows |
| deleteColumns       | false   | Lets the user delete columns |
| sort                | false   | Lets the user sort data |
| autoFilter          | false   | Lets the user filter data in tables |
| pivotTables         | false   | Lets the user use pivot tables |
| spinCount           | 100000  | The number of hash iterations performed when protecting or unprotecting |



## File I/O[⬆](#contents)<!-- Link generated with jump2header -->

### XLSX[⬆](#contents)<!-- Link generated with jump2header -->

#### Reading XLSX[⬆](#contents)<!-- Link generated with jump2header -->

Options supported when reading XLSX files.

| Field            |  Required   |    Type     |Description  |
| ---------------- | ----------- | ----------- | ----------- |
| ignoreNodes      |     N       |  Array      | A list of node names to ignore while loading the XLSX document. Improves performance in some situations. <br/> Available: `sheetPr`, `dimension`, `sheetViews `, `sheetFormatPr`, `cols `, `sheetData`, `autoFilter `, `mergeCells `, `rowBreaks`, `hyperlinks `, `pageMargins`, `dataValidations`, `pageSetup`, `headerFooter `, `printOptions `, `picture`, `drawing`, `sheetProtection`, `tableParts `, `conditionalFormatting`, `extLst`,|

```javascript
// read from a file
const workbook = new Excel.Workbook();
await workbook.xlsx.readFile(filename);
// ... use workbook


// read from a stream
const workbook = new Excel.Workbook();
await workbook.xlsx.read(stream);
// ... use workbook


// load from buffer
const workbook = new Excel.Workbook();
await workbook.xlsx.load(data);
// ... use workbook


// using additional options
const workbook = new Excel.Workbook();
await workbook.xlsx.load(data, {
  ignoreNodes: [
    'dataValidations' // ignores the workbook's Data Validations
  ],
});
// ... use workbook
```

#### Writing XLSX[⬆](#contents)<!-- Link generated with jump2header -->

```javascript
// write to a file
const workbook = createAndFillWorkbook();
await workbook.xlsx.writeFile(filename);

// write to a stream
await workbook.xlsx.write(stream);

// write to a new buffer
const buffer = await workbook.xlsx.writeBuffer();
```

### CSV[⬆](#contents)<!-- Link generated with jump2header -->

#### Reading CSV[⬆](#contents)<!-- Link generated with jump2header -->

Options supported when reading CSV files.

| Field            |  Required   |    Type     |Description  |
| ---------------- | ----------- | ----------- | ----------- |
| dateFormats      |     N       |  Array      | Specify the date encoding format of dayjs. |
| map              |     N       |  Function   | Custom Array.prototype.map() callback function for processing data. |
| sheetName        |     N       |  String     | Specify worksheet name. |
| parserOptions    |     N       |  Object     | [parseOptions options](https://c2fo.github.io/fast-csv/docs/parsing/options)  @fast-csv/format module to write csv data. |

```javascript
// read from a file
const workbook = new Excel.Workbook();
const worksheet = await workbook.csv.readFile(filename);
// ... use workbook or worksheet


// read from a stream
const workbook = new Excel.Workbook();
const worksheet = await workbook.csv.read(stream);
// ... use workbook or worksheet


// read from a file with European Dates
const workbook = new Excel.Workbook();
const options = {
  dateFormats: ['DD/MM/YYYY']
};
const worksheet = await workbook.csv.readFile(filename, options);
// ... use workbook or worksheet


// read from a file with custom value parsing
const workbook = new Excel.Workbook();
const options = {
  map(value, index) {
    switch(index) {
      case 0:
        // column 1 is string
        return value;
      case 1:
        // column 2 is a date
        return new Date(value);
      case 2:
        // column 3 is JSON of a formula value
        return JSON.parse(value);
      default:
        // the rest are numbers
        return parseFloat(value);
    }
  },
  // https://c2fo.github.io/fast-csv/docs/parsing/options
  parserOptions: {
    delimiter: '\t',
    quote: false,
  },
};
const worksheet = await workbook.csv.readFile(filename, options);
// ... use workbook or worksheet
```

The CSV parser uses [fast-csv](https://www.npmjs.com/package/fast-csv) to read the CSV file.
The formatterOptions in the options passed to the above write function will be passed to the @fast-csv/format module to write csv data.
 Please refer to the fast-csv README.md for details.

Dates are parsed using the npm module [dayjs](https://www.npmjs.com/package/dayjs).
 If a dateFormats array is not supplied, the following dateFormats are used:

* 'YYYY-MM-DD\[T\]HH:mm:ss'
* 'MM-DD-YYYY'
* 'YYYY-MM-DD'

Please refer to the [dayjs CustomParseFormat plugin](https://github.com/iamkun/dayjs/blob/HEAD/docs/en/Plugin.md#customparseformat) for details on how to structure a dateFormat.

#### Writing CSV[⬆](#contents)<!-- Link generated with jump2header -->

Options supported when writing to a CSV file.

| Field            |  Required   |    Type     | Description |
| ---------------- | ----------- | ----------- | ----------- |
| dateFormat       |     N       |  String     | Specify the date encoding format of dayjs. |
| dateUTC          |     N       |  Boolean    | Specify whether ExcelJS uses `dayjs.utc ()` to convert time zone for parsing dates. |
| encoding         |     N       |  String     | Specify file encoding format. (Only applies to `.writeFile`.) |
| includeEmptyRows |     N       |  Boolean    | Specifies whether empty rows can be written. |
| map              |     N       |  Function   | Custom Array.prototype.map() callback function for processing row values. |
| sheetName        |     N       |  String     | Specify worksheet name. |
| sheetId          |     N       |  Number     | Specify worksheet ID. |
| formatterOptions |     N       |  Object     | [formatterOptions options](https://c2fo.github.io/fast-csv/docs/formatting/options/) @fast-csv/format module to write csv data. |

```javascript

// write to a file
const workbook = createAndFillWorkbook();
await workbook.csv.writeFile(filename);

// write to a stream
// Be careful that you need to provide sheetName or
// sheetId for correct import to csv.
await workbook.csv.write(stream, { sheetName: 'Page name' });

// write to a file with European Date-Times
const workbook = new Excel.Workbook();
const options = {
  dateFormat: 'DD/MM/YYYY HH:mm:ss',
  dateUTC: true, // use utc when rendering dates
};
await workbook.csv.writeFile(filename, options);


// write to a file with custom value formatting
const workbook = new Excel.Workbook();
const options = {
  map(value, index) {
    switch(index) {
      case 0:
        // column 1 is string
        return value;
      case 1:
        // column 2 is a date
        return dayjs(value).format('YYYY-MM-DD');
      case 2:
        // column 3 is a formula, write just the result
        return value.result;
      default:
        // the rest are numbers
        return value;
    }
  },
  // https://c2fo.github.io/fast-csv/docs/formatting/options
  formatterOptions: {
    delimiter: '\t',
    quote: false,
  },
};
await workbook.csv.writeFile(filename, options);

// write to a new buffer
const buffer = await workbook.csv.writeBuffer();
```

The CSV parser uses [fast-csv](https://www.npmjs.com/package/fast-csv) to write the CSV file.
 The formatterOptions in the options passed to the above write function will be passed to the @fast-csv/format module to write csv data.
 Please refer to the fast-csv README.md for details.

Dates are formatted using the npm module [dayjs](https://www.npmjs.com/package/dayjs).
 If no dateFormat is supplied, dayjs.ISO_8601 is used.
 When writing a CSV you can supply the boolean dateUTC as true to have ExcelJS parse the date without automatically
 converting the timezone using `dayjs.utc()`.

### Streaming I/O[⬆](#contents)<!-- Link generated with jump2header -->

The File I/O documented above requires that an entire workbook is built up in memory before the file can be written.
 While convenient, it can limit the size of the document due to the amount of memory required.

A streaming writer (or reader) processes the workbook or worksheet data as it is generated,
 converting it into file form as it goes. Typically this is much more efficient on memory as the final
 memory footprint and even intermediate memory footprints are much more compact than with the document version,
 especially when you consider that the row and cell objects are disposed once they are committed.

The interface to the streaming workbook and worksheet is almost the same as the document versions with a few minor practical differences:

* Once a worksheet is added to a workbook, it cannot be removed.
* Once a row is committed, it is no longer accessible since it will have been dropped from the worksheet.
* unMergeCells() is not supported.

Note that it is possible to build the entire workbook without committing any rows.
 When the workbook is committed, all added worksheets (including all uncommitted rows) will be automatically committed.
 However in this case, little will have been gained over the Document version.

#### Streaming XLSX[⬆](#contents)<!-- Link generated with jump2header -->

##### Streaming XLSX Writer(#contents)<!-- Link generated with jump2header -->

The streaming XLSX workbook writer is available in the ExcelJS.stream.xlsx namespace.

The constructor takes an optional options object with the following fields:

| Field            | Description |
| ---------------- | ----------- |
| stream           | Specifies a writable stream to write the XLSX workbook to. |
| filename         | If stream not specified, this field specifies the path to a file to write the XLSX workbook to. |
| useSharedStrings | Specifies whether to use shared strings in the workbook. Default is `false`. |
| useStyles        | Specifies whether to add style information to the workbook. Styles can add some performance overhead. Default is `false`. |
| zip              | [Zip options](https://www.archiverjs.com/global.html#ZipOptions) that ExcelJS internally passes to [Archiver](https://github.com/archiverjs/node-archiver). Default is `undefined`. |

If neither stream nor filename is specified in the options, the workbook writer will create a StreamBuf object
 that will store the contents of the XLSX workbook in memory.
 This StreamBuf object, which can be accessed via the property workbook.stream, can be used to either
 access the bytes directly by stream.read() or to pipe the contents to another stream.

```javascript
// construct a streaming XLSX workbook writer with styles and shared strings
const options = {
  filename: './streamed-workbook.xlsx',
  useStyles: true,
  useSharedStrings: true
};
const workbook = new Excel.stream.xlsx.WorkbookWriter(options);
```

In general, the interface to the streaming XLSX writer is the same as the Document workbook (and worksheets)
 described above, in fact the row, cell and style objects are the same.

However there are some differences...

**Construction**

As seen above, the WorkbookWriter will typically require the output stream or file to be specified in the constructor.

**Committing Data**

When a worksheet row is ready, it should be committed so that the row object and contents can be freed.
 Typically this would be done as each row is added...

```javascript
worksheet.addRow({
   id: i,
   name: theName,
   etc: someOtherDetail
}).commit();
```

The reason the WorksheetWriter does not commit rows as they are added is to allow cells to be merged across rows:

```javascript
worksheet.mergeCells('A1:B2');
worksheet.getCell('A1').value = 'I am merged';
worksheet.getCell('C1').value = 'I am not';
worksheet.getCell('C2').value = 'Neither am I';
worksheet.getRow(2).commit(); // now rows 1 and two are committed.
```

As each worksheet is completed, it must also be committed:

```javascript
// Finished adding data. Commit the worksheet
worksheet.commit();
```

To complete the XLSX document, the workbook must be committed. If any worksheet in a workbook are uncommitted,
 they will be committed automatically as part of the workbook commit.

```javascript
// Finished the workbook.
await workbook.commit();
// ... the stream has been written
```

##### Streaming XLSX Reader(#contents)<!-- Link generated with jump2header -->

The streaming XLSX workbook reader is available in the ExcelJS.stream.xlsx namespace.

The constructor takes a required input argument and an optional options argument:

| Argument              | Description |
| --------------------- | ----------- |
| input (required)      | Specifies the name of the file or the readable stream from which to read the XLSX workbook. |
| options (optional)    | Specifies how to handle the event types occuring during the read parsing. |
| options.entries       | Specifies whether to emit entries (`'emit'`) or not (`'ignore'`). Default is `'emit'`. |
| options.sharedStrings | Specifies whether to cache shared strings (`'cache'`), which inserts them into the respective cell values, or whether to emit them (`'emit'`) or ignore them (`'ignore'`), in both of which case the cell value will be a reference to the shared string's index. Default is `'cache'`. |
| options.hyperlinks    | Specifies whether to cache hyperlinks (`'cache'`), which inserts them into their respective cells, whether to emit them (`'emit'`) or whether to ignore them (`'ignore'`). Default is `'cache'`. |
| options.styles        | Specifies whether to cache styles (`'cache'`), which inserts them into their respective rows and cells, or whether to ignore them (`'ignore'`). Default is `'cache'`. |
| options.worksheets    | Specifies whether to emit worksheets (`'emit'`) or not (`'ignore'`). Default is `'emit'`. |

```js
const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader('./file.xlsx');
for await (const worksheetReader of workbookReader) {
  for await (const row of worksheetReader) {
    // ...
  }
}
```

Please note that `worksheetReader` returns an array of rows rather than each row individually for performance reasons: https://github.com/nodejs/node/issues/31979

###### Iterating over all events(#contents)<!-- Link generated with jump2header -->

Events on workbook are 'worksheet', 'shared-strings' and 'hyperlinks'. Events on worksheet are 'row' and 'hyperlinks'.

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

###### Readable stream(#contents)<!-- Link generated with jump2header -->

While we strongly encourage to use async iteration, we also expose a streaming interface for backwards compatibility.

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

# Browser[⬆](#contents)<!-- Link generated with jump2header -->

A portion of this library has been isolated and tested for use within a browser environment.

Due to the streaming nature of the workbook reader and workbook writer, these have not been included.
Only the document based workbook may be used (see <a href="#create-a-workbook">Create a Workbook</a> for details).

For example code using ExcelJS in the browser take a look at the <a href="https://github.com/exceljs/exceljs/tree/master/spec/browser">spec/browser</a> folder in the github repo.

## Prebundled[⬆](#contents)<!-- Link generated with jump2header -->

The following files are pre-bundled and included inside the dist folder.

* exceljs.js
* exceljs.min.js

# Value Types[⬆](#contents)<!-- Link generated with jump2header -->

The following value types are supported.

## Null Value[⬆](#contents)<!-- Link generated with jump2header -->

Enum: Excel.ValueType.Null

A null value indicates an absence of value and will typically not be stored when written to file (except for merged cells).
  It can be used to remove the value from a cell.

E.g.

```javascript
worksheet.getCell('A1').value = null;
```

## Merge Cell[⬆](#contents)<!-- Link generated with jump2header -->

Enum: Excel.ValueType.Merge

A merge cell is one that has its value bound to another 'master' cell.
  Assigning to a merge cell will cause the master's cell to be modified.

## Number Value[⬆](#contents)<!-- Link generated with jump2header -->

Enum: Excel.ValueType.Number

A numeric value.

E.g.

```javascript
worksheet.getCell('A1').value = 5;
worksheet.getCell('A2').value = 3.14159;
```

## String Value[⬆](#contents)<!-- Link generated with jump2header -->

Enum: Excel.ValueType.String

A simple text string.

E.g.

```javascript
worksheet.getCell('A1').value = 'Hello, World!';
```

## Date Value[⬆](#contents)<!-- Link generated with jump2header -->

Enum: Excel.ValueType.Date

A date value, represented by the JavaScript Date type.

E.g.

```javascript
worksheet.getCell('A1').value = new Date(2017, 2, 15);
```

## Hyperlink Value[⬆](#contents)<!-- Link generated with jump2header -->

Enum: Excel.ValueType.Hyperlink

A URL with both text and link value.

E.g.
```javascript
// link to web
worksheet.getCell('A1').value = {
  text: 'www.mylink.com',
  hyperlink: 'http://www.mylink.com',
  tooltip: 'www.mylink.com'
};

// internal link
worksheet.getCell('A1').value = { text: 'Sheet2', hyperlink: '#\'Sheet2\'!A1' };
```

## Formula Value[⬆](#contents)<!-- Link generated with jump2header -->

Enum: Excel.ValueType.Formula

An Excel formula for calculating values on the fly.
  Note that while the cell type will be Formula, the cell may have an effectiveType value that will
  be derived from the result value.

Notes:
* ExcelJS cannot process the formula to generate a result, it must be supplied.
* Function semantic names must be in English and the separator must be a comma.
* Do not enter a leading `=` before the formula.

E.g.

```javascript
worksheet.getCell('A3').value = { formula: 'A1+A2', result: 7 };
worksheet.getCell('A3').value = { formula: 'SUM(A1,A2)', result: 7 };
```

Cells also support convenience getters to access the formula and result:

```javascript
worksheet.getCell('A3').formula === 'A1+A2';
worksheet.getCell('A3').result === 7;
```

### Shared Formula[⬆](#contents)<!-- Link generated with jump2header -->

Shared formulae enhance the compression of the xlsx document by decreasing the repetition
of text within the worksheet xml.
The top-left cell in a range is the designated master and will hold the
formula that all the other cells in the range will derive from.
The other 'slave' cells can then refer to this master cell instead of redefining the
whole formula again.
Note that the master formula will be translated to the slave cells in the usual
Excel fashion so that references to other cells will be shifted down and
to the right depending on the slave's offset to the master.
For example: if the master cell A2 has a formula referencing A1 then
if cell B2 shares A2's formula, then it will reference B1.

A master formula can be assigned to a cell along with the slave cells in its range

```javascript
worksheet.getCell('A2').value = {
  formula: 'A1',
  result: 10,
  shareType: 'shared',
  ref: 'A2:B3'
};
```

A shared formula can be assigned to a cell using a new value form:

```javascript
worksheet.getCell('B2').value = { sharedFormula: 'A2', result: 10 };
```

This specifies that the cell B2 is a formula that will be derived from the formula in
A2 and its result is 10.

The formula convenience getter will translate the formula in A2 to what it should be in B2:

```javascript
expect(worksheet.getCell('B2').formula).to.equal('B1');
```

Shared formulae can be assigned into a sheet using the 'fillFormula' function:

```javascript
// set A1 to starting number
worksheet.getCell('A1').value = 1;

// fill A2 to A10 with ascending count starting from A1
worksheet.fillFormula('A2:A10', 'A1+1', [2,3,4,5,6,7,8,9,10]);
```

fillFormula can also use a callback function to calculate the value at each cell

```javascript
// fill A2 to A100 with ascending count starting from A1
worksheet.fillFormula('A2:A100', 'A1+1', (row, col) => row);
```

### Formula Type[⬆](#contents)<!-- Link generated with jump2header -->

To distinguish between real and translated formula cells, use the formulaType getter:

```javascript
worksheet.getCell('A3').formulaType === Enums.FormulaType.Master;
worksheet.getCell('B3').formulaType === Enums.FormulaType.Shared;
```

Formula type has the following values:

| Name                       |  Value  |
| -------------------------- | ------- |
| Enums.FormulaType.None     |   0     |
| Enums.FormulaType.Master   |   1     |
| Enums.FormulaType.Shared   |   2     |

### Array Formula[⬆](#contents)<!-- Link generated with jump2header -->

A new way of expressing shared formulae in Excel is the array formula.
In this form, the master cell is the only cell that contains any information relating to a formula.
It contains the shareType 'array' along with the range of cells it applies to and the formula that will be copied.
The rest of the cells are regular cells with regular values.

Note: array formulae are not translated in the way shared formulae are.
So if master cell A2 refers to A1, then slave cell B2 will also refer to A1.

E.g.
```javascript
// assign array formula to A2:B3
worksheet.getCell('A2').value = {
  formula: 'A1',
  result: 10,
  shareType: 'array',
  ref: 'A2:B3'
};

// it may not be necessary to fill the rest of the values in the sheet
```

The fillFormula function can also be used to fill an array formula

```javascript
// fill A2:B3 with array formula "A1"
worksheet.fillFormula('A2:B3', 'A1', [1,1,1,1], 'array');
```


## Rich Text Value[⬆](#contents)<!-- Link generated with jump2header -->

Enum: Excel.ValueType.RichText

Rich, styled text.

E.g.
```javascript
worksheet.getCell('A1').value = {
  richText: [
    { text: 'This is '},
    {font: {italic: true}, text: 'italic'},
  ]
};
```

## Boolean Value[⬆](#contents)<!-- Link generated with jump2header -->

Enum: Excel.ValueType.Boolean

E.g.

```javascript
worksheet.getCell('A1').value = true;
worksheet.getCell('A2').value = false;
```

## Error Value[⬆](#contents)<!-- Link generated with jump2header -->

Enum: Excel.ValueType.Error

E.g.

```javascript
worksheet.getCell('A1').value = { error: '#N/A' };
worksheet.getCell('A2').value = { error: '#VALUE!' };
```

The current valid Error text values are:

| Name                           | Value       |
| ------------------------------ | ----------- |
| Excel.ErrorValue.NotApplicable | #N/A        |
| Excel.ErrorValue.Ref           | #REF!       |
| Excel.ErrorValue.Name          | #NAME?      |
| Excel.ErrorValue.DivZero       | #DIV/0!     |
| Excel.ErrorValue.Null          | #NULL!      |
| Excel.ErrorValue.Value         | #VALUE!     |
| Excel.ErrorValue.Num           | #NUM!       |

# Interface Changes[⬆](#contents)<!-- Link generated with jump2header -->

Every effort is made to make a good consistent interface that doesn't break through the versions but regrettably, now and then some things have to change for the greater good.

## 0.1.0[⬆](#contents)<!-- Link generated with jump2header -->

### Worksheet.eachRow[⬆](#contents)<!-- Link generated with jump2header -->

The arguments in the callback function to Worksheet.eachRow have been swapped and changed; it was function(rowNumber,rowValues), now it is function(row, rowNumber) which gives it a look and feel more like the underscore (_.each) function and priorities the row object over the row number.

### Worksheet.getRow[⬆](#contents)<!-- Link generated with jump2header -->

This function has changed from returning a sparse array of cell values to returning a Row object. This enables accessing row properties and will facilitate managing row styles and so on.

The sparse array of cell values is still available via Worksheet.getRow(rowNumber).values;

## 0.1.1[⬆](#contents)<!-- Link generated with jump2header -->

### cell.model[⬆](#contents)<!-- Link generated with jump2header -->

cell.styles renamed to cell.style

## 0.2.44[⬆](#contents)<!-- Link generated with jump2header -->

Promises returned from functions switched from Bluebird to native node Promise which can break calling code
 if they rely on Bluebird's extra features.

To mitigate this the following two changes were added to 0.3.0:

* A more fully featured and still browser compatible promise lib is used by default. This lib supports many of the features of Bluebird but with a much lower footprint.
* An option to inject a different Promise implementation. See <a href="#config">Config</a> section for more details.

# Config[⬆](#contents)<!-- Link generated with jump2header -->

ExcelJS now supports dependency injection for the promise library.
 You can restore Bluebird promises by including the following code in your module...

```javascript
ExcelJS.config.setValue('promise', require('bluebird'));
```

Please note: I have tested ExcelJS with bluebird specifically (since up until recently this was the library it used).
 From the tests I have done it will not work with Q.

# Caveats[⬆](#contents)<!-- Link generated with jump2header -->

## Dist Folder[⬆](#contents)<!-- Link generated with jump2header -->

Before publishing this module, the source code is transpiled and otherwise processed
before being placed in a dist/ folder.
This README identifies two files - a browserified bundle and minified version.
No other contents of the dist/ folder are guaranteed in any way other than the file
specified as "main" in the package.json


# Known Issues[⬆](#contents)<!-- Link generated with jump2header -->

## Testing with Puppeteer[⬆](#contents)<!-- Link generated with jump2header -->

The test suite included in this lib includes a small script executed in a headless browser
to validate the bundled packages. At the time of this writing, it appears that
this test does not play nicely in the Windows Linux subsystem.

For this reason, the browser test can be disabled by the existence of a file named .disable-test-browser

```bash
sudo apt-get install libfontconfig
```

## Splice vs Merge[⬆](#contents)<!-- Link generated with jump2header -->

If any splice operation affects a merged cell, the merge group will not be moved correctly

# Release History[⬆](#contents)<!-- Link generated with jump2header -->

| Version | Changes |
|---------| ------- |
| 0.0.9   | <ul><li><a href="#number-formats">Number Formats</a></li></ul> |
| 0.1.0   | <ul><li>Bug Fixes<ul><li>"&lt;" and "&gt;" text characters properly rendered in xlsx</li></ul></li><li><a href="#columns">Better Column control</a></li><li><a href="#rows">Better Row control</a></li></ul> |
| 0.1.1   | <ul><li>Bug Fixes<ul><li>More textual data written properly to xml (including text, hyperlinks, formula results and format codes)</li><li>Better date format code recognition</li></ul></li><li><a href="#fonts">Cell Font Style</a></li></ul> |
| 0.1.2   | <ul><li>Fixed potential race condition on zip write</li></ul> |
| 0.1.3   | <ul><li><a href="#alignment">Cell Alignment Style</a></li><li><a href="#rows">Row Height</a></li><li>Some Internal Restructuring</li></ul> |
| 0.1.5   | <ul><li>Bug Fixes<ul><li>Now handles 10 or more worksheets in one workbook</li><li>theme1.xml file properly added and referenced</li></ul></li><li><a href="#borders">Cell Borders</a></li></ul> |
| 0.1.6   | <ul><li>Bug Fixes<ul><li>More compatible theme1.xml included in XLSX file</li></ul></li><li><a href="#fills">Cell Fills</a></li></ul> |
| 0.1.8   | <ul><li>Bug Fixes<ul><li>More compatible theme1.xml included in XLSX file</li><li>Fixed filename case issue</li></ul></li><li><a href="#fills">Cell Fills</a></li></ul> |
| 0.1.9   | <ul><li>Bug Fixes<ul><li>Added docProps files to satisfy Mac Excel users</li><li>Fixed filename case issue</li><li>Fixed worksheet id issue</li></ul></li><li><a href="#set-workbook-properties">Core Workbook Properties</a></li></ul> |
| 0.1.10  | <ul><li>Bug Fixes<ul><li>Handles File Not Found error</li></ul></li><li><a href="#csv">CSV Files</a></li></ul> |
| 0.1.11  | <ul><li>Bug Fixes<ul><li>Fixed Vertical Middle Alignment Issue</li></ul></li><li><a href="#styles">Row and Column Styles</a></li><li><a href="#rows">Worksheet.eachRow supports options</a></li><li><a href="#rows">Row.eachCell supports options</a></li><li><a href="#columns">New function Column.eachCell</a></li></ul> |
| 0.2.0   | <ul><li><a href="#streaming-xlxs-writer">Streaming XLSX Writer</a><ul><li>At long last ExcelJS can support writing massive XLSX files in a scalable memory efficient manner. Performance has been optimised and even smaller spreadsheets can be faster to write than the document writer. Options have been added to control the use of shared strings and styles as these can both have a considerable effect on performance</li></ul></li><li><a href="#rows">Worksheet.lastRow</a><ul><li>Access the last editable row in a worksheet.</li></ul></li><li><a href="#rows">Row.commit()</a><ul><li>For streaming writers, this method commits the row (and any previous rows) to the stream. Committed rows will no longer be editable (and are typically deleted from the worksheet object). For Document type workbooks, this method has no effect.</li></ul></li></ul> |
| 0.2.2   | <ul><li><a href="https://pbs.twimg.com/profile_images/2933552754/fc8c70829ee964c5542ae16453503d37.jpeg">One Billion Cells</a><ul><li>Achievement Unlocked: A simple test using ExcelJS has created a spreadsheet with 1,000,000,000 cells. Made using random data with 100,000,000 rows of 10 cells per row. I cannot validate the file yet as Excel will not open it and I have yet to implement the streaming reader but I have every confidence that it is good since 1,000,000 rows loads ok.</li></ul></li></ul> |
| 0.2.3   | <ul><li>Bug Fixes<ul><li><a href="https://github.com/exceljs/exceljs/issues/18">Merge Cell Styles</a><ul><li>Merged cells now persist (and parse) their styles.</li></ul></li></ul></li><li><a href="#streaming-xlxs-writer">Streaming XLSX Writer</a><ul><li>At long last ExcelJS can support writing massive XLSX files in a scalable memory efficient manner. Performance has been optimised and even smaller spreadsheets can be faster to write than the document writer. Options have been added to control the use of shared strings and styles as these can both have a considerable effect on performance</li></ul></li><li><a href="#rows">Worksheet.lastRow</a><ul><li>Access the last editable row in a worksheet.</li></ul></li><li><a href="#rows">Row.commit()</a><ul><li>For streaming writers, this method commits the row (and any previous rows) to the stream. Committed rows will no longer be editable (and are typically deleted from the worksheet object). For Document type workbooks, this method has no effect.</li></ul></li></ul> |
| 0.2.4   | <ul><li>Bug Fixes<ul><li><a href="https://github.com/exceljs/exceljs/issues/27">Worksheets with Ampersand Names</a><ul><li>Worksheet names are now xml-encoded and should work with all xml compatible characters</li></ul></li></ul></li><li><a href="#rows">Row.hidden</a> & <a href="#columns">Column.hidden</a><ul><li>Rows and Columns now support the hidden attribute.</li></ul></li><li><a href="#worksheet">Worksheet.addRows</a><ul><li>New function to add an array of rows (either array or object form) to the end of a worksheet.</li></ul></li></ul> |
| 0.2.6   | <ul><li>Bug Fixes<ul><li><a href="https://github.com/exceljs/exceljs/issues/87">invalid signature: 0x80014</a>: Thanks to <a href="https://github.com/hasanlussa">hasanlussa</a> for the PR</li></ul></li><li><a href="#defined-names">Defined Names</a><ul><li>Cells can now have assigned names which may then be used in formulas.</li></ul></li><li>Converted Bluebird.defer() to new Bluebird(function(resolve, reject){}). Thanks to user <a href="https://github.com/Nishchit14">Nishchit</a> for the Pull Request</li></ul> |
| 0.2.7   | <ul><li><a href="#data-validations">Data Validations</a><ul><li>Cells can now define validations that controls the valid values the cell can have</li></ul></li></ul> |
| 0.2.8   | <ul><li><a href="rich-text">Rich Text Value</a><ul><li>Cells now support <b><i>in-cell</i></b> formatting - Thanks to <a href="https://github.com/pvadam">Peter ADAM</a></li></ul></li><li>Fixed typo in README - Thanks to <a href="https://github.com/MRdNk">MRdNk</a></li><li>Fixing emit in worksheet-reader - Thanks to <a href="https://github.com/alangunning">Alan Gunning</a></li><li>Clearer Docs - Thanks to <a href="https://github.com/miensol">miensol</a></li></ul> |
| 0.2.9   | <ul><li>Fixed "read property 'richText' of undefined error. Thanks to  <a href="https://github.com/james075">james075</a></li></ul> |
| 0.2.10  | <ul><li>Refactoring Complete. All unit and integration tests pass.</li></ul> |
| 0.2.11  | <ul><li><a href="#outline-level">Outline Levels</a>. Thanks to <a href="https://github.com/cricri">cricri</a> for the contribution.</li><li><a href="#worksheet-properties">Worksheet Properties</a></li><li>Further refactoring of worksheet writer.</li></ul> |
| 0.2.12  | <ul><li><a href="#worksheet-views">Sheet Views</a>. Thanks to <a href="https://github.com/cricri">cricri</a> again for the contribution.</li></ul> |
| 0.2.13  | <ul><li>Fix for <a href="https://github.com/exceljs/exceljs/issues">exceljs might be vulnerable for regular expression denial of service</a>. Kudos to <a href="https://github.com/yonjah">yonjah</a> and <a href="https://www.youtube.com/watch?v=wCfE-9bhY2Y">Josh Emerson</a> for the resolution.</li><li>Fix for <a href="https://github.com/exceljs/exceljs/issues/162">Multiple Sheets opens in 'Group' mode in Excel</a>. My bad - overzealous sheet view code.</li><li>Also fix for empty sheet generating invalid xlsx.</li></ul> |
| 0.2.14  | <ul><li>Fix for <a href="https://github.com/exceljs/exceljs/issues">exceljs might be vulnerable for regular expression denial of service</a>. Kudos to <a href="https://github.com/yonjah">yonjah</a> and <a href="https://www.youtube.com/watch?v=wCfE-9bhY2Y">Josh Emerson</a> for the resolution.</li><li>Fixed <a href="https://github.com/exceljs/exceljs/issues/162">Multiple Sheets opens in 'Group' mode in Excel</a> again. Added <a href="#workbook-views">Workbook views</a>.</li><li>Also fix for empty sheet generating invalid xlsx.</li></ul> |
| 0.2.15  | <ul><li>Added <a href="#page-setup">Page Setup Properties</a>. Thanks to <a href="https://github.com/jackkum">Jackkum</a> for the PR</li></ul> |
| 0.2.16  | <ul><li>New <a href="#page-setup">Page Setup</a> Property: Print Area</li></ul> |
| 0.2.17  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/114">Fix a bug on phonetic characters</a>. This fixes an issue related to reading workbooks with phonetic text in. Note phonetic text is not properly supported yet - just properly ignored. Thanks to <a href="https://github.com/zephyrrider">zephyrrider</a> and <a href="https://github.com/gen6033">gen6033</a> for the contribution.</li></ul> |
| 0.2.18  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/175">Fix regression #150: Stream API fails to write XLSX files</a>. Apologies for the regression! Thanks to <a href="https://github.com/danieleds">danieleds</a> for the fix.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/114">Fix a bug on phonetic characters</a>. This fixes an issue related to reading workbooks with phonetic text in. Note phonetic text is not properly supported yet - just properly ignored. Thanks to <a href="https://github.com/zephyrrider">zephyrrider</a> and <a href="https://github.com/gen6033">gen6033</a> for the contribution.</li></ul> |
| 0.2.19  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/119">Update xlsx.js #119</a>. This should make parsing more resilient to open-office documents. Thanks to <a href="https://github.com/nvitaterna">nvitaterna</a> for the contribution.</li></ul> |
| 0.2.20  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/179">Changes from exceljs/exceljs#127 applied to latest version #179</a>. Fixes parsing of defined name values. Thanks to <a href="https://github.com/agdevbridge">agdevbridge</a> and <a href="https://github.com/priitliivak">priitliivak</a> for the contribution.</li></ul> |
| 0.2.21  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/135">color tabs for worksheet-writer #135</a>. Modified the behaviour to print deprecation warning as tabColor has moved into options.properties. Thanks to <a href="https://github.com/ethanlook">ethanlook</a> for the contribution.</li></ul> |
| 0.2.22  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/136">Throw legible error when failing Value.getType() #136</a>. Thanks to <a href="https://github.com/wulfsolter">wulfsolter</a> for the contribution.</li><li>Honourable mention to contributors whose PRs were fixed before I saw them:<ul><li><a href="https://github.com/haoliangyu">haoliangyu</a></li><li><a href="https://github.com/wulfsolter">wulfsolter</a></li></ul></li></ul> |
| 0.2.23  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/137">Fall back to JSON.stringify() if unknown Cell.Type #137</a> with some modification. If a cell value is assigned to an unrecognisable javascript object, the stored value in xlsx and csv files will  be JSON stringified. Note that if the file is read again, no attempt will be made to parse the stringified JSON text. Thanks to <a href="https://github.com/wulfsolter">wulfsolter</a> for the contribution.</li></ul> |
| 0.2.24  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/166">Protect cell fix #166</a>. This does not mean full support for protected cells merely that the parser is not confused by the extra xml. Thanks to <a href="https://github.com/jayflo">jayflo</a> for the contribution.</li></ul> |
| 0.2.25  | <ul><li>Added functions to delete cells, rows and columns from a worksheet. Modelled after the Array splice method, the functions allow cells, rows and columns to be deleted (and optionally inserted). See <a href="#columns">Columns</a> and <a href="#rows">Rows</a> for details.<br />Note: <a href="#splice-vs-merge">Not compatible with cell merges</a></li></ul> |
| 0.2.26  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/184">Update border-xform.js #184</a>Border edges without style will be parsed and rendered as no-border. Thanks to <a href="https://github.com/skumarnk2">skumarnk2</a> for the contribution.</li></ul> |
| 0.2.27  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/187">Pass views to worksheet-writer #187</a>. Now also passes views to worksheet-writer. Thanks to <a href="https://github.com/Temetz">Temetz</a> for the contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/189">Do not escape xml characters when using shared strings #189</a>. Fixing bug in shared strings. Thanks to <a href="https://github.com/tkirda">tkirda</a> for the contribution.</li></ul> |
| 0.2.28  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/190">Fix tiny bug [Update hyperlink-map.js] #190</a>Thanks to <a href="https://github.com/lszlkss">lszlkss</a> for the contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/196">fix typo on sheet view showGridLines option #196</a> "showGridlines" should have been "showGridLines". Thanks to <a href="https://github.com/gadiaz1">gadiaz1</a> for the contribution.</li></ul> |
| 0.2.29  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/199">Fire finish event instead of end event on write stream #199</a> and <a href="https://github.com/exceljs/exceljs/pull/200">Listen for finish event on zip stream instead of middle stream #200</a>. Fixes issues with stream completion events. Thanks to <a href="https://github.com/junajan">junajan</a> for the contribution.</li></ul> |
| 0.2.30  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/201">Fix issue #178 #201</a>. Adds the following properties to workbook:<ul><li>title</li><li>subject</li><li>keywords</li><li>category</li><li>description</li><li>company</li><li>manager</li></ul>Thanks to <a href="https://github.com/stavenko">stavenko</a> for the contribution.</li></ul> |
| 0.2.31  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/203">Fix issue #163: the "spans" attribute of the row element is optional #203</a>. Now xlsx parsing will handle documents without row spans. Thanks to <a href="https://github.com/arturas-vitkauskas">arturas-vitkauskas</a> for the contribution.</li></ul> |
| 0.2.32  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/208">Fix issue 206 #208</a>. Fixes issue reading xlsx files that have been printed. Also adds "lastPrinted" property to Workbook. Thanks to <a href="https://github.com/arturas-vitkauskas">arturas-vitkauskas</a> for the contribution.</li></ul> |
| 0.2.33  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/210">Allow styling of cells with no value. #210</a>. Includes Null type cells with style in the rendering parsing. Thanks to <a href="https://github.com/oferns">oferns</a> for the contribution.</li></ul> |
| 0.2.34  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/212">Fix "Unexpected xml node in parseOpen" bug in LibreOffice documents for attributes dc:language and cp:revision #212</a>. Thanks to <a href="https://github.com/jessica-jordan">jessica-jordan</a> for the contribution.</li></ul> |
| 0.2.35  | <ul><li>Fixed <a href="https://github.com/exceljs/exceljs/issues/74">Getting a column/row count #74</a>. <a href="#worksheet-metrics">Worksheet</a> now has rowCount and columnCount properties (and actual variants), <a href="row">Row</a> has cellCount.</li></ul> |
| 0.2.36  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/217">Stream reader fixes #217</a>. Thanks to <a href="https://github.com/kturney">kturney</a> for the contribution.</li></ul> |
| 0.2.37  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/225">Fix output order of Sheet Properties #225</a>. Thanks to <a href="https://github.com/keeneym">keeneym</a> for the contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/231">remove empty worksheet[0] from _worksheets #231</a>. Thanks to <a href="https://github.com/pookong">pookong</a> for the contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/232">do not skip empty string in shared strings so that indexes match #232</a>. Thanks again to <a href="https://github.com/pookong">pookong</a> for the contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/233">use shared strings for streamed writes #233</a>. Thanks again to <a href="https://github.com/pookong">pookong</a> for the contribution.</li></ul> |
| 0.2.38  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/236">Add a comment for issue #216 #236</a>. Thanks to <a href="https://github.com/jsalwen">jsalwen</a> for the contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/237">Start on support for 1904 based dates #237</a>. Fixed date handling in documents with the 1904 flag set. Thanks to <a href="https://github.com/holm">holm</a> for the contribution.</li></ul> |
| 0.2.39  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/245">Stops Bluebird warning about unreturned promise #245</a>. Thanks to <a href="https://github.com/robinbullocks4rb">robinbullocks4rb</a> for the contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/247">Added missing dependency: col-cache.js #247</a>. Thanks to <a href="https://github.com/Manish2005">Manish2005</a> for the contribution. </li> </ul> |
| 0.2.42  | <ul><li>Browser Compatible!<ul><li>Well mostly. I have added a browser sub-folder that contains a browserified bundle and an index.js that can be used to generate another. See <a href="#browser">Browser</a> section for details.</li></ul></li><li>Fixed corrupted theme.xml. Apologies for letting that through.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/253">[BUGFIX] data validation formulae undefined #253</a>. Thanks to <a href="https://github.com/jayflo">jayflo</a> for the contribution.</li></ul> |
| 0.2.43  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/255">added a (maybe partial) solution to issue 99. i wasn't able to create an appropriate test #255</a>. This fixes <a href="https://github.com/exceljs/exceljs/issues/99">Too few data or empty worksheet generate malformed excel file #99</a>. Thanks to <a href="https://github.com/mminuti">mminuti</a> for the contribution.</li></ul> |
| 0.2.44  | <ul><li>Reduced Dependencies.<ul><li>Goodbye lodash, goodbye bluebird. Minified bundle is now just over half what it was in the first version.</li></ul></li></ul> |
| 0.2.45  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/256">Sheets with hyperlinks and data validations are corrupted #256</a>. Thanks to <a href="https://github.com/simon-stoic">simon-stoic</a> for the contribution.</li></ul> |
| 0.2.46  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/259">Exclude character controls from XML output. Fixes #234 #262</a>. Thanks to <a href="https://github.com/holm">holm</a> for the contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/262">Add support for identifier #259</a>. This fixes <a href="https://github.com/exceljs/exceljs/issues/234">Broken XLSX because of "vertical tab" ascii character in a cell #234</a>. Thanks to <a href="https://github.com/NOtherDev">NOtherDev</a> for the contribution.</li></ul> |
| 0.3.0   | <ul><li>Addressed <a href="https://github.com/exceljs/exceljs/issues/266">Breaking change removing bluebird #266</a>. Appologies for any inconvenience.</li><li>Added Promise library dependency injection. See <a href="#config">Config</a> section for more details.</li></ul> |
| 0.3.1   | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/279">Update dependencies #279</a>. Thanks to <a href="https://github.com/holm">holm</a> for the contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/267">Minor fixes for stream handling #267</a>. Thanks to <a href="https://github.com/holm">holm</a> for the contribution.</li><li>Added automated tests in phantomjs for the browserified code.</li></ul> |
| 0.4.0   | <ul><li>Fixed issue <a href="https://github.com/exceljs/exceljs/issues/278">Boolean cell with value ="true" is returned as 1 #278</a>. The fix involved adding two new Call Value types:<ul><li><a href="#boolean-value">Boolean Value</a></li><li><a href="#error-value">Error Value</a></li></ul>Note: Minor version has been bumped up to 4 as this release introduces a couple of interface changes:<ul><li>Boolean cells previously will have returned 1 or 0 will now return true or false</li><li>Error cells that previously returned a string value will now return an error structure</li></ul></li><li>Fixed issue <a href="https://github.com/exceljs/exceljs/issues/280">Code correctness - setters don't return a value #280</a>.</li><li>Addressed issue <a href="https://github.com/exceljs/exceljs/issues/288">v0.3.1 breaks meteor build #288</a>.</li></ul> |
| 0.4.1   | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/285">Add support for cp:contentStatus #285</a>. Thanks to <a href="https://github.com/holm">holm</a> for the contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/286">Fix Valid characters in XML (allow \n and \r when saving) #286</a>. Thanks to <a href="https://github.com/Rycochet">Rycochet</a> for the contribution.</li><li>Fixed <a href="https://github.com/exceljs/exceljs/issues/275">hyperlink with query arguments corrupts workbook #275</a>. The hyperlink target is not escaped before serialising in the xml.</li></ul> |
| 0.4.2   | <ul><li><p>Addressed the following issues:<ul><li><a href="https://github.com/exceljs/exceljs/issues/290">White text and borders being changed to black #290</a></li><li><a href="https://github.com/exceljs/exceljs/issues/261">Losing formatting/pivot table from loaded file #261</a></li><li><a href="https://github.com/exceljs/exceljs/issues/272">Solid fill become black #272</a></li></ul>These issues are potentially caused by a bug that caused colours with zero themes, tints or indexes to be rendered and parsed incorrectly.</p><p>Regarding themes: the theme files stored inside the xlsx container hold important information regarding colours, styles etc and if the theme information from a loaded xlsx file is lost, the results can be unpredictable and undesirable. To address this, when an ExcelJS Workbook parses an XLSX file, it will preserve any theme files it finds and include them when writing to a new XLSX. If this behaviour is not desired, the Workbook class exposes a clearThemes() function which will drop the theme content. Note that this behaviour is only implemented in the document based Workbook class, not the streamed Reader and Writer.</p></li></ul> |
| 0.4.3   | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/294">Support error references in cell ranges #294</a>. Thanks to <a href="https://github.com/holm">holm</a> for the contribution.</li></ul> |
| 0.4.4   | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/297">Issue with copied cells #297</a>. This merge adds support for shared formulas. Thanks to <a href="https://github.com/muscapades">muscapades</a> for the contribution.</li></ul> |
| 0.4.6   | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/304">Correct spelling #304</a>. Thanks to <a href="https://github.com/toanalien">toanalien</a> for the contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/304">Added support for auto filters #306</a>. This adds <a href="#auto-filters">Auto Filters</a> to the Worksheet. Thanks to <a href="https://github.com/C4rmond4i">C4rmond4i</a> for the contribution.</li><li>Restored NodeJS 4.0.0 compatability by removing the destructuring code. My apologies for any inconvenience.</li></ul> |
| 0.4.9   | <ul><li>Switching to transpiled code for distribution. This will ensure compatability with 4.0.0 and above from here on. And it will also allow use of much more expressive JS code in the lib folder!</li><li><a href="#images">Basic Image Support!</a>Images can now be added to worksheets either as a tiled background or stretched over a range. Note: other features like rotation, etc. are not supported yet and will reqeuire further work.</li></ul> |
| 0.4.10  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/319">Add missing Office Rels #319</a>. Thanks goes to <a href="https://github.com/mauriciovillalobos">mauriciovillalobos</a> for the contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/320">Add printTitlesRow Support #320</a> Thanks goes to <a href="https://github.com/psellers89">psellers89</a> for the contribution.</li></ul> |
| 0.4.11  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/327">Avoid error on anchor with no media #327</a>. Thanks goes to <a href="https://github.com/holm">holm</a> for the contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/332">Assortment of fixes for streaming read #332</a>. Thanks goes to <a href="https://github.com/holm">holm</a> for the contribution.</li></ul> |
| 0.4.12  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/334">Don’t set address if hyperlink r:id is undefined #334</a>. Thanks goes to <a href="https://github.com/holm">holm</a> for the contribution.</li></ul> |
| 0.4.13  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/343">Issue 296 #343</a>. This fixes <a href="https://github.com/exceljs/exceljs/issues/296">Issue with writing newlines #296</a>. Thanks goes to <a href="https://github.com/holly-weisser">holly-weisser</a> for the contribution.</li></ul> |
| 0.4.14  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/350">Syntax highlighting added ✨ #350</a>. Thanks goes to <a href="https://github.com/rmariuzzo">rmariuzzo</a> for the contribution.</li></ul> |
| 0.5.0   | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/356">Fix right to left issues #356</a>. Fixes <a href="https://github.com/exceljs/exceljs/issues/72">Add option to RTL file #72</a> and <a href="https://github.com/exceljs/exceljs/issues/126">Adding an option to set RTL worksheet #126</a>. Big thank you to <a href="https://github.com/alitaheri">alitaheri</a> for this contribution.</li></ul> |
| 0.5.1   | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/364">Fix #345 TypeError: Cannot read property 'date1904' of undefined #364</a>. This fixes <a href="https://github.com/exceljs/exceljs/issues/345">TypeError: Cannot read property 'date1904' of undefined #345</a>. Thanks to <a href="https://github.com/Diluka">Diluka</a> for this contribution.</li></ul>
| 0.6.0   | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/389">Add rowBreaks feature. #389</a>. Thanks to <a href="https://github.com/brucejo75">brucejo75</a> for this contribution.</li></ul> |
| 0.6.1   | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/403">Guard null model fields - fix and tests #403</a>. Thanks to <a href="https://github.com/shdd-cjharries">thecjharries</a> for this contribution. Also thanks to <a href="https://github.com/Rycochet">Ryc O'Chet</a> for help with reviewing.</li></ul> |
| 0.6.2   | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/396">Add some comments in readme according csv importing #396</a>. Thanks to <a href="https://github.com/Imperat">Michael Lelyakin</a> for this contribution. Also thanks to <a href="https://github.com/planemar">planemar</a> for help with reviewing. This also closes <a href="https://github.com/exceljs/exceljs/issues/395">csv to stream doesn't work #395</a>.</li></ul> |
| 0.7.0   | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/407">Impl &lt;xdr:twoCellAnchor editAs=oneCell&gt; #407</a>. Thanks to <a href="https://github.com/Ockejanssen">Ocke Janssen</a> and <a href="https://github.com/kay-ramme">Kay Ramme</a> for this contribution. This change allows control on how images are anchored to cells.</li></ul> |
| 0.7.1   | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/423">Don't break when attempting to import a zip file that's not an Excel file (eg. .numbers) #423</a>. Thanks to <a href="https://github.com/papandreou">Andreas Lind</a> for this contribution. This change makes exceljs more reslilient when opening non-excel files.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/434">Fixes #419 : Updates readme. #434</a>. Thanks to <a href="https://github.com/getsomecoke">Vishnu Kyatannawar</a> for this contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/436">Don't break when docProps/core.xml contains a &lt;cp:version&gt; tag #436</a>. Thanks to <a href="https://github.com/papandreou">Andreas Lind</a> for this contribution. This change handles core.xml files with empty version tags.</li></ul>
| 0.8.0   | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/442">Add Base64 Image support for the .addImage() method #442</a>. Thanks to <a href="https://github.com/jwmann">James W Mann</a> for this contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/453">update moment to 2.19.3 #453</a>. Thanks to <a href="https://github.com/cooltoast">Markan Patel</a> for this contribution.</li></ul> |
| 0.8.1   | <ul><li> Merged <a href="https://github.com/exceljs/exceljs/pull/457">Additional information about font family property #457</a>. Thanks to <a href="https://github.com/kayakyakr">kayakyakr</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/459">Fixes #458 #459</a>. This fixes <a href="https://github.com/exceljs/exceljs/issues/458">Add style to column causes it to be hidden #458</a>. Thanks to <a href="https://github.com/AJamesPhillips">Alexander James Phillips</a> for this contribution. </li> </ul> |
| 0.8.2   | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/466">Don't break when loading an Excel file containing a chartsheet #466</a>. Thanks to <a href="https://github.com/papandreou">Andreas Lind</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/471">Hotfix/sheet order#257 #471</a>. This fixes <a href="https://github.com/exceljs/exceljs/issues/257">Sheet Order #257</a>. Thanks to <a href="https://github.com/robbi">Robbi</a> for this contribution. </li> </ul> |
| 0.8.3   | <ul> <li> Assimilated <a href="https://github.com/exceljs/exceljs/pull/463">fix #79 outdated dependencies in unzip2</a>. Thanks to <a href="https://github.com/jsamr">Jules Sam. Randolph</a> for starting this fix and a really big thanks to <a href="https://github.com/kachkaev">Alexander Kachkaev</a> for finding the final solution. </li> </ul> |
| 0.8.4   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/479">Round Excel date to nearest millisecond when converting to javascript date #479</a>. Thanks to <a href="https://github.com/bjet007">Benoit Jean</a> for this contribution. </li> </ul> |
| 0.8.5   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/485">Bug fix: wb.worksheets/wb.eachSheet caused getWorksheet(0) to return sheet #485</a>. Thanks to <a href="https://github.com/mah110020">mah110020</a> for this contribution. </li> </ul> |
| 0.9.0   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/489">Feature/issue 424 #489</a>. This fixes <a href="https://github.com/exceljs/exceljs/issues/424">No way to control summaryBelow or summaryRight #424</a>. Many thanks to <a href="https://github.com/sarahdmsi">Sarah</a> for this contribution. </li> </ul>  |
| 0.9.1   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/490">add type definition #490</a>. This adds type definitions to ExcelJS! Many thanks to <a href="https://github.com/taoqf">taoqf</a> for this contribution. </li> </ul> |
| 1.0.0   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/494">Add Node 8 and Node 9 to continuous integration testing #494</a>. Many thanks to <a href="https://github.com/cooltoast">Markan Patel</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/508">Small README fix #508</a>. Many thanks to <a href="https://github.com/lbguilherme">Guilherme Bernal</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/501">Add support for inlineStr, including rich text #501</a>. Many thanks to <a href="https://github.com/linguamatics-pdenes">linguamatics-pdenes</a> and <a href="https://github.com/robscotts4rb">Rob Scott</a> for their efforts towards this contribution. Since this change is technically a breaking change (the rendered XML for inline strings will change) I'm making this a major release! </li> </ul> |
| 1.0.1   | <ul> <li> Fixed <a href="https://github.com/exceljs/exceljs/issues/520">spliceColumns problem when the number of columns are important #520</a>. </li> </ul> |
| 1.0.2   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/524">Loosen exceljs's dependency requirements for moment #524</a>. Many thanks to <a href="https://github.com/nicoladefranceschi">nicoladefranceschi</a> for this contribution. This change addresses <a href="https://github.com/exceljs/exceljs/issues/517">Ability to use external "moment" package #517</a>. </li> </ul> |
| 1.1.0   | <ul> <li> Addressed <a href="https://github.com/exceljs/exceljs/issues/514">Is there a way inserting values in columns. #514</a>. Added a new getter/setter property to Column to get and set column values (see <a href="#columns">Columns</a> for details). </li> </ul> |
| 1.1.1   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/532">Include index.d.ts in published packages #532</a>. To fix <a href="https://github.com/exceljs/exceljs/issues/525">TypeScript definitions missing from npm package #525</a>. Many thanks to <a href="https://github.com/saschanaz">Kagami Sascha Rosylight</a> for this contribution. </li> </ul> |
| 1.1.2   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/536">Don't break when docProps/core.xml contains <cp:contentType /> #536</a>. Many thanks to <a href="https://github.com/papandreou">Andreas Lind</a> (and reviewers) for this contribution. </li> </ul> |
| 1.1.3   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/537">Try to handle the case where a &lt;c&gt; element is missing an r attribute #537</a>. Many thanks to <a href="https://github.com/papandreou">Andreas Lind</a> for this contribution. </li> </ul> |
| 1.2.0   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/544">Add dateUTC flag to CSV Writing #544</a>. Many thanks to <a href="https://github.com/zgriesinger">Zackery Griesinger</a> for this contribution. </li> </ul> |
| 1.2.1   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/547">worksheet name is writable #547</a>. Many thanks to <a href="https://github.com/f111fei">xzper</a> for this contribution. </li> </ul> |
| 1.3.0   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/549">Add CSV write buffer support #549</a>. Many thanks to <a href="https://github.com/jloveridge">Jarom Loveridge</a> for this contribution. </li> </ul> |
| 1.4.2   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/541">Discussion: Customizable row/cell limit #541</a>. Many thanks to <a href="https://github.com/papandreou">Andreas Lind</a> for this contribution. </li> </ul> |
| 1.4.3   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/552">Get the right text out of hyperlinked formula cells #552</a>. Many thanks to <a href="https://github.com/papandreou">Andreas Lind</a> and <a href="https://github.com/holm">Christian Holm</a> for this contribution. </li> </ul> |
| 1.4.5   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/556">Add test case with a huge file #556</a>. Many thanks to <a href="https://github.com/papandreou">Andreas Lind</a> and <a href="https://github.com/holm">Christian Holm</a> for this contribution. </li> </ul> |
| 1.4.6   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/557">Update README.md to reflect correct functionality of row.addPageBreak() #557</a>. Many thanks to <a href="https://github.com/raj7desai">RajDesai</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/558">fix index.d.ts #558</a>. Many thanks to <a href="https://github.com/Diluka">Diluka</a> for this contribution. </li> </ul> |
| 1.4.7   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/562">List /xl/sharedStrings.xml in [Content_Types].xml only if one of the … #562</a>. Many thanks to <a href="https://github.com/priidikvaikla">Priidik Vaikla</a> for this contribution. </li> </ul> |
| 1.4.8   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/562">List /xl/sharedStrings.xml in [Content_Types].xml only if one of the … #562</a>. Many thanks to <a href="https://github.com/priidikvaikla">Priidik Vaikla</a> for this contribution. </li> <li> Fixed issue with above where shared strings were used but the content type was not added. </li> </ul> |
| 1.4.9   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/562">List /xl/sharedStrings.xml in [Content_Types].xml only if one of the … #562</a>. Many thanks to <a href="https://github.com/priidikvaikla">Priidik Vaikla</a> for this contribution. </li> <li> Fixed issue with above where shared strings were used but the content type was not added. </li> <li> Fixed issue <a href="https://github.com/exceljs/exceljs/issues/581">1.4.8 broke writing Excel files with useSharedStrings:true #581</a>. </li> </ul> |
| 1.4.10  | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/564">core-xform: Tolerate a missing cp: namespace for the coreProperties element #564</a>. Many thanks to <a href="https://github.com/papandreou">Andreas Lind</a> for this contribution. </li> </ul> |
| 1.4.12  | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/567">Avoid error on malformed address #567</a>. Many thanks to <a href="https://github.com/papandreou">Andreas Lind</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/571">Added a missing Promise&lt;void&gt; in index.d.ts #571</a>. Many thanks to <a href="https://github.com/carboneater">Gabriel Fournier</a> for this contribution. This release should fix <a href="https://github.com/exceljs/exceljs/issues/548">Is workbook.commit() still a promise or not #548</a> </li> </ul> |
| 1.4.13  | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/574">Issue #488 #574</a>. Many thanks to <a href="https://github.com/dljenkins">dljenkins</a> for this contribution. This release should fix <a href="https://github.com/exceljs/exceljs/issues/488">Invalid time value Exception #488</a>. </li> </ul> |
| 1.5.0   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/577">Sheet add state for hidden or show #577</a>. Many thanks to <a href="https://github.com/Hsinfu">Freddie Hsinfu Huang</a> for this contribution. This release should fix <a href="https://github.com/exceljs/exceljs/issues/226">hide worksheet and reorder sheets #226</a>. </li> </ul> |
| 1.5.1   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/582">Update index.d.ts #582</a>. Many thanks to <a href="https://github.com/hankolsen">hankolsen</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/584">Decode the _x<4 hex chars>_ escape notation in shared strings #584</a>. Many thanks to <a href="https://github.com/papandreou">Andreas Lind</a> for this contribution. </li> </ul> |
| 1.6.0   | <ul> <li> Added .html property to Cells to facilitate html-safe rendering. See <a href="#handling-individual-cells">Handling Individual Cells</a> for details. </li> </ul> |
| 1.6.1   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/587">Fix Issue #488 where dt is an invalid date format. #587</a> to fix  <a href="https://github.com/exceljs/exceljs/issues/488">Invalid time value Exception #488</a>. Many thanks to <a href="https://github.com/ilijaz">Iliya Zubakin</a> for this contribution. </li> </ul> |
| 1.6.2   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/587">Fix Issue #488 where dt is an invalid date format. #587</a> to fix  <a href="https://github.com/exceljs/exceljs/issues/488">Invalid time value Exception #488</a>. Many thanks to <a href="https://github.com/ilijaz">Iliya Zubakin</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/590">drawing element must be below rowBreaks according to spec or corrupt worksheet #590</a> Many thanks to <a href="https://github.com/nevace">Liam Neville</a> for this contribution. </li> </ul> |
| 1.6.3   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/595">set type optional #595</a> Many thanks to <a href="https://github.com/taoqf">taoqf</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/578">Fix some xlsx stream read xlsx not in guaranteed order problem #578</a> Many thanks to <a href="https://github.com/KMethod">KMethod</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/599">Fix formatting issue in README #599</a> Many thanks to <a href="https://github.com/getsomecoke">Vishnu Kyatannawar</a> for this contribution. </li> </ul> |
| 1.7.0   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/602">Ability to set tooltip for hyperlink #602</a> Many thanks to <a href="https://github.com/kalexey89">Kuznetsov Aleksey</a> for this contribution. </li> </ul> |
| 1.8.0   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/636">Fix misinterpreted ranges from &lt;definedName&gt; #636</a> Many thanks to <a href="https://github.com/papandreou">Andreas Lind</a> for this contribution. </li> </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/640">Add LGTM code quality badges #640</a> Many thanks to <a href="https://github.com/xcorail">Xavier RENE-CORAIL</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/646">Add type definition for Column.values #646</a> Many thanks to <a href="https://github.com/emlai">Emil Laine</a> for this contribution. This fixes <a href="https://github.com/exceljs/exceljs/issues/645">Column.values is missing TypeScript definitions #645</a>. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/663">Update README.md with load() option #663</a> Many thanks to <a href="https://github.com/thinksentient">Joanna Walker</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/677">fixed packages according to npm audit #677</a> Many thanks to <a href="https://github.com/misleadingTitle">Manuel Minuti</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/699">Update index.d.ts #699</a> Many thanks to <a href="https://github.com/rayyen">Ray Yen</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/708">Replaced node-unzip-2 to unzipper package which is more robust #708</a> Many thanks to <a href="https://github.com/johnmalkovich100">johnmalkovich100</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/728">Read worksheet hidden state #728</a> Many thanks to <a href="https://github.com/LesterLyu">Dishu(Lester) Lyu</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/736">add Worksheet.state typescript definition fix #714 #736</a> Many thanks to <a href="https://github.com/ilyes-kechidi">Ilyes Kechidi</a> for this contribution. This fixes <a href="https://github.com/exceljs/exceljs/issues/714">Worksheet State does not exist in index.d.ts #714</a>. </li> </ul> |
| 1.9.0   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/702">Improvements for images (correct reading/writing possitions) #702</a>. This fixes <a href="https://github.com/exceljs/exceljs/issues/650">Image location don't respect Column width #650</a> and <a href="https://github.com/exceljs/exceljs/issues/467">Image position - stretching image #467</a>. Many thanks to <a href="https://github.com/Siemienik">Siemienik Paweł</a> for this contribution. </li> </li> </ul> |
| 1.9.1   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/619">Add Typescript support for formulas without results #619</a>. Many thanks to <a href="https://github.com/Wolfchin">Loursin</a> for this contribution. </li> </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/737">Fix existing row styles when using spliceRows #737</a>. Many thanks to <a href="https://github.com/cxam">cxam</a> for this contribution. </li> </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/774">Consistent code quality #774</a>. Many thanks to <a href="https://github.com/alubbe">Andreas Lubbe</a> for this contribution. </li> </li> </ul> |
| 1.10.0  | <ul> <li> Fixed effect of splicing rows and columns on defined names </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/746">Add support for adding images anchored to one cell #746</a>. Many thanks to <a href="https://github.com/karlvr">Karl von Randow</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/758">Add vertical align property #758</a>. Many thanks to <a href="https://github.com/MikeZyatkov">MikeZyatkov</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/775">Replace the temp lib to tmp #775</a>. Many thanks to <a href="https://github.com/coldhiber">Ivan Sotnikov</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/780">Replace the temp lib to tmp #775</a>. Many thanks to <a href="https://github.com/alubbe">Andreas Lubbe</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/793">Update Worksheet.dimensions return type #793</a>. Many thanks to <a href="https://github.com/Siemienik">Siemienik Paweł</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/795">One more types fix #795</a>. Many thanks to <a href="https://github.com/Siemienik">Siemienik Paweł</a> for this contribution. </li> </ul> |
| 1.11.0  | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/776">Add the ability to bail out of parsing if the number of columns exceeds a given limit #776</a>. Many thanks to <a href="https://github.com/papandreou">Andreas Lind</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/799">Add support for repeated columns on every page when printing. #799</a>. Many thanks to <a href="https://github.com/FreakenK">Jasmin Auger</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/815">Do not use a promise polyfill on modern setups #815</a>. Many thanks to <a href="https://github.com/alubbe">Andreas Lubbe</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/807">copy LICENSE to the dist folder #807</a>. Many thanks to <a href="https://github.com/zypA13510">Yuping Zuo</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/813">Avoid unhandled rejection on XML parse error #813</a>. Many thanks to <a href="https://github.com/papandreou">Andreas Lind</a> for this contribution. </li> </ul> |
| 1.12.0  | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/819">(chore) increment unzipper to 0.9.12 to address npm advisory 886 #819</a>. Many thanks to <a href="https://github.com/kreig303">Kreig Zimmerman</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/817">docs(README): improve docs #817</a>. Many thanks to <a href="https://github.com/zypA13510">Yuping Zuo</a> for this contribution. </li> <li> <p> Merged <a href="https://github.com/exceljs/exceljs/pull/823">add comment support #529 #823</a>. Many thanks to <a href="https://github.com/ilimei">ilimei</a> for this contribution. </p> <p>This fixes the following issues:</p> <ul> <li><a href="https://github.com/exceljs/exceljs/issues/202">Is it possible to add comment on a cell? #202</a></li> <li><a href="https://github.com/exceljs/exceljs/issues/451">Add comment to cell #451</a></li> <li><a href="https://github.com/exceljs/exceljs/issues/503">Excel add comment on cell #503</a></li> <li><a href="https://github.com/exceljs/exceljs/issues/529">How to add Cell comment #529</a></li> <li><a href="https://github.com/exceljs/exceljs/issues/707">Please add example to how I can insert comments for a cell #707</a></li> </ul> </li> </ul> |
| 1.12.1  | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/822">fix issue with print area defined name corrupting file #822</a>. Many thanks to <a href="https://github.com/donaldsonjulia">Julia Donaldson</a> for this contribution. This fixes issue <a href="https://github.com/exceljs/exceljs/issues/664">Defined Names Break/Corrupt Excel File into Repair Mode #664</a>. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/831">Only keep at most 31 characters for sheetname #831</a>. Many thanks to <a href="https://github.com/kaleo211">Xuebin He</a> for this contribution. This fixes issue <a href="https://github.com/exceljs/exceljs/issues/398">Limit worksheet name length to 31 characters #398</a>. </li> </ul> |
| 1.12.2  | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/834">add cn doc #834</a> and <a href="https://github.com/exceljs/exceljs/pull/852">update cn doc #852</a>. Many thanks to <a href="https://github.com/loverto">flydragon</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/853">fix minor spelling mistake in readme #853</a>. Many thanks to <a href="https://github.com/ridespirals">John Varga</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/855">Fix defaultRowHeight not working #855</a>. Many thanks to <a href="https://github.com/autukill">autukill</a> for this contribution. This should fix <a href="https://github.com/exceljs/exceljs/issues/422">row height doesn't apply to row #422</a>, <a href="https://github.com/exceljs/exceljs/issues/634">The worksheet.properties.defaultRowHeight can't work!! How to set the rows height, help!! #634</a> and <a href="https://github.com/exceljs/exceljs/issues/696">Default row height doesn't work ? #696</a>. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/854">Always keep first font #854</a>. Many thanks to <a href="https://github.com/dogusev">Dmitriy Gusev</a> for this contribution. This should fix <a href="https://github.com/exceljs/exceljs/issues/816">document scale (width only) is different after read & write #816</a>, <a href="https://github.com/exceljs/exceljs/issues/833">Default font from source document can not be parsed. #833</a> and <a href="https://github.com/exceljs/exceljs/issues/849">Wrong base font: hardcoded Calibri instead of font from the document #849</a>. </li> </ul> |
| 1.13.0  | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/862">zip: allow tuning compression for performance or size #862</a>. Many thanks to <a href="https://github.com/myfreeer">myfreeer</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/863">Feat configure headers and footers #863</a>. Many thanks to <a href="https://github.com/autukill">autukill</a> for this contribution. </li> <li> Fixed an issue with defaultRowHeight where the default value resulted in 'customHeight' property being set. </li> </ul> |
| 1.14.0  | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/874">Fix header and footer text format error in README.md #874</a>. Many thanks to <a href="https://github.com/autukill">autukill</a> for this contribution. </li> <li> Added Tables. See <a href="#tables">Tables</a> for details. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/887">fix: #877 and #880</a>. Many thanks to <a href="https://github.com/aexei">Alexander Heinrich</a> for this contribution. This fixes <a href="https://github.com/exceljs/exceljs/pull/877">bug: Hyperlink without text crashes write #877</a> and <a href="https://github.com/exceljs/exceljs/pull/880">bug: malformed comment crashes on write #880</a> </li> </ul> |
| 1.15.0  | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/889">Add Compression level option to WorkbookWriterOptions for streaming #889</a>. Many thanks to <a href="https://github.com/ABenassi87">Alfredo Benassi</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/903">Feature/Cell Protection #903</a> and <a href="https://github.com/exceljs/exceljs/pull/907">Feature/Sheet Protection #907</a>. Many thanks to <a href="https://github.com/karabaesh">karabaesh</a> for these contributions. </li> </ul> |
| 2.0.1   | <h2>Major Version Change</h2> <p>Introducing async/await to ExcelJS!</p> <p>The new async and await features of JavaScript can help a lot to make code more readable and maintainable. To avoid confusion, particularly with returned promises from async functions, we have had to remove the Promise class configuration option and from v2 onwards ExcelJS will use native Promises. Since this is potentially a breaking change we're bumping the major version for this release.</p> <h2>Changes</h2> <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/829">Introduce async/await #829</a>. Many thanks to <a href="https://github.com/alubbe">Andreas Lubbe</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/930">Update index.d.ts #930</a>. Many thanks to <a href="https://github.com/cosmonovallc">cosmonovallc</a> for this contributions. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/940">TS: Add types for addTable function #940</a>. Many thanks to <a href="https://github.com/egmen">egmen</a> for this contributions. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/926">added explicit return types to the type definitions of Worksheet.protect() and Worksheet.unprotect() #926</a>. Many thanks to <a href="https://github.com/drjokepu">Tamas Czinege</a> for this contributions. </li> <li> Dropped dependencies on Promise libraries. </li> </ul> |
| 3.0.0   | <h2>Another Major Version Change</h2> <p>Javascript has changed a lot over the years, and so have the modules and technologies surrounding it. To this end, this major version of ExcelJS changes the structure of the publish artefacts:</p> <h3>Main Export is now the Original Javascript Source</h3> <p>Prior to this release, the transpiled ES5 code was exported as the package main. From now on, the package main comes directly from the lib/ folder. This means a number of dependencies have been removed, including the polyfills.</p> <h3>ES5 and Browserify are Still Included</h3> <p>In order to support those that still require ES5 ready code (e.g. as dependencies in web apps) the source code will still be transpiled and available  in dist/es5.</p> <p>The ES5 code is also browserified and available as dist/exceljs.js or dist/exceljs.min.js</p> <p><i>See the section <a href="#importing">Importing</a> for details</i></p> |
| 3.1.0   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/873">Uprev fast-csv to latest version which does not use unsafe eval #873</a>. Many thanks to <a href="https://github.com/miketownsend">Mike Townsend</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/906">Exclude Infinity on createInputStream #906</a>. Many thanks to <a href="https://github.com/sophiedophie">Sophie Kwon</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/911">Feature/Add comments/notes to stream writer #911</a>. Many thanks to <a href="https://github.com/brunoargolo">brunoargolo</a> for this contribution. This fixes <a href="https://github.com/exceljs/exceljs/issues/868">Can't add cell comment using streaming WorkbookWriter #868</a> </li> <li> Fixed an issue with reading .xlsx files containing notes. This should resolve the following issues: <ul> <li><a href="https://github.com/exceljs/exceljs/issues/941">Reading comment/note from xlsx #941</a></li> <li><a href="https://github.com/exceljs/exceljs/issues/944">Excel.js doesn't parse comments/notes. #944</a></li> </ul> </li> </ul> |
| 3.2.0   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/923">Add document for zip options of streaming WorkbookWriter #923</a>. Many thanks to <a href="https://github.com/piglovesyou">Soichi Takamura</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/933">array formula #933</a>. Many thanks to <a href="https://github.com/yoann-antoviaque">yoann-antoviaque</a> for this contribution. This fixes <a href="https://github.com/exceljs/exceljs/issues/932">broken array formula #932</a> and adds <a href="#array-formula">Array Formulae</a> to ExcelJS. </li> </ul> |
| 3.3.0   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/892">Fix anchor.js #892</a>. Many thanks to <a href="https://github.com/wwojtkowski">Wojciech Wojtkowski</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/896">add xml:space="preserve" for all whitespaces #896</a>. Many thanks to <a href="https://github.com/sebikeller">Sebastian Keller</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/959">Add `shrinkToFit` to document and typing #959</a>. Many thanks to <a href="https://github.com/mozisan">('3')</a> for this contribution. This fixes <a href="https://github.com/exceljs/exceljs/issues/943">shrinkToFit property not on documentation #943</a>. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/980">#951: Force formula re-calculation on file open from Excel #980</a>. Many thanks to <a href="https://github.com/zymon">zymon</a> for this contribution. This fixes <a href="https://github.com/exceljs/exceljs/issues/951">Force formula re-calculation on file open from Excel #951</a>. </li> <li> Fixed <a href="https://github.com/exceljs/exceljs/issues/989">Lib contains class syntax, not compatible with IE11 #989</a>. </li> </ul> |
| 3.3.1   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1000">Add headerFooter to worksheet model when importing from file #1000</a>. Many thanks to <a href="https://github.com/kigh-ota">Kaiichiro Ota</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1005">Update eslint plugins and configs #1005</a>, <a href="https://github.com/exceljs/exceljs/pull/1006">Drop grunt-lib-phantomjs #1006</a> and <a href="https://github.com/exceljs/exceljs/pull/1007">Rename .browserslintrc.txt to .browserslistrc #1007</a>. Many thanks to <a href="https://github.com/takenspc">Takeshi Kurosawa</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1012">Fix issue #988 #1012</a>. This fixes <a href="https://github.com/exceljs/exceljs/issues/988">Can not read excel file #988</a>. Many thanks to <a href="https://github.com/thambley">Todd Hambley</a> for this contribution. </li> </ul> |
| 3.4.0   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1016">Feature/stream writer add background images #1016</a>. Many thanks to <a href="https://github.com/brunoargolo">brunoargolo</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1019">Fix issue # 991 #1019</a>. This fixes <a href="https://github.com/exceljs/exceljs/issues/991">read csv file issue #991</a>. Many thanks to <a href="https://github.com/LibertyNJ">Nathaniel J. Liberty</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1018">Large excels - optimize performance of writing file by excelJS + optimize generated file (MS excel opens it much faster) #1018</a>. Many thanks to <a href="https://github.com/pzawadzki82">Piotr</a> for this contribution. </li> </ul> |
| 3.5.0   | <ul> <li> <a href="#conditional-formatting">Conditional Formatting</a> A subset of Excel Conditional formatting has been implemented! Specifically the formatting rules that do not require XML to be rendered inside an &lt;extLst&gt; node, or in other words everything except databar and three icon sets (3Triangles, 3Stars, 5Boxes). These will be implemented in due course </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1030">remove core-js/ import #1030</a>. Many thanks to <a href="https://github.com/bleuscyther">jeffrey n. carre</a> for this contribution. This change is used to create a new browserified bundle artefact that does not include any polyfills. See <a href="#browserify">Browserify</a> for details. </li> </ul> |
| 3.6.0   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1042">1041 multiple print areas #1042</a>. Many thanks to <a href="https://github.com/AlexanderPruss">Alexander Pruss</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1058">fix typings for cell.note #1058</a>. Many thanks to <a href="https://github.com/xydens">xydens</a> for this contribution. </li> <li> <a href="#conditional-formatting">Conditional Formatting</a> has been completed. The &lt;extLst&gt; conditional formattings including dataBar and the three iconSet types (3Triangles, 3Stars, 5Boxes) are now available. </li> </ul> |
| 3.6.1   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1047">Clarify merging cells by row/column numbers #1047</a>. Many thanks to <a href="https://github.com/kendallroth">Kendall Roth</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1048">Fix README mistakes concerning freezing views #1048</a>. Many thanks to <a href="https://github.com/overlookmotel">overlookmotel</a> for this contribution. </li> <li> Merged: <ul> <li><a href="https://github.com/exceljs/exceljs/pull/1073">fix issue #1045 horizontalCentered & verticalCentered in page not working #1073</a></li> <li><a href="https://github.com/exceljs/exceljs/pull/1082">Fix the problem of anchor failure of readme_zh.md file #1082</a></li> <li><a href="https://github.com/exceljs/exceljs/pull/1065">Fix problems caused by case of worksheet names #1065</a></li> </ul> Many thanks to <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. </li> </ul> |
| 3.7.0   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1076">Fix Issue #1075: Unable to read/write defaultColWidth attribute in &lt;sheetFormatPr&gt; node #1076</a>. Many thanks to <a href="https://github.com/kigh-ota">Kaiichiro Ota</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1078">function duplicateRows added #1078</a> and <a href="https://github.com/exceljs/exceljs/pull/1088">Duplicate rows #1088</a>. Many thanks to <a href="https://github.com/cbeltrangomez84">cbeltrangomez84</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1087">Prevent from unhandled promise rejection durning workbook load #1087</a>. Many thanks to <a href="https://github.com/sohai">Wojtek</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1071">fix issue #899 Support for inserting pictures with hyperlinks #1071</a>. Many thanks to <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1089">Update TS definition to reference proper internal libraries #1089</a>. Many thanks to <a href="https://github.com/jakawell">Jesse Kawell</a> for this contribution. </li> </ul> |
| 3.8.0   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1090">Issue/Corrupt workbook using stream writer with background image #1090</a>. Many thanks to <a href="https://github.com/brunoargolo">brunoargolo</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1092">Fix index.d.ts #1092</a>. Many thanks to <a href="https://github.com/Siemienik">Siemienik Paweł</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1093">Wait for writing to tmp fiels before handling zip stream close #1093</a>. Many thanks to <a href="https://github.com/sohai">Wojtek</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1095">Support ArrayBuffer as an xlsx.load argument #1095</a>. Many thanks to <a href="https://github.com/sohai">Wojtek</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1099">Export shared strings with RichText #1099</a>. Many thanks to <a href="https://github.com/kigh-ota">Kaiichiro Ota</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1102">Keep borders of merged cells after rewriting an Excel workbook #1102</a>. Many thanks to <a href="https://github.com/kigh-ota">Kaiichiro Ota</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1104">Fix #1103: `editAs` not working #1104</a>. Many thanks to <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1105">Fix to issue #1101 #1105</a>. Many thanks to <a href="https://github.com/cbeltrangomez84">Carlos Andres Beltran Gomez</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1107">fix some errors and typos in readme #1107</a>. Many thanks to <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1112">Update issue templates #1112</a>. Many thanks to <a href="https://github.com/Siemienik">Siemienik Paweł</a> for this contribution. </li> </ul> |
| 3.8.1   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1112">Update issue templates #1112</a>. Many thanks to <a href="https://github.com/Siemienik">Siemienik Paweł</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1124">Typo: Replace 'allways' with 'always' #1124</a>. Many thanks to <a href="https://github.com/Siemienik">Siemienik Paweł</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1125">Replace uglify with terser #1125</a>. Many thanks to <a href="https://github.com/alubbe">Andreas Lubbe</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1126">Apply codestyles on each commit and run lint:fix #1126</a>. Many thanks to <a href="https://github.com/alubbe">Andreas Lubbe</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1127">[WIP] Replace sax with saxes #1127</a>. Many thanks to <a href="https://github.com/alubbe">Andreas Lubbe</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1128">Add PR, Feature Request and Question github templates #1128</a>. Many thanks to <a href="https://github.com/alubbe">Andreas Lubbe</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1137">fix issue #749 Fix internal link example errors in readme #1137</a>. Many thanks to <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. </li> </ul> |
| 3.8.2   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1133">Update @types/node version to latest lts #1133</a>. Many thanks to <a href="https://github.com/Siemienik">Siemienik Paweł</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1134">fix issue #1118 Adding Data Validation and Conditional Formatting to the same sheet causes corrupt workbook #1134</a>. Many thanks to <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1139">Add benchmarking #1139</a>. Many thanks to <a href="https://github.com/alubbe">Andreas Lubbe</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1148">fix issue #731 image extensions not be case sensitive #1148</a>. Many thanks to <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1169">fix issue #1165 and update index.d.ts #1169</a>. Many thanks to <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. </li> </ul> |
| 3.9.0   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1140">Optimize SAXStream #1140</a>. Many thanks to <a href="https://github.com/alubbe">Andreas Lubbe</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1143">fix issue #1057 Fix addConditionalFormatting is not a function error when using Streaming XLSX Writer #1143</a>. Many thanks to <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1160">fix issue #204 sets default column width #1160</a>. Many thanks to <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1164">Include cell address for Shared Formula master must exist.. error #1164</a>. Many thanks to <a href="https://github.com/noisyscanner">Brad Reed</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1166">Typo in DataValidation examples #1166</a>. Many thanks to <a href="https://github.com/mravey">Matthieu Ravey</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1176">fixes #1175 #1176</a>. Many thanks to <a href="https://github.com/Siemienik">Siemienik Paweł</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1179">fix issue #1178 and update index.d.ts #1179</a>. Many thanks to <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1182">Simple test if typescript is able to compile #1182</a>. Many thanks to <a href="https://github.com/Siemienik">Siemienik Paweł</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1190">More improvements #1190</a>. Many thanks to <a href="https://github.com/alubbe">Andreas Lubbe</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1193">Ensure all node_modules are compatible with IE11 #1193</a>. Many thanks to <a href="https://github.com/alubbe">Andreas Lubbe</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1199">fix issue #1194 and update index.d.ts #1199</a>. Many thanks to <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. This fixes <a href="https://github.com/exceljs/exceljs/issues/1194">[BUG] TypeScript version doesn't have definition for Worksheet.addConditionalFormatting #1194</a>. </li> Merged <a href="https://github.com/exceljs/exceljs/pull/1204">fix issue #1157 marked Cannot set property #1204</a>. Many thanks to <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. This fixes <a href="https://github.com/exceljs/exceljs/issues/1157">[BUG] Cannot set property 'marked' of undefined #1157</a>. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1209">Deprecate createInputStream #1209</a>. Many thanks to <a href="https://github.com/alubbe">Andreas Lubbe</a> for this contribution. </li> </li> Merged <a href="https://github.com/exceljs/exceljs/pull/1204">fix issue #1206 #1205 Abnormality of and attributes #1210</a>. Many thanks to <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. This fixes <a href="https://github.com/exceljs/exceljs/issues/1205">[BUG] Unlocked cells do not maintain their unlocked status after reading and writing a workbook. #1205</a> and <a href="https://github.com/exceljs/exceljs/issues/1206">[BUG] Unlocked cells lose their vertical and horizontal alignment after a read and write. #1206</a>. </li> </ul> |
| 3.10.0  | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1233">[Chore] Upgrade dependencies #1233</a>. Many thanks to <a href="https://github.com/alubbe">Andreas Lubbe</a> for this contribution. </li> </li> Merged <a href="https://github.com/exceljs/exceljs/pull/1220">Fix issue #1198 Absolute path and relative path need to be compatible #1220</a>. Many thanks to <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. This fixes <a href="https://github.com/exceljs/exceljs/issues/1198">[BUG] Loading OpenPyXL workbooks #1198</a>. </li> </li> Merged <a href="https://github.com/exceljs/exceljs/pull/1234">Upgrade tmp #1234</a>. Many thanks to <a href="https://github.com/alubbe">Andreas Lubbe</a> for this contribution. This fixes <a href="https://github.com/exceljs/exceljs/issues/882">Process doesn't exit < 8.12.0 #882</a>. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1270">New version of dayjs requires explicit `Z` in the date formats #1270</a>. Many thanks to <a href="https://github.com/alubbe">Andreas Lubbe</a> for this contribution. </li> </li> Merged <a href="https://github.com/exceljs/exceljs/pull/1280">Fixed #1276 #1280</a>. Many thanks to <a href="https://github.com/Subhajitdas298">Subhajit Das</a> for this contribution. This fixes <a href="https://github.com/exceljs/exceljs/issues/1276">[BUG] Invalid regular expression: /^[ -íŸ¿î€€-ï¿½ð€€-ô¿¿]$/: Range out of order in character class #1276</a>. </li> </li> Merged <a href="https://github.com/exceljs/exceljs/pull/1278">[bugfix] Fix special cell values causing invalid files produced #1278</a>. Many thanks to <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. This fixes <a href="https://github.com/exceljs/exceljs/issues/703">Special cell value results invalid file #703</a>. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1208">Re-translation of simplified Chinese documents (zh-cn) #1208</a>. Many thanks to <a href="https://github.com/wang1212">不如怀念</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1208">data-validations-xform: keep formulae if type not exists #1229</a>. Many thanks to <a href="https://github.com/myfreeer">myfreeer</a> for this contribution. </li> </li> Merged <a href="https://github.com/exceljs/exceljs/pull/1257">WorkbookWriter support rowBreaks #1257</a>. Many thanks to <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. This fixes <a href="https://github.com/exceljs/exceljs/issues/1248">[BUG] WorkbookWriter doesn't support headerFooter and rowBreaks. #1248</a>. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1289">Fixed ascii only #1289</a>. Many thanks to <a href="https://github.com/Subhajitdas298">Subhajit Das</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1159">Supports setting cell comment properties #1159</a>. Many thanks to <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1215">docs: add links to top with jump2header #1215</a>. Many thanks to <a href="https://github.com/strdr4605">Dragoș Străinu</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1310">Fix cell.text return an empty object when cell is empty #1310</a>. Many thanks to <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1303">Use rest args instead of slicing arguments #1303</a>. Many thanks to <a href="https://github.com/alubbe">Andreas Lubbe</a> for this contribution. </li> </ul> |
| 4.0.1   | <ul> <li> A Major Version Change - The main ExcelJS interface has been migrated from streams based API to Async Iterators making for much cleaner code. While technically a breaking change, most of the API is unchanged For details see <a href="https://github.com/exceljs/exceljs/blob/master/UPGRADE-4.0.md">UPGRADE-4.0.md</a>. </li> <li> This upgrade has come from the following merges: <ul> <li><a href="https://github.com/exceljs/exceljs/pull/1135">[MAJOR VERSION] Async iterators #1135</a></li> <li><a href="https://github.com/exceljs/exceljs/pull/1142">[MAJOR VERSION] Move node v8 support to ES5 imports #1142</a></li> </ul> A lot of work from the team went into this - in particular <a href="https://github.com/alubbe">Andreas Lubbe</a> and <a href="https://github.com/Siemienik">Siemienik Paweł</a>. </li> </ul> |
| 4.1.0   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1317">Remove const enum and add ErrorValue in index.d.ts #1317</a> Many thanks to  <a href="https://github.com/aplum">Alex Plumley</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1319">update README.md and READEME_zh.md #1319</a> Many thanks to  <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1324">Added insert rows functionality with new style inherit options #1324</a> Many thanks to  <a href="https://github.com/Subhajitdas298">Subhajit Das</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1327">Updated readme for insert rows #1327</a> Many thanks to  <a href="https://github.com/Subhajitdas298">Subhajit Das</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1338">Fix: Async iterators definition #1338</a> Many thanks to  <a href="https://github.com/JuhBoy">Julien - JuH</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1344">[bugfix] Fix special cell values causing invalid files produced(#1339) #1344</a>. This fixes <a href="https://github.com/exceljs/exceljs/pull/1339">[BUG] hasOwnProperty, constructor special words not serialized correctly with stream.xlsx.WorkbookWriter #1339</a>. Many thanks to  <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1334">Fix the error that comment does not delete at spliceColumn #1334</a>. Many thanks to  <a href="https://github.com/sdg9670">sdg9670</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1328">bug fix can not read property date1904 of undefined #1328</a>. Many thanks to  <a href="https://github.com/1328">1328</a> for this contribution. </li> </ul> |
| 4.1.1   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1356">update index.d.ts #1356</a> Many thanks to <a href="https://github.com/Siemienik">Siemienik Paweł</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1358">Fix styleOption error in index.ts #1358</a>. This fixes <a href="https://github.com/exceljs/exceljs/issues/1357">[BUG] 4.1.0 causes TypeScript compilation errors - addRows styleOption should be optional? #1357</a>. Many thanks to  <a href="https://github.com/sdg9670">sdg9670</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1354">Improved documentation #1354</a> Many thanks to <a href="https://github.com/Subhajitdas298">Subhajit Das</a> for this contribution. </li> </ul> |
| 4.2.0   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1432">Fix issue #1431 Streaming WorkbookReader _parseSharedStrings doesn't handle rich text within shared string nodes #1432</a>. Many thanks to <a href="https://github.com/rheidari">Reza Heidari</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1442">Change typing for colorScale colour to array of colours #1442</a>. Many thanks to <a href="https://github.com/7coil">Leondro Lio</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1443">AddRow/s and InsertRow/s now returning the newly added rows #1443</a>. Many thanks to <a href="https://github.com/Subhajitdas298">Subhajit Das</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1475">fix docs #1475</a>. Many thanks to <a href="https://github.com/kiba-d">Dmytro Kyba</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1360">[bugfix]Fix Issue #1254 and update index.d.ts #1360</a>. This should fix <a href="https://github.com/exceljs/exceljs/issues/1254">[BUG] getSheetValues() typescript definition is incorrect #1254</a>. Many thanks to <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1262">Fix issue #1261 WorkbookWriter sheet.protect() function doesn't exist #1262</a>. This should fix <a href="https://github.com/exceljs/exceljs/issues/1261">[BUG] WorkbookWriter sheet.protect() function doesn't exist #1261</a>. Many thanks to <a href="https://github.com/rheidari">Reza Heidari</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1405">README: images not supported in streaming mode #1405</a>. Many thanks to <a href="https://github.com/chdh">Christian d'Heureuse</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1477">Run linter with prettier 2 #1477</a>. Many thanks to <a href="https://github.com/alubbe">Andreas Lubbe</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1476">Increase the performance of some xml and html helpers #1476</a>. Many thanks to <a href="https://github.com/alubbe">Andreas Lubbe</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1482">Performance improvement in col-cache #1482</a>. Many thanks to <a href="https://github.com/antimatter15">Kevin Kwok</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1481">Fix type definition for DefinedNamesRanges #1481</a>. Many thanks to <a href="https://github.com/antimatter15">Kevin Kwok</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1480">Fixed undefined ref error when setting a data validation that is a range of cells at the worksheet level #1480</a>. Many thanks to <a href="https://github.com/Bene-Graham">Bene-Graham</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1485">add A3 paperSize number #1485</a>. This should fix <a href="https://github.com/exceljs/exceljs/issues/1406">[F] The printing size can be set to A3 #1406</a>. Many thanks to <a href="https://github.com/skypesky">skypesky</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1478">Fix #1364 Incorrect Worksheet Name on Streaming XLSX Reader #1478</a>. This should fix <a href="https://github.com/exceljs/exceljs/issues/1364">[BUG] Incorrect Worksheet Name on Streaming XLSX Reader #1364</a>. Many thanks to <a href="https://github.com/antimatter15">Kevin Kwok</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1466">grunt: skip babel transpile for core-js #1466</a>. Many thanks to <a href="https://github.com/myfreeer">myfreeer</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1486">xlsx: use TextDecoder and TextEncoder in browser #1486</a>. Many thanks to <a href="https://github.com/myfreeer">myfreeer</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1488">Refine typing for Column #1488</a>. This should fix <a href="https://github.com/exceljs/exceljs/issues/1120">[BUG] Typescript error from getColumn.eachCell #1120</a>. Many thanks to <a href="https://github.com/nywleswoey">Selwyn Yeow</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1489">col-cache: optimize for performance #1489</a>. Many thanks to <a href="https://github.com/myfreeer">myfreeer</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1487">Add lastColumn property (fixes #1453) #1487</a>. This should fix <a href="https://github.com/exceljs/exceljs/issues/1453">property of worsheet.lastcolumn #1453</a>. Many thanks to <a href="https://github.com/FliegendeWurst">FliegendeWurst</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1495">Add a test for CSV writeFile encoding #1495</a>. This should close <a href="https://github.com/exceljs/exceljs/issues/1473">[BUG] Export CSV garbled characters #1473</a>. and <a href="https://github.com/exceljs/exceljs/issues/995">Can't get hebrew to display correctly in a generted CSV file #995</a>. Many thanks to <a href="https://github.com/ArtskydJ">Joseph Dykstra</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1496">Clarify `encoding` option is just for `.writeFile` #1496</a>. Many thanks to <a href="https://github.com/ArtskydJ">Joseph Dykstra</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1377">Merge cells after row insert #1377</a>. Many thanks to <a href="https://github.com/curtcommander">Curt Commander</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1484">Fix issue 1474 (to check invalid sheet name) #1484</a>. This should fix <a href="https://github.com/exceljs/exceljs/issues/1474">[BUG] Incorrectly handles '/', ':' characters in sheet name #1474</a>. Many thanks to <a href="https://github.com/skypesky">skypesky</a> for this contribution. </li> </ul> |
| 4.2.1   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1550">Typing FillPattern fgColor should be optional #1550</a>. Many thanks to <a href="https://github.com/Andries-Smit">Andries Smit</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1564">Fixed return type on getRows #1564</a>. Many thanks to <a href="https://github.com/pmcilwaine">Paul Mcilwaine</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1599">fix #1598 lint violations #1599</a>. Fixes <a href="https://github.com/exceljs/exceljs/issues/1598">[BUG] npm run lint reports multiple violations #1598</a>. Many thanks to <a href="https://github.com/iva2k">Ilya I</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1606">Fix fullAddress row and col types #1606</a>. Many thanks to <a href="https://github.com/Akxe">Adam Eisenreich</a> for this contribution. </li> </ul> |
| 4.3.0   | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/1656">Add TS declarations of Workbook properties #1656</a>. Many thanks to <a href="https://github.com/kaoths">Tanawit Kritwongwiman</a> for this contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/201">Fix issue #178 #201</a>. Many thanks to <a href="https://github.com/stavenko">Vasiliy Stavenko</a> for this contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/1649">doc: add example for solid pattern usage #1649</a>. Many thanks to <a href="https://github.com/fpaupier">fpaupier</a> for this contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/1629">Add type definition for lastColumn property (fixes #1453) #1629</a>. Fixes <a href="https://github.com/exceljs/exceljs/issues/1453">Add type for property of worsheet.lastcolumn #1453</a>. Many thanks to <a href="https://github.com/masterzeus05">Daniel Gonçalves</a> for this contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/1599">fix #1598 lint violations #1599</a>. Fixes <a href="https://github.com/exceljs/exceljs/issues/1598">[BUG] npm run lint reports multiple violations #1598</a>. Many thanks to <a href="https://github.com/iva2k">Ilya I</a> for this contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/1133">Update @types/node version to latest lts #1133</a>. Fixes <a href="https://github.com/exceljs/exceljs/issues/971">ERROR in node_modules/exceljs/index.d.ts(1648,34): error TS2503: Cannot find namespace 'NodeJS'. #971</a> and <a href="https://github.com/exceljs/exceljs/issues/997">ERROR in node_modules/exceljs/index.d.ts(1661,34): error TS2503: Cannot find namespace 'NodeJS'. #997</a>. Many thanks to <a href="https://github.com/Siemienik">Siemienik Pawel</a> for this contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/1731">Added Node v16 to the test suite #1731</a>. Many thanks to <a href="https://github.com/alexbjorlig">Alex Bjørlig</a> for this contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/1708">Readme moment to dayjs #1708</a>. Many thanks to <a href="https://github.com/jerebtw">Jerebtw</a> for this contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/602">Ability to set tooltip for hyperlink #602</a>. Many thanks to <a href="https://github.com/kalexey89">Aleksey Kuznetsov</a> for this contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/1574">Fixed conditional format corrupting sheet #1305 #1574</a>. Fixes <a href="https://github.com/exceljs/exceljs/issues/1305">[BUG] Errors when opening file in Excel after saving a file with conditional formatting #1305</a>. Many thanks to <a href="https://github.com/rolandostar">Rolando Romero</a> for this contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/702">Improvements for images (correct reading/writing possitions) #702</a>. Many thanks to <a href="https://github.com/Siemienik">Siemienik Pawel</a> for this contribution.</li></ul> |
