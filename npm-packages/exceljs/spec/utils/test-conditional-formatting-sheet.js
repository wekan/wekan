const tools = require('./tools');

const self = {
  conditionalFormattings: tools.fix(require('./data/conditional-formatting')),
  getConditionalFormatting(type) {
    return self.conditionalFormattings[type] || null;
  },
  addSheet(wb) {
    const ws = wb.addWorksheet('conditional-formatting');
    const {types} = self.conditionalFormattings;
    types.forEach(type => {
      const conditionalFormatting = self.getConditionalFormatting(type);
      if (conditionalFormatting) {
        ws.addConditionalFormatting(conditionalFormatting);
      }
    });
  },

  checkSheet(wb) {
    const ws = wb.getWorksheet('conditional-formatting');
    expect(ws).to.not.be.undefined();
    expect(ws.conditionalFormattings).to.not.be.undefined();
    (ws.conditionalFormattings && ws.conditionalFormattings).forEach(item => {
      const type = item.rules && item.rules[0].type;
      const conditionalFormatting = self.getConditionalFormatting(type);
      expect(item).to.have.property('ref');
      expect(item).to.have.property('rules');
      expect(self.conditionalFormattings[type]).to.have.property('ref');
      expect(self.conditionalFormattings[type]).to.have.property('rules');
      expect(item.ref).to.deep.equal(conditionalFormatting.ref);
      expect(item.rules.length).to.equal(conditionalFormatting.rules.length);
    });
  },
};

module.exports = self;
