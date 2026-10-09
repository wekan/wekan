const colCache = require('./col-cache');

// const cellRefRegex = /(([a-z_\-0-9]*)!)?[$]?([a-z]+)[$]?([1-9][0-9]*)/i;
const replacementCandidateRx = /(([a-z_\-0-9]*)!)?([a-z0-9_$]{2,})([(])?/gi;
const CRrx = /^([$])?([a-z]+)([$])?([1-9][0-9]*)$/i;

function slideFormula(formula, fromCell, toCell) {
  const offset = colCache.decode(fromCell);
  const to = colCache.decode(toCell);
  return formula.replace(
    replacementCandidateRx,
    (refMatch, sheet, sheetMaybe, addrPart, trailingParen) => {
      if (trailingParen) {
        return refMatch;
      }
      const match = CRrx.exec(addrPart);
      if (match) {
        const colDollar = match[1];
        const colStr = match[2].toUpperCase();
        const rowDollar = match[3];
        const rowStr = match[4];
        if (colStr.length > 3 || (colStr.length === 3 && colStr > 'XFD')) {
          // > XFD is the highest col number in excel 2007 and beyond, so this is a named range
          return refMatch;
        }
        let col = colCache.l2n(colStr);
        let row = parseInt(rowStr, 10);
        if (!colDollar) {
          col += to.col - offset.col;
        }
        if (!rowDollar) {
          row += to.row - offset.row;
        }
        const res = (sheet || '') + (colDollar || '') + colCache.n2l(col) + (rowDollar || '') + row;
        return res;
      }
      return refMatch;
    }
  );
}

module.exports = {
  slideFormula,
};
