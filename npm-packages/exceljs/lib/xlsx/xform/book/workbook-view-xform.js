const BaseXform = require('../base-xform');

class WorkbookViewXform extends BaseXform {
  render(xmlStream, model) {
    const attributes = {
      xWindow: model.x || 0,
      yWindow: model.y || 0,
      windowWidth: model.width || 12000,
      windowHeight: model.height || 24000,
      firstSheet: model.firstSheet,
      activeTab: model.activeTab,
    };
    if (model.visibility && model.visibility !== 'visible') {
      attributes.visibility = model.visibility;
    }
    xmlStream.leafNode('workbookView', attributes);
  }

  parseOpen(node) {
    if (node.name === 'workbookView') {
      const model = (this.model = {});
      const addS = function(name, value, dflt) {
        const s = value !== undefined ? (model[name] = value) : dflt;
        if (s !== undefined) {
          model[name] = s;
        }
      };
      const addN = function(name, value, dflt) {
        const n = value !== undefined ? (model[name] = parseInt(value, 10)) : dflt;
        if (n !== undefined) {
          model[name] = n;
        }
      };
      addN('x', node.attributes.xWindow, 0);
      addN('y', node.attributes.yWindow, 0);
      addN('width', node.attributes.windowWidth, 25000);
      addN('height', node.attributes.windowHeight, 10000);
      addS('visibility', node.attributes.visibility, 'visible');
      addN('activeTab', node.attributes.activeTab, undefined);
      addN('firstSheet', node.attributes.firstSheet, undefined);
      return true;
    }
    return false;
  }

  parseText() {}

  parseClose() {
    return false;
  }
}

module.exports = WorkbookViewXform;
