const BaseXform = require('../base-xform');

class PageBreaksXform extends BaseXform {
  get tag() {
    return 'brk';
  }

  render(xmlStream, model) {
    xmlStream.leafNode('brk', model);
  }

  parseOpen(node) {
    if (node.name === 'brk') {
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

module.exports = PageBreaksXform;
