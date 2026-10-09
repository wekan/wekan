const utils = require('../../../utils/utils');
const BaseXform = require('../base-xform');
const Range = require('../../../doc/range');
const Enums = require('../../../doc/enums');

const RichTextXform = require('../strings/rich-text-xform');

function getValueType(v) {
  if (v === null || v === undefined) {
    return Enums.ValueType.Null;
  }
  if (v instanceof String || typeof v === 'string') {
    return Enums.ValueType.String;
  }
  if (typeof v === 'number') {
    return Enums.ValueType.Number;
  }
  if (typeof v === 'boolean') {
    return Enums.ValueType.Boolean;
  }
  if (v instanceof Date) {
    return Enums.ValueType.Date;
  }
  if (v.text && v.hyperlink) {
    return Enums.ValueType.Hyperlink;
  }
  if (v.formula) {
    return Enums.ValueType.Formula;
  }
  if (v.error) {
    return Enums.ValueType.Error;
  }
  throw new Error('I could not understand type of value');
}

function getEffectiveCellType(cell) {
  switch (cell.type) {
    case Enums.ValueType.Formula:
      return getValueType(cell.result);
    default:
      return cell.type;
  }
}

class CellXform extends BaseXform {
  constructor() {
    super();

    this.richTextXForm = new RichTextXform();
  }

  get tag() {
    return 'c';
  }

  prepare(model, options) {
    const styleId = options.styles.addStyleModel(model.style || {}, getEffectiveCellType(model));
    if (styleId) {
      model.styleId = styleId;
    }

    if (model.comment) {
      options.comments.push({...model.comment, ref: model.address});
    }

    switch (model.type) {
      case Enums.ValueType.String:
      case Enums.ValueType.RichText:
        if (options.sharedStrings) {
          model.ssId = options.sharedStrings.add(model.value);
        }
        break;

      case Enums.ValueType.Date:
        if (options.date1904) {
          model.date1904 = true;
        }
        break;

      case Enums.ValueType.Hyperlink:
        if (options.sharedStrings && model.text !== undefined && model.text !== null) {
          model.ssId = options.sharedStrings.add(model.text);
        }
        options.hyperlinks.push({
          address: model.address,
          target: model.hyperlink,
          tooltip: model.tooltip,
        });
        break;

      case Enums.ValueType.Merge:
        options.merges.add(model);
        break;

      case Enums.ValueType.Formula:
        if (options.date1904) {
          // in case valueType is date
          model.date1904 = true;
        }

        if (model.shareType === 'shared') {
          model.si = options.siFormulae++;
        }

        if (model.formula) {
          options.formulae[model.address] = model;
        } else if (model.sharedFormula) {
          const master = options.formulae[model.sharedFormula];
          if (!master) {
            throw new Error(
              `Shared Formula master must exist above and or left of clone for cell ${model.address}`
            );
          }
          if (master.si === undefined) {
            master.shareType = 'shared';
            master.si = options.siFormulae++;
            master.range = new Range(master.address, model.address);
          } else if (master.range) {
            master.range.expandToAddress(model.address);
          }
          model.si = master.si;
        }
        break;

      default:
        break;
    }
  }

  renderFormula(xmlStream, model) {
    let attrs = null;
    switch (model.shareType) {
      case 'shared':
        attrs = {
          t: 'shared',
          ref: model.ref || model.range.range,
          si: model.si,
        };
        break;

      case 'array':
        attrs = {
          t: 'array',
          ref: model.ref,
        };
        break;

      default:
        if (model.si !== undefined) {
          attrs = {
            t: 'shared',
            si: model.si,
          };
        }
        break;
    }

    switch (getValueType(model.result)) {
      case Enums.ValueType.Null: // ?
        xmlStream.leafNode('f', attrs, model.formula);
        break;

      case Enums.ValueType.String:
        // oddly, formula results don't ever use shared strings
        xmlStream.addAttribute('t', 'str');
        xmlStream.leafNode('f', attrs, model.formula);
        xmlStream.leafNode('v', null, model.result);
        break;

      case Enums.ValueType.Number:
        xmlStream.leafNode('f', attrs, model.formula);
        xmlStream.leafNode('v', null, model.result);
        break;

      case Enums.ValueType.Boolean:
        xmlStream.addAttribute('t', 'b');
        xmlStream.leafNode('f', attrs, model.formula);
        xmlStream.leafNode('v', null, model.result ? 1 : 0);
        break;

      case Enums.ValueType.Error:
        xmlStream.addAttribute('t', 'e');
        xmlStream.leafNode('f', attrs, model.formula);
        xmlStream.leafNode('v', null, model.result.error);
        break;

      case Enums.ValueType.Date:
        xmlStream.leafNode('f', attrs, model.formula);
        xmlStream.leafNode('v', null, utils.dateToExcel(model.result, model.date1904));
        break;

      // case Enums.ValueType.Hyperlink: // ??
      // case Enums.ValueType.Formula:
      default:
        throw new Error('I could not understand type of value');
    }
  }

