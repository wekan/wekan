const fs = require('fs');

const exists = path => new Promise(resolve => fs.exists(path, resolve));

describe('ExcelJS', () => {
  describe('dist folder', () => {
    it('should include LICENSE', async () => {
      expect(await exists('./dist/LICENSE')).to.be.true()
    });
    it('should include exceljs.js', async () => {
      expect(await exists('./dist/exceljs.js')).to.be.true()
    });
    it('should include exceljs.min.js', async () => {
      expect(await exists('./dist/exceljs.min.js')).to.be.true()
    });
    it('should include exceljs.bare.js', async () => {
      expect(await exists('./dist/exceljs.bare.js')).to.be.true()
    });
    it('should include exceljs.bare.min.js', async () => {
      expect(await exists('./dist/exceljs.bare.min.js')).to.be.true()
    });
    it('should include es5/index', async () => {
      expect(await exists('./dist/es5/index.js')).to.be.true()
    });
  });
});