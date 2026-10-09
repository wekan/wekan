const _ = require('../../../utils/under-dash');

const colCache = require('../../../utils/col-cache');
const XmlStream = require('../../../utils/xml-stream');

const RelType = require('../../rel-type');

const Merges = require('./merges');

const BaseXform = require('../base-xform');
const ListXform = require('../list-xform');
const RowXform = require('./row-xform');
const ColXform = require('./col-xform');
const DimensionXform = require('./dimension-xform');
const HyperlinkXform = require('./hyperlink-xform');
const MergeCellXform = require('./merge-cell-xform');
const DataValidationsXform = require('./data-validations-xform');
const SheetPropertiesXform = require('./sheet-properties-xform');
const SheetFormatPropertiesXform = require('./sheet-format-properties-xform');
const SheetViewXform = require('./sheet-view-xform');
const SheetProtectionXform = require('./sheet-protection-xform');
const PageMarginsXform = require('./page-margins-xform');
const PageSetupXform = require('./page-setup-xform');
const PrintOptionsXform = require('./print-options-xform');
const AutoFilterXform = require('./auto-filter-xform');
const PictureXform = require('./picture-xform');
const DrawingXform = require('./drawing-xform');
const TablePartXform = require('./table-part-xform');
const RowBreaksXform = require('./row-breaks-xform');
const HeaderFooterXform = require('./header-footer-xform');
const ConditionalFormattingsXform = require('./cf/conditional-formattings-xform');
const ExtListXform = require('./ext-lst-xform');

const mergeRule = (rule, extRule) => {
  Object.keys(extRule).forEach(key => {
    const value = rule[key];
    const extValue = extRule[key];
    if (value === undefined && extValue !== undefined) {
      rule[key] = extValue;
    }
  });
};

const mergeConditionalFormattings = (model, extModel) => {
  // conditional formattings are rendered in worksheet.conditionalFormatting and also in
  // worksheet.extLst.ext.x14:conditionalFormattings
  // some (e.g. dataBar) are even spread across both!
  if (!extModel || !extModel.length) {
    return model;
  }
  if (!model || !model.length) {
    return extModel;
  }

  // index model rules by x14Id
  const cfMap = {};
  const ruleMap = {};
  model.forEach(cf => {
    cfMap[cf.ref] = cf;
    cf.rules.forEach(rule => {
      const {x14Id} = rule;
      if (x14Id) {
        ruleMap[x14Id] = rule;
      }
    });
  });

  extModel.forEach(extCf => {
    extCf.rules.forEach(extRule => {
      const rule = ruleMap[extRule.x14Id];
      if (rule) {
        // merge with matching rule
        mergeRule(rule, extRule);
      } else if (cfMap[extCf.ref]) {
        // reuse existing cf ref
        cfMap[extCf.ref].rules.push(extRule);
      } else {
        // create new cf
        model.push({
          ref: extCf.ref,
          rules: [extRule],
        });
      }
    });
  });

  // need to cope with rules in extModel that don't exist in model
  return model;
};

class WorkSheetXform extends BaseXform {
  constructor(options) {
    super();

    const {maxRows, maxCols, ignoreNodes} = options || {};

    this.ignoreNodes = ignoreNodes || [];

    this.map = {
      sheetPr: new SheetPropertiesXform(),
      dimension: new DimensionXform(),
      sheetViews: new ListXform({
        tag: 'sheetViews',
        count: false,
        childXform: new SheetViewXform(),
      }),
      sheetFormatPr: new SheetFormatPropertiesXform(),
      cols: new ListXform({tag: 'cols', count: false, childXform: new ColXform()}),
      sheetData: new ListXform({
        tag: 'sheetData',
        count: false,
        empty: true,
        childXform: new RowXform({maxItems: maxCols}),
        maxItems: maxRows,
      }),
      autoFilter: new AutoFilterXform(),
      mergeCells: new ListXform({tag: 'mergeCells', count: true, childXform: new MergeCellXform()}),
      rowBreaks: new RowBreaksXform(),
      hyperlinks: new ListXform({
        tag: 'hyperlinks',
        count: false,
        childXform: new HyperlinkXform(),
      }),
      pageMargins: new PageMarginsXform(),
      dataValidations: new DataValidationsXform(),
      pageSetup: new PageSetupXform(),
      headerFooter: new HeaderFooterXform(),
      printOptions: new PrintOptionsXform(),
      picture: new PictureXform(),
      drawing: new DrawingXform(),
      sheetProtection: new SheetProtectionXform(),
      tableParts: new ListXform({tag: 'tableParts', count: true, childXform: new TablePartXform()}),
      conditionalFormatting: new ConditionalFormattingsXform(),
      extLst: new ExtListXform(),
    };
  }

