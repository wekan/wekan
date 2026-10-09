const CompositeXform = require('../../composite-xform');

const FExtXform = require('./f-ext-xform');

class CfvoExtXform extends CompositeXform {
  constructor() {
    super();

    this.map = {
      'xm:f': (this.fExtXform = new FExtXform()),
    };
  }

  get tag() {
    return 'x14:cfvo';
  }

  render(xmlStream, model) {
    xmlStream.openNode(this.tag, {
      type: model.type,
    });
    if (model.value !== undefined) {
      this.fExtXform.render(xmlStream, model.value);
    }
    xmlStream.closeNode();
  }

  createNewModel(node) {
    return {
      type: node.attributes.type,
    };
  }

  onParserClose(name, parser) {
    switch (name) {
      case 'xm:f':
        this.model.value = parser.model ? parseFloat(parser.model) : 0;
        break;
    }
  }
}

module.exports = CfvoExtXform;
