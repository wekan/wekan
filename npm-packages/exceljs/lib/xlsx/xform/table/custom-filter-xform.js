const BaseXform = require('../base-xform');

class CustomFilterXform extends BaseXform {
  get tag() {
    return 'customFilter';
  }

  render(xmlStream, model) {
    xmlStream.leafNode(this.tag, {
      val: model.val,
      operator: model.operator,
    });
  }

  parseOpen(node) {
    if (node.name === this.tag) {
      this.model = {
        val: node.attributes.val,
        operator: node.attributes.operator,
      };
      return true;
    }
    return false;
  }

  parseText() {}

  parseClose() {
    return false;
  }
}

module.exports = CustomFilterXform;
