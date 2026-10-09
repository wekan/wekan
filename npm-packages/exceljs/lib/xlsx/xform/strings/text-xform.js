const BaseXform = require('../base-xform');

//   <t xml:space="preserve"> is </t>

class TextXform extends BaseXform {
  get tag() {
    return 't';
  }

  render(xmlStream, model) {
    xmlStream.openNode('t');
    if (/^\s|\n|\s$/.test(model)) {
      xmlStream.addAttribute('xml:space', 'preserve');
    }
    xmlStream.writeText(model);
    xmlStream.closeNode();
  }

  get model() {
    return this._text
      .join('')
      .replace(/_x([0-9A-F]{4})_/g, ($0, $1) => String.fromCharCode(parseInt($1, 16)));
  }

  parseOpen(node) {
    switch (node.name) {
      case 't':
        this._text = [];
        return true;
      default:
        return false;
    }
  }

  parseText(text) {
    this._text.push(text);
  }

  parseClose() {
    return false;
  }
}

module.exports = TextXform;
