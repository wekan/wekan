# ChangeLog

This package is ExcelJS with updated dependencies,
used at Meteor 3 WeKan with Node.js 24.x.

## Upcoming exceljs release

- [Read sheet names without a backtracking regular expression, pin the manual pages' CDN script, update brace-expansion](https://github.com/wekan/exceljs/commit/25db7892434b31c35374bba2433d6479fb005642).
  Thanks to xet7.

## 2026-10-10 exceljs release 4.7.4

- [Streaming WorkbookWriter works with archiver 8, and places images over cells, reading one image at a time](https://github.com/wekan/exceljs/commit/7b2f9395dc12141ae026f8d28b2eeeb32f457e78).
  Thanks to xet7.

## 2026-06-18 exceljs release 4.7.3

- [Updated dependencies](https://github.com/wekan/exceljs/commit/ff164a51ac51960f08cc1d0dc0a64114158452ff).
  Thanks to xet7.

## 2026-06-18 exceljs release 4.7.2

- [Updated dependencies](https://github.com/wekan/exceljs/commit/3c47a407fa4f3a00d3cdcaaa12c35e5a22de74c7).
  Thanks to xet7.

## 2026-03-04 exceljs release 4.7.0

- [Updated dependencies](https://github.com/wekan/exceljs/commit/d02af8f7f4cd8146b1fe1d6dc8e9333f31f69163).
  Thanks to xet7.
- [Excel file test script from https://github.com/rmartin93/exceljs-fork/commit/2785226](https://github.com/wekan/exceljs/commit/ec62fc906f01884847a6fd06942921526019f769). 
  Thanks to rmartin93.
- [Fix getTable() addRow bug and preserve Excel table filter buttons](https://github.com/wekan/exceljs/commit/bb0c76b6a449599cd172e59cb3ed8b974021354e).
  Thanks to rmartin93.
- Fix: terminates early on macOS with Node.js 22, causing to fail for...
  [Part 1](https://github.com/wekan/exceljs/commit/d6f482bcb5b989c488d74e84b1fa3f58cd7ab164),
  [Part 2](https://github.com/wekan/exceljs/commit/941147b1ee81fe3280d4dc058e7736fc1e29cfde).
  Thanks to tkambler.
- Add support for HAN CELL Excel files.
  [Part 1](https://github.com/wekan/exceljs/commit/f7e3042896a6ffcfa67d2fdaf056a84d847c81a7),
  [Part 2](https://github.com/wekan/exceljs/commit/d80f584a9b45974f0ed67ea6cd1c9802257ccb59).
- Add default values for data bar conditional formatting.
  [Part 1](https://github.com/wekan/exceljs/commit/c7bc77e5f1ac018b9845f9229671defac6039eae),
  [Part 2](https://github.com/wekan/exceljs/commit/eb7d90f6f0348a1c5c95b2a6d24e3e0faf3ae248).
  Thanks to protobi-pieter.
- [Fix prettier config and revert to single quote style](https://github.com/wekan/exceljs/commit/aeee7b4708a5da23d7a88367866c13a7e64448c1).
  Thanks to protobi-pieter.
- README.md: Formulas: Add note about not including '='.
  [Part 1](https://github.com/wekan/exceljs/commit/41adde894415fbb5d2616199115a00ff28e23566),
  [Part 2](https://github.com/wekan/exceljs/commit/58adb11ae62845babd1d2f19d98946f4cf51be1a).
  Thanks to moshekaplan.
- [Fix typo in comment](https://github.com/wekan/exceljs/commit/ce53e877863c7d14c74d9fd92cab1552fb767670).
  Thanks to divingbeetle at https://github.com/exceljs/exceljs/pull/3003.
- Under stream processing, the information of the merged cells in the table cannot be obtained.
  [Part 1](https://github.com/wekan/exceljs/commit/commit/948a4825d4886769c4bd5486578f511c5e4ccf1a),
  [Part 2](https://github.com/wekan/exceljs/commit/commit/8e3b2ec137f97886e2428575e3b3444fdf61f982),
  [Part 3](https://github.com/wekan/exceljs/commit/commit/1fa690317d4d4014bf3eb4467a251101b1b1b43e),
  [Part 4](https://github.com/wekan/exceljs/commit/commit/8618d25ea1da8af82186c8051ff6f7580d533c71).
  Thanks to halvee-tech.
- Removed critical vulnerabilities from the package.
  [Part 1](https://github.com/wekan/exceljs/commit/94bec0e63ddecd1fce67516d678b322f4a239ee3),
  [Part 2](https://github.com/wekan/exceljs/commit/c5ef06a901e6695a62934050f2ab4d2cc449c09c),
  [Part 3](https://github.com/wekan/exceljs/commit/1056b357aadd811f0e5640e6826f75765d6b727b).
  Thanks to peterv959.

## 2026-02-24 exceljs release 4.5.2

- [Updated dependencies](https://github.com/wekan/exceljs/commit/3b3eb4e84a1ec266ea8e65a31a3f36509ec9d4e3).
  Thanks to xet7.

## 2026-02-19 exceljs release 4.5.1

- [Updated minimatch](https://github.com/wekan/exceljs/commit/127a86cc1a817b5208d93fe48b49d84e65992154).
  Thanks to xet7.

## 2024-08-02 exceljs release

- [Removed vulnerable devDependencies](https://github.com/wekan/exceljs/commit/e81389fbbbbb6c89b44a783e176acb1848ff93d7).
  Thanks to xet7.
