const CompositeXform = require('../../composite-xform');

const CfRuleExtXform = require('./cf-rule-ext-xform');
const ConditionalFormattingExtXform = require('./conditional-formatting-ext-xform');

class ConditionalFormattingsExtXform extends CompositeXform {
  constructor() {
    super();

    this.map = {
      'x14:conditionalFormatting': (this.cfXform = new ConditionalFormattingExtXform()),
    };
  }

  get tag() {
    return 'x14:conditionalFormattings';
  }

  hasContent(model) {
    if (model.hasExtContent === undefined) {
      model.hasExtContent = model.some(cf => cf.rules.some(CfRuleExtXform.isExt));
    }
    return model.hasExtContent;
  }

  prepare(model, options) {
    model.forEach(cf => {
      this.cfXform.prepare(cf, options);
    });
  }

  render(xmlStream, model) {
    if (this.hasContent(model)) {
      xmlStream.openNode(this.tag);
      model.forEach(cf => this.cfXform.render(xmlStream, cf));
      xmlStream.closeNode();
    }
  }

  createNewModel() {
    return [];
  }

  onParserClose(name, parser) {
    // model is array of conditional formatting objects
    this.model.push(parser.model);
  }
}

module.exports = ConditionalFormattingsExtXform;