  render(xmlStream, model) {
    if (model.type === Enums.ValueType.Null && !model.styleId) {
      // if null and no style, exit
      return;
    }

    xmlStream.openNode('c');
    xmlStream.addAttribute('r', model.address);

    if (model.styleId) {
      xmlStream.addAttribute('s', model.styleId);
    }

    switch (model.type) {
      case Enums.ValueType.Null:
        break;

      case Enums.ValueType.Number:
        xmlStream.leafNode('v', null, model.value);
        break;

      case Enums.ValueType.Boolean:
        xmlStream.addAttribute('t', 'b');
        xmlStream.leafNode('v', null, model.value ? '1' : '0');
        break;

      case Enums.ValueType.Error:
        xmlStream.addAttribute('t', 'e');
        xmlStream.leafNode('v', null, model.value.error);
        break;

      case Enums.ValueType.String:
      case Enums.ValueType.RichText:
        if (model.ssId !== undefined) {
          xmlStream.addAttribute('t', 's');
          xmlStream.leafNode('v', null, model.ssId);
        } else if (model.value && model.value.richText) {
          xmlStream.addAttribute('t', 'inlineStr');
          xmlStream.openNode('is');
          model.value.richText.forEach(text => {
            this.richTextXForm.render(xmlStream, text);
          });
          xmlStream.closeNode('is');
        } else {
          xmlStream.addAttribute('t', 'str');
          xmlStream.leafNode('v', null, model.value);
        }
        break;

      case Enums.ValueType.Date:
        xmlStream.leafNode('v', null, utils.dateToExcel(model.value, model.date1904));
        break;

      case Enums.ValueType.Hyperlink:
        if (model.ssId !== undefined) {
          xmlStream.addAttribute('t', 's');
          xmlStream.leafNode('v', null, model.ssId);
        } else {
          xmlStream.addAttribute('t', 'str');
          xmlStream.leafNode('v', null, model.text);
        }
        break;

      case Enums.ValueType.Formula:
        this.renderFormula(xmlStream, model);
        break;

      case Enums.ValueType.Merge:
        // nothing to add
        break;

      default:
        break;
    }

    xmlStream.closeNode(); // </c>
  }

  parseOpen(node) {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    switch (node.name) {
      case 'c':
        // const address = colCache.decodeAddress(node.attributes.r);
        this.model = {
          address: node.attributes.r,
        };
        this.t = node.attributes.t;
        if (node.attributes.s) {
          this.model.styleId = parseInt(node.attributes.s, 10);
        }
        return true;

      case 'f':
        this.currentNode = 'f';
        this.model.si = node.attributes.si;
        this.model.shareType = node.attributes.t;
        this.model.ref = node.attributes.ref;
        return true;

      case 'v':
        this.currentNode = 'v';
        return true;

      case 't':
        this.currentNode = 't';
        return true;

      case 'r':
        this.parser = this.richTextXForm;
        this.parser.parseOpen(node);
        return true;

      default:
        return false;
    }
  }

  parseText(text) {
    if (this.parser) {
      this.parser.parseText(text);
      return;
    }
    switch (this.currentNode) {
      case 'f':
        this.model.formula = this.model.formula ? this.model.formula + text : text;
        break;
      case 'v':
      case 't':
        if (this.model.value && this.model.value.richText) {
          this.model.value.richText.text = this.model.value.richText.text
            ? this.model.value.richText.text + text
            : text;
        } else {
          this.model.value = this.model.value ? this.model.value + text : text;
        }
        break;
      default:
        break;
    }
  }

