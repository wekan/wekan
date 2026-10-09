---
name: 🐛 Bug report
about: Create a report to help us improve
title: '[BUG] XYZ'
labels: ':bug: Bug'
---

## 🐛 Bug Report

<!-- A clear and concise description of what the bug is. -->

Lib version: X.Y.Z

## Steps To Reproduce

<!-- The exact steps required to reproduce the issue, ideally with a code example -->

```javascript
const wb = new ExcelJS.Workbook();
const ws = wb.addWorksheet('XYZ');

ws.getCell('A1').value = 7;
expect(ws.getCell('A1').value).to.equal(7);
```

## The expected behaviour:

<!-- A clear and concise description of what you expected to happen. -->


## Possible solution (optional, but very helpful):

```javascript

```
