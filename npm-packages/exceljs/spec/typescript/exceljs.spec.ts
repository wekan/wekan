import 'regenerator-runtime/runtime';

import { expect } from 'chai';
import ExcelJS from '../../index';

describe('typescript', () => {
  it('can create and buffer xlsx', async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('blort');
    ws.getCell('A1').value = 7;
    const buffer = await wb.xlsx.writeBuffer({
      useStyles: true,
      useSharedStrings: true,
    });

    const wb2 = new ExcelJS.Workbook();
    await wb2.xlsx.load(buffer);
    const ws2 = wb2.getWorksheet('blort');
    expect(ws2.getCell('A1').value).to.equal(7);
  });
  it('can create and stream xlsx', async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('blort');
    ws.getCell('A1').value = 7;

    const { PassThrough } = require('stream');
    const stream = new PassThrough();
    const wb2 = new ExcelJS.Workbook();
    
    // Write to stream and read from it
    const writePromise = wb.xlsx.write(stream);
    const readPromise = wb2.xlsx.read(stream);
    
    await Promise.all([writePromise, readPromise]);
    
    const ws2 = wb2.getWorksheet('blort');
    expect(ws2.getCell('A1').value).to.equal(7);
  });
});
