const BaseXform = require('../base-xform');

class HeaderFooterXform extends BaseXform {
  get tag() {
    return 'headerFooter';
  }

  render(xmlStream, model) {
    if (model) {
      xmlStream.addRollback();

      let createTag = false;

      xmlStream.openNode('headerFooter');
      if (model.differentFirst) {
        xmlStream.addAttribute('differentFirst', '1');
        createTag = true;
      }
      if (model.differentOddEven) {
        xmlStream.addAttribute('differentOddEven', '1');
        createTag = true;
      }
      if (model.oddHeader && typeof model.oddHeader === 'string') {
        xmlStream.leafNode('oddHeader', null, model.oddHeader);
        createTag = true;
      }
      if (model.oddFooter && typeof model.oddFooter === 'string') {
        xmlStream.leafNode('oddFooter', null, model.oddFooter);
        createTag = true;
      }
      if (model.evenHeader && typeof model.evenHeader === 'string') {
        xmlStream.leafNode('evenHeader', null, model.evenHeader);
        createTag = true;
      }
      if (model.evenFooter && typeof model.evenFooter === 'string') {
        xmlStream.leafNode('evenFooter', null, model.evenFooter);
        createTag = true;
      }
      if (model.firstHeader && typeof model.firstHeader === 'string') {
        xmlStream.leafNode('firstHeader', null, model.firstHeader);
        createTag = true;
      }
      if (model.firstFooter && typeof model.firstFooter === 'string') {
        xmlStream.leafNode('firstFooter', null, model.firstFooter);
        createTag = true;
      }

      if (createTag) {
        xmlStream.closeNode();
        xmlStream.commit();
      } else {
        xmlStream.rollback();
      }
    }
  }

  parseOpen(node) {
    switch (node.name) {
      case 'headerFooter':
        this.model = {};
        if (node.attributes.differentFirst) {
          this.model.differentFirst = parseInt(node.attributes.differentFirst, 0) === 1;
        }
        if (node.attributes.differentOddEven) {
          this.model.differentOddEven = parseInt(node.attributes.differentOddEven, 0) === 1;
        }
        return true;

      case 'oddHeader':
        this.currentNode = 'oddHeader';
        return true;

      case 'oddFooter':
        this.currentNode = 'oddFooter';
        return true;

      case 'evenHeader':
        this.currentNode = 'evenHeader';
        return true;

      case 'evenFooter':
        this.currentNode = 'evenFooter';
        return true;

      case 'firstHeader':
        this.currentNode = 'firstHeader';
        return true;

      case 'firstFooter':
        this.currentNode = 'firstFooter';
        return true;

      default:
        return false;
    }
  }

  parseText(text) {
    switch (this.currentNode) {
      case 'oddHeader':
        this.model.oddHeader = text;
        break;

      case 'oddFooter':
        this.model.oddFooter = text;
        break;

      case 'evenHeader':
        this.model.evenHeader = text;
        break;

      case 'evenFooter':
        this.model.evenFooter = text;
        break;

      case 'firstHeader':
        this.model.firstHeader = text;
        break;

      case 'firstFooter':
        this.model.firstFooter = text;
        break;

      default:
        break;
    }
  }

  parseClose() {
    switch (this.currentNode) {
      case 'oddHeader':
      case 'oddFooter':
      case 'evenHeader':
      case 'evenFooter':
      case 'firstHeader':
      case 'firstFooter':
        this.currentNode = undefined;
        return true;

      default:
        return false;
    }
  }
}

module.exports = HeaderFooterXform;