  prepare(model, options) {
    options.merges = new Merges();
    model.hyperlinks = options.hyperlinks = [];
    model.comments = options.comments = [];

    options.formulae = {};
    options.siFormulae = 0;
    this.map.cols.prepare(model.cols, options);
    this.map.sheetData.prepare(model.rows, options);
    this.map.conditionalFormatting.prepare(model.conditionalFormattings, options);

    model.mergeCells = options.merges.mergeCells;

    // prepare relationships
    const rels = (model.rels = []);

    function nextRid(r) {
      return `rId${r.length + 1}`;
    }

    model.hyperlinks.forEach(hyperlink => {
      const rId = nextRid(rels);
      hyperlink.rId = rId;
      rels.push({
        Id: rId,
        Type: RelType.Hyperlink,
        Target: hyperlink.target,
        TargetMode: 'External',
      });
    });

    // prepare comment relationships
    if (model.comments.length > 0) {
      const comment = {
        Id: nextRid(rels),
        Type: RelType.Comments,
        Target: `../comments${model.id}.xml`,
      };
      rels.push(comment);
      const vmlDrawing = {
        Id: nextRid(rels),
        Type: RelType.VmlDrawing,
        Target: `../drawings/vmlDrawing${model.id}.vml`,
      };
      rels.push(vmlDrawing);

      model.comments.forEach(item => {
        item.refAddress = colCache.decodeAddress(item.ref);
      });

      options.commentRefs.push({
        commentName: `comments${model.id}`,
        vmlDrawing: `vmlDrawing${model.id}`,
      });
    }

    const drawingRelsHash = [];
    let bookImage;
    model.media.forEach(medium => {
      if (medium.type === 'background') {
        const rId = nextRid(rels);
        bookImage = options.media[medium.imageId];
        rels.push({
          Id: rId,
          Type: RelType.Image,
          Target: `../media/${bookImage.name}.${bookImage.extension}`,
        });
        model.background = {
          rId,
        };
        model.image = options.media[medium.imageId];
      } else if (medium.type === 'image') {
        let {drawing} = model;
        bookImage = options.media[medium.imageId];
        if (!drawing) {
          drawing = model.drawing = {
            rId: nextRid(rels),
            name: `drawing${++options.drawingsCount}`,
            anchors: [],
            rels: [],
          };
          options.drawings.push(drawing);
          rels.push({
            Id: drawing.rId,
            Type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing',
            Target: `../drawings/${drawing.name}.xml`,
          });
        }
        let rIdImage =
          this.preImageId === medium.imageId ? drawingRelsHash[medium.imageId] : drawingRelsHash[drawing.rels.length];
        if (!rIdImage) {
          rIdImage = nextRid(drawing.rels);
          drawingRelsHash[drawing.rels.length] = rIdImage;
          drawing.rels.push({
            Id: rIdImage,
            Type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image',
            Target: `../media/${bookImage.name}.${bookImage.extension}`,
          });
        }

        const anchor = {
          picture: {
            rId: rIdImage,
          },
          range: medium.range,
        };
        if (medium.hyperlinks && medium.hyperlinks.hyperlink) {
          const rIdHyperLink = nextRid(drawing.rels);
          drawingRelsHash[drawing.rels.length] = rIdHyperLink;
          anchor.picture.hyperlinks = {
            tooltip: medium.hyperlinks.tooltip,
            rId: rIdHyperLink,
          };
          drawing.rels.push({
            Id: rIdHyperLink,
            Type: RelType.Hyperlink,
            Target: medium.hyperlinks.hyperlink,
            TargetMode: 'External',
          });
        }
        this.preImageId = medium.imageId;
        drawing.anchors.push(anchor);
      }
    });

    // prepare tables
    model.tables.forEach(table => {
      // relationships
      const rId = nextRid(rels);
      table.rId = rId;
      rels.push({
        Id: rId,
        Type: RelType.Table,
        Target: `../tables/${table.target}`,
      });

      // dynamic styles
      table.columns.forEach(column => {
        const {style} = column;
        if (style) {
          column.dxfId = options.styles.addDxfStyle(style);
        }
      });
    });

    // prepare pivot tables
    if ((model.pivotTables || []).length) {
      rels.push({
        Id: nextRid(rels),
        Type: RelType.PivotTable,
        Target: '../pivotTables/pivotTable1.xml',
      });
    }

    // prepare ext items
    this.map.extLst.prepare(model, options);
  }

