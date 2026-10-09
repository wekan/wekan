const BaseXform = require('../../base-xform');

class CfvoXform extends BaseXform {
  get tag() {
    return 'cfvo';
  }

  render(xmlStream, model) {
    xmlStream.leafNode(this.tag, {
      type: model.type,
      val: model.value,
    });
  }

  parseOpen(node) {
    this.model = {
      type: node.attributes.type,
      value: BaseXform.toFloatValue(node.attributes.val),
    };
  }

  parseClose(name) {
    return name !== this.tag;
  }
}

module.exports = CfvoXform;
