const BaseXform = require('../base-xform');

class AppHeadingPairsXform extends BaseXform {
  render(xmlStream, model) {
    xmlStream.openNode('HeadingPairs');
    xmlStream.openNode('vt:vector', {size: 2, baseType: 'variant'});

    xmlStream.openNode('vt:variant');
    xmlStream.leafNode('vt:lpstr', undefined, 'Worksheets');
    xmlStream.closeNode();

    xmlStream.openNode('vt:variant');
    xmlStream.leafNode('vt:i4', undefined, model.length);
    xmlStream.closeNode();

    xmlStream.closeNode();
    xmlStream.closeNode();
  }

  parseOpen(node) {
    // no parsing
    return node.name === 'HeadingPairs';
  }

  parseText() {}

  parseClose(name) {
    return name !== 'HeadingPairs';
  }
}

module.exports = AppHeadingPairsXform;