  render(xmlStream, model) {
    xmlStream.openXml(XmlStream.StdDocAttributes);
    xmlStream.openNode('worksheet', WorkSheetXform.WORKSHEET_ATTRIBUTES);

    const sheetFormatPropertiesModel = model.properties
      ? {
          defaultRowHeight: model.properties.defaultRowHeight,
          dyDescent: model.properties.dyDescent,
          outlineLevelCol: model.properties.outlineLevelCol,
          outlineLevelRow: model.properties.outlineLevelRow,
        }
      : undefined;
    if (model.properties && model.properties.defaultColWidth) {
      sheetFormatPropertiesModel.defaultColWidth = model.properties.defaultColWidth;
    }
    const sheetPropertiesModel = {
      outlineProperties: model.properties && model.properties.outlineProperties,
      tabColor: model.properties && model.properties.tabColor,
      pageSetup:
        model.pageSetup && model.pageSetup.fitToPage
          ? {
              fitToPage: model.pageSetup.fitToPage,
            }
          : undefined,
    };
    const pageMarginsModel = model.pageSetup && model.pageSetup.margins;
    const printOptionsModel = {
      showRowColHeaders: model.pageSetup && model.pageSetup.showRowColHeaders,
      showGridLines: model.pageSetup && model.pageSetup.showGridLines,
      horizontalCentered: model.pageSetup && model.pageSetup.horizontalCentered,
      verticalCentered: model.pageSetup && model.pageSetup.verticalCentered,
    };
    const sheetProtectionModel = model.sheetProtection;

    this.map.sheetPr.render(xmlStream, sheetPropertiesModel);
    this.map.dimension.render(xmlStream, model.dimensions);
    this.map.sheetViews.render(xmlStream, model.views);
    this.map.sheetFormatPr.render(xmlStream, sheetFormatPropertiesModel);
    this.map.cols.render(xmlStream, model.cols);
    this.map.sheetData.render(xmlStream, model.rows);
    this.map.sheetProtection.render(xmlStream, sheetProtectionModel); // Note: must be after sheetData and before autoFilter
    this.map.autoFilter.render(xmlStream, model.autoFilter);
    this.map.mergeCells.render(xmlStream, model.mergeCells);
    this.map.conditionalFormatting.render(xmlStream, model.conditionalFormattings); // Note: must be before dataValidations
    this.map.dataValidations.render(xmlStream, model.dataValidations);

    // For some reason hyperlinks have to be after the data validations
    this.map.hyperlinks.render(xmlStream, model.hyperlinks);

    this.map.printOptions.render(xmlStream, printOptionsModel); // Note: must be before pageMargins
    this.map.pageMargins.render(xmlStream, pageMarginsModel);
    this.map.pageSetup.render(xmlStream, model.pageSetup);
    this.map.headerFooter.render(xmlStream, model.headerFooter);
    this.map.rowBreaks.render(xmlStream, model.rowBreaks);
    this.map.drawing.render(xmlStream, model.drawing); // Note: must be after rowBreaks
    this.map.picture.render(xmlStream, model.background); // Note: must be after drawing
    this.map.tableParts.render(xmlStream, model.tables);

    this.map.extLst.render(xmlStream, model);

    if (model.rels) {
      // add a <legacyDrawing /> node for each comment
      model.rels.forEach(rel => {
        if (rel.Type === RelType.VmlDrawing) {
          xmlStream.leafNode('legacyDrawing', {'r:id': rel.Id});
        }
      });
    }

    xmlStream.closeNode();
  }

  parseOpen(node) {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }

    if (node.name === 'worksheet') {
      _.each(this.map, xform => {
        xform.reset();
      });
      return true;
    }

