const {slideFormula} = verquire('utils/shared-formula');

describe('shared-formula', () => {
  describe('slideFormula', () => {
    const expectations = [
      {args: ['A1+1', 'A2', 'A3'], result: 'A2+1'},
      {args: ['A1+1', 'A2', 'B2'], result: 'B1+1'},
      {args: ['SUM(A1:A10)', 'A11', 'B11'], result: 'SUM(B1:B10)'},
      {args: ['$A$1+A1', 'A2', 'A3'], result: '$A$1+A2'},
      {args: ['$A$1+A1', 'A2', 'B2'], result: '$A$1+B1'},
      {args: ['$A1+A1', 'A2', 'A3'], result: '$A2+A2'},
      {args: ['$A1+A1', 'A2', 'B2'], result: '$A1+B1'},
      {args: ['A$1+A1', 'A2', 'A3'], result: 'A$1+A2'},
      {args: ['A$1+A1', 'A2', 'B2'], result: 'B$1+B1'},
    ];
    expectations.forEach(({args, result}) => {
      it(`${args[0]} from ${args[1]} to ${args[2]}`, () => {
        expect(slideFormula(...args)).to.equal(result);
      });
    });
  });
});
