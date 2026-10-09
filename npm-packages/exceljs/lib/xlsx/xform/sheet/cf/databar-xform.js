const CompositeXform = require('../../composite-xform');

const ColorXform = require('../../style/color-xform');
const CfvoXform = require('./cfvo-xform');

class DatabarXform extends CompositeXform {
  constructor() {
    super();

    this.map = {
      cfvo: (this.cfvoXform = new CfvoXform()),
      color: (this.colorXform = new ColorXform()),
    };
  }

  get tag() {
    return 'dataBar';
  }

  render(xmlStream, model) {
    xmlStream.openNode(this.tag);

    // Provide defaults if cfvo array is not specified
    const cfvoList =
      model.cfvo && model.cfvo.length > 0 ? model.cfvo : [{type: 'min'}, {type: 'max'}];

    cfvoList.forEach(cfvo => {
      this.cfvoXform.render(xmlStream, cfvo);
    });

    // Provide default color if not specified (Excel blue: #638EC6)
    const color = model.color || {argb: 'FF638EC6'};
    this.colorXform.render(xmlStream, color);

    xmlStream.closeNode();
  }

  createNewModel() {
    return {
      cfvo: [],
    };
  }

  onParserClose(name, parser) {
    switch (name) {
      case 'cfvo':
        this.model.cfvo.push(parser.model);
        break;
      case 'color':
        this.model.color = parser.model;
        break;
    }
  }
}

module.exports = DatabarXform;