    if (this.map[node.name] && !this.ignoreNodes.includes(node.name)) {
      this.parser = this.map[node.name];
      this.parser.parseOpen(node);
    }
    return true;
  }

  parseText(text) {
    if (this.parser) {
      this.parser.parseText(text);
    }
  }

  parseClose(name) {
    if (this.parser) {
      if (!this.parser.parseClose(name)) {
        this.parser = undefined;
      }
      return true;
    }
    switch (name) {
      case 'worksheet': {
        const properties = this.map.sheetFormatPr.model || {};
        if (this.map.sheetPr.model && this.map.sheetPr.model.tabColor) {
          properties.tabColor = this.map.sheetPr.model.tabColor;
        }
        if (this.map.sheetPr.model && this.map.sheetPr.model.outlineProperties) {
          properties.outlineProperties = this.map.sheetPr.model.outlineProperties;
        }
        const sheetProperties = {
          fitToPage:
            (this.map.sheetPr.model &&
              this.map.sheetPr.model.pageSetup &&
              this.map.sheetPr.model.pageSetup.fitToPage) ||
            false,
          margins: this.map.pageMargins.model,
        };
        const pageSetup = Object.assign(sheetProperties, this.map.pageSetup.model, this.map.printOptions.model);
        const conditionalFormattings = mergeConditionalFormattings(
          this.map.conditionalFormatting.model,
          this.map.extLst.model && this.map.extLst.model['x14:conditionalFormattings']
        );
        this.model = {
          dimensions: this.map.dimension.model,
          cols: this.map.cols.model,
          rows: this.map.sheetData.model,
          mergeCells: this.map.mergeCells.model,
          hyperlinks: this.map.hyperlinks.model,
          dataValidations: this.map.dataValidations.model,
          properties,
          views: this.map.sheetViews.model,
          pageSetup,
          headerFooter: this.map.headerFooter.model,
          background: this.map.picture.model,
          drawing: this.map.drawing.model,
          tables: this.map.tableParts.model,
          conditionalFormattings,
        };

        if (this.map.autoFilter.model) {
          this.model.autoFilter = this.map.autoFilter.model;
        }
        if (this.map.sheetProtection.model) {
          this.model.sheetProtection = this.map.sheetProtection.model;
        }

        return false;
      }

      default:
        // not quite sure how we get here!
        return true;
    }
  }

  reconcile(model, options) {
    // options.merges = new Merges();
    // options.merges.reconcile(model.mergeCells, model.rows);
    const rels = (model.relationships || []).reduce((h, rel) => {
      h[rel.Id] = rel;
      if (rel.Type === RelType.Comments) {
        model.comments = options.comments[rel.Target].comments;
      }
      if (rel.Type === RelType.VmlDrawing && model.comments && model.comments.length) {
        const vmlComment = options.vmlDrawings[rel.Target].comments;
        model.comments.forEach((comment, index) => {
          comment.note = Object.assign({}, comment.note, vmlComment[index]);
        });
      }
      return h;
    }, {});
    options.commentsMap = (model.comments || []).reduce((h, comment) => {
      if (comment.ref) {
        h[comment.ref] = comment;
      }
      return h;
    }, {});
    options.hyperlinkMap = (model.hyperlinks || []).reduce((h, hyperlink) => {
      if (hyperlink.rId) {
        h[hyperlink.address] = rels[hyperlink.rId].Target;
      }
      return h;
    }, {});
    options.formulae = {};

    // compact the rows and cells
    model.rows = (model.rows && model.rows.filter(Boolean)) || [];
    model.rows.forEach(row => {
      row.cells = (row.cells && row.cells.filter(Boolean)) || [];
    });

    this.map.cols.reconcile(model.cols, options);
    this.map.sheetData.reconcile(model.rows, options);
    this.map.conditionalFormatting.reconcile(model.conditionalFormattings, options);

    model.media = [];
    if (model.drawing) {
      const drawingRel = rels[model.drawing.rId];
      const match = drawingRel.Target.match(/\/drawings\/([a-zA-Z0-9]+)[.][a-zA-Z]{3,4}$/);
      if (match) {
        const drawingName = match[1];
        const drawing = options.drawings[drawingName];
        drawing.anchors.forEach(anchor => {
          if (anchor.medium) {
            const image = {
              type: 'image',
              imageId: anchor.medium.index,
              range: anchor.range,
              hyperlinks: anchor.picture.hyperlinks,
            };
            model.media.push(image);
          }
        });
      }
    }

    const backgroundRel = model.background && rels[model.background.rId];
    if (backgroundRel) {
      const target = backgroundRel.Target.split('/media/')[1];
      const imageId = options.mediaIndex && options.mediaIndex[target];
      if (imageId !== undefined) {
        model.media.push({
          type: 'background',
          imageId,
        });
      }
    }

    model.tables = (model.tables || []).map(tablePart => {
      const rel = rels[tablePart.rId];
      return options.tables[rel.Target];
    });

    delete model.relationships;
    delete model.hyperlinks;
    delete model.comments;
  }
}

WorkSheetXform.WORKSHEET_ATTRIBUTES = {
  xmlns: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
  'xmlns:r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
  'xmlns:mc': 'http://schemas.openxmlformats.org/markup-compatibility/2006',
  'mc:Ignorable': 'x14ac',
  'xmlns:x14ac': 'http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac',
};

module.exports = WorkSheetXform;
