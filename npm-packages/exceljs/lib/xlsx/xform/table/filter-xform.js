const BaseXform = require('../base-xform');

class FilterXform extends BaseXform {
  get tag() {
    return 'filter';
  }

  render(xmlStream, model) {
    xmlStream.leafNode(this.tag, {
      val: model.val,
    });
  }

  parseOpen(node) {
    if (node.name === this.tag) {
      this.model = {
        val: node.attributes.val,
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

module.exports = FilterXform;
