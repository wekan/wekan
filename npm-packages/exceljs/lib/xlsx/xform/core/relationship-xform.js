const BaseXform = require('../base-xform');

class RelationshipXform extends BaseXform {
  render(xmlStream, model) {
    xmlStream.leafNode('Relationship', model);
  }

  parseOpen(node) {
    switch (node.name) {
      case 'Relationship':
        this.model = node.attributes;
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

module.exports = RelationshipXform;
