const BaseXform = require('../base-xform');

class DimensionXform extends BaseXform {
  get tag() {
    return 'dimension';
  }

  render(xmlStream, model) {
    if (model) {
      xmlStream.leafNode('dimension', {ref: model});
    }
  }

  parseOpen(node) {
    if (node.name === 'dimension') {
      this.model = node.attributes.ref;
      return true;
    }
    return false;
  }

  parseText() {}

  parseClose() {
    return false;
  }
}

module.exports = DimensionXform;
