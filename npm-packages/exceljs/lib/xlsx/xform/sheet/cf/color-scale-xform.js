const CompositeXform = require('../../composite-xform');

const ColorXform = require('../../style/color-xform');
const CfvoXform = require('./cfvo-xform');

class ColorScaleXform extends CompositeXform {
  constructor() {
    super();

    this.map = {
      cfvo: (this.cfvoXform = new CfvoXform()),
      color: (this.colorXform = new ColorXform()),
    };
  }

  get tag() {
    return 'colorScale';
  }

  render(xmlStream, model) {
    xmlStream.openNode(this.tag);

    model.cfvo.forEach(cfvo => {
      this.cfvoXform.render(xmlStream, cfvo);
    });
    model.color.forEach(color => {
      this.colorXform.render(xmlStream, color);
    });

    xmlStream.closeNode();
  }

  createNewModel(node) {
    return {
      cfvo: [],
      color: [],
    };
  }

  onParserClose(name, parser) {
    this.model[name].push(parser.model);
  }
}

module.exports = ColorScaleXform;