  parseClose(name) {
    switch (name) {
      case 'c': {
        const {model} = this;

        // first guess on cell type
        if (model.formula || model.shareType) {
          model.type = Enums.ValueType.Formula;
          if (model.value) {
            if (this.t === 'str') {
              model.result = utils.xmlDecode(model.value);
            } else if (this.t === 'b') {
              model.result = parseInt(model.value, 10) !== 0;
            } else if (this.t === 'e') {
              model.result = {error: model.value};
            } else {
              model.result = parseFloat(model.value);
            }
            model.value = undefined;
          }
        } else if (model.value !== undefined) {
          switch (this.t) {
            case 's':
              model.type = Enums.ValueType.String;
              model.value = parseInt(model.value, 10);
              break;
            case 'str':
              model.type = Enums.ValueType.String;
              model.value = utils.xmlDecode(model.value);
              break;
            case 'inlineStr':
              model.type = Enums.ValueType.String;
              break;
            case 'b':
              model.type = Enums.ValueType.Boolean;
              model.value = parseInt(model.value, 10) !== 0;
              break;
            case 'e':
              model.type = Enums.ValueType.Error;
              model.value = {error: model.value};
              break;
            default:
              model.type = Enums.ValueType.Number;
              model.value = parseFloat(model.value);
              break;
          }
        } else if (model.styleId) {
          model.type = Enums.ValueType.Null;
        } else {
          model.type = Enums.ValueType.Merge;
        }
        return false;
      }

      case 'f':
      case 'v':
      case 'is':
        this.currentNode = undefined;
        return true;

      case 't':
        if (this.parser) {
          this.parser.parseClose(name);
          return true;
        }
        this.currentNode = undefined;
        return true;

      case 'r':
        this.model.value = this.model.value || {};
        this.model.value.richText = this.model.value.richText || [];
        this.model.value.richText.push(this.parser.model);
        this.parser = undefined;
        this.currentNode = undefined;
        return true;

      default:
        if (this.parser) {
          this.parser.parseClose(name);
          return true;
        }
        return false;
    }
  }

  reconcile(model, options) {
    const style = model.styleId && options.styles && options.styles.getStyleModel(model.styleId);
    if (style) {
      model.style = style;
    }
    if (model.styleId !== undefined) {
      model.styleId = undefined;
    }

    switch (model.type) {
      case Enums.ValueType.String:
        if (typeof model.value === 'number') {
          if (options.sharedStrings) {
            model.value = options.sharedStrings.getString(model.value);
          }
        }
        if (model.value.richText) {
          model.type = Enums.ValueType.RichText;
        }
        break;

      case Enums.ValueType.Number:
        if (style && utils.isDateFmt(style.numFmt)) {
          model.type = Enums.ValueType.Date;
          model.value = utils.excelToDate(model.value, options.date1904);
        }
        break;

      case Enums.ValueType.Formula:
        if (model.result !== undefined && style && utils.isDateFmt(style.numFmt)) {
          model.result = utils.excelToDate(model.result, options.date1904);
        }
        if (model.shareType === 'shared') {
          if (model.ref) {
            // master
            options.formulae[model.si] = model.address;
          } else {
            // slave
            model.sharedFormula = options.formulae[model.si];
            delete model.shareType;
          }
          delete model.si;
        }
        break;

      default:
        break;
    }

    // look for hyperlink
    const hyperlink = options.hyperlinkMap[model.address];
    if (hyperlink) {
      if (model.type === Enums.ValueType.Formula) {
        model.text = model.result;
        model.result = undefined;
      } else {
        model.text = model.value;
        model.value = undefined;
      }
      model.type = Enums.ValueType.Hyperlink;
      model.hyperlink = hyperlink;
    }

    const comment = options.commentsMap && options.commentsMap[model.address];
    if (comment) {
      model.comment = comment;
    }
  }
}

module.exports = CellXform;
