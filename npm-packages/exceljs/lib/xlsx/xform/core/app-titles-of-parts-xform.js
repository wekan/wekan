const BaseXform = require('../base-xform');

class AppTitlesOfPartsXform extends BaseXform {
  render(xmlStream, model) {
    xmlStream.openNode('TitlesOfParts');
    xmlStream.openNode('vt:vector', {size: model.length, baseType: 'lpstr'});

    model.forEach(sheet => {
      xmlStream.leafNode('vt:lpstr', undefined, sheet.name);
    });

    xmlStream.closeNode();
    xmlStream.closeNode();
  }

  parseOpen(node) {
    // no parsing
    return node.name === 'TitlesOfParts';
  }

  parseText() {}

  parseClose(name) {
    return name !== 'TitlesOfParts';
  }
}

module.exports = AppTitlesOfPartsXform;
