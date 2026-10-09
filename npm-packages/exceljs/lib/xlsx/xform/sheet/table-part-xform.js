const BaseXform = require('../base-xform');

class TablePartXform extends BaseXform {
  get tag() {
    return 'tablePart';
  }

  render(xmlStream, model) {
    if (model) {
      xmlStream.leafNode(this.tag, {'r:id': model.rId});
    }
  }

  parseOpen(node) {
    switch (node.name) {
      case this.tag:
        this.model = {
          rId: node.attributes['r:id'],
        };
        return true;
      default:
        return false;
    }
  }

  parseText() {}

  parseClose() {
    return false;
  }
}

module.exports = TablePartXform;
