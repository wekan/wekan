const BaseXform = require('../base-xform');

const validation = {
  boolean(value, dflt) {
    if (value === undefined) {
      return dflt;
    }
    return value;
  },
};

// Protection encapsulates translation from style.protection model to/from xlsx
class ProtectionXform extends BaseXform {
  get tag() {
    return 'protection';
  }

  render(xmlStream, model) {
    xmlStream.addRollback();
    xmlStream.openNode('protection');

    let isValid = false;
    function add(name, value) {
      if (value !== undefined) {
        xmlStream.addAttribute(name, value);
        isValid = true;
      }
    }
    add('locked', validation.boolean(model.locked, true) ? undefined : '0');
    add('hidden', validation.boolean(model.hidden, false) ? '1' : undefined);

    xmlStream.closeNode();

    if (isValid) {
      xmlStream.commit();
    } else {
      xmlStream.rollback();
    }
  }

  parseOpen(node) {
    const model = {
      locked: !(node.attributes.locked === '0'),
      hidden: node.attributes.hidden === '1',
    };

    // only want to record models that differ from defaults
    const isSignificant = !model.locked || model.hidden;

    this.model = isSignificant ? model : null;
  }

  parseText() {}

  parseClose() {
    return false;
  }
}

module.exports = ProtectionXform;
