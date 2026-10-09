const _ = require('./under-dash');

const utils = require('./utils');

// constants
const OPEN_ANGLE = '<';
const CLOSE_ANGLE = '>';
const OPEN_ANGLE_SLASH = '</';
const CLOSE_SLASH_ANGLE = '/>';

function pushAttribute(xml, name, value) {
  xml.push(` ${name}="${utils.xmlEncode(value.toString())}"`);
}
function pushAttributes(xml, attributes) {
  if (attributes) {
    const tmp = [];
    _.each(attributes, (value, name) => {
      if (value !== undefined) {
        pushAttribute(tmp, name, value);
      }
    });
    xml.push(tmp.join(""));
  }
}

class XmlStream {
  constructor() {
    this._xml = [];
    this._stack = [];
    this._rollbacks = [];
  }

  get tos() {
    return this._stack.length ? this._stack[this._stack.length - 1] : undefined;
  }

  get cursor() {
    // handy way to track whether anything has been added
    return this._xml.length;
  }

  openXml(docAttributes) {
    const xml = this._xml;
    // <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    xml.push('<?xml');
    pushAttributes(xml, docAttributes);
    xml.push('?>\n');
  }

  openNode(name, attributes) {
    const parent = this.tos;
    const xml = this._xml;
    if (parent && this.open) {
      xml.push(CLOSE_ANGLE);
    }

    this._stack.push(name);

    // start streaming node
    xml.push(OPEN_ANGLE);
    xml.push(name);
    pushAttributes(xml, attributes);
    this.leaf = true;
    this.open = true;
  }

  addAttribute(name, value) {
    if (!this.open) {
      throw new Error('Cannot write attributes to node if it is not open');
    }
    if (value !== undefined) {
      pushAttribute(this._xml, name, value);
    }
  }

  addAttributes(attrs) {
    if (!this.open) {
      throw new Error('Cannot write attributes to node if it is not open');
    }
    pushAttributes(this._xml, attrs);
  }

  writeText(text) {
    const xml = this._xml;
    if (this.open) {
      xml.push(CLOSE_ANGLE);
      this.open = false;
    }
    this.leaf = false;
    xml.push(utils.xmlEncode(text.toString()));
  }

  writeXml(xml) {
    if (this.open) {
      this._xml.push(CLOSE_ANGLE);
      this.open = false;
    }
    this.leaf = false;
    this._xml.push(xml);
  }

  closeNode() {
    const node = this._stack.pop();
    const xml = this._xml;
    if (this.leaf) {
      xml.push(CLOSE_SLASH_ANGLE);
    } else {
      xml.push(OPEN_ANGLE_SLASH);
      xml.push(node);
      xml.push(CLOSE_ANGLE);
    }
    this.open = false;
    this.leaf = false;
  }

  leafNode(name, attributes, text) {
    this.openNode(name, attributes);
    if (text !== undefined) {
      // zeros need to be written
      this.writeText(text);
    }
    this.closeNode();
  }

  closeAll() {
    while (this._stack.length) {
      this.closeNode();
    }
  }

  addRollback() {
    this._rollbacks.push({
      xml: this._xml.length,
      stack: this._stack.length,
      leaf: this.leaf,
      open: this.open,
    });
    return this.cursor;
  }

  commit() {
    this._rollbacks.pop();
  }

  rollback() {
    const r = this._rollbacks.pop();
    if (this._xml.length > r.xml) {
      this._xml.splice(r.xml, this._xml.length - r.xml);
    }
    if (this._stack.length > r.stack) {
      this._stack.splice(r.stack, this._stack.length - r.stack);
    }
    this.leaf = r.leaf;
    this.open = r.open;
  }

  get xml() {
    this.closeAll();
    return this._xml.join('');
  }
}

XmlStream.StdDocAttributes = {
  version: '1.0',
  encoding: 'UTF-8',
  standalone: 'yes',
};

module.exports = XmlStream;
