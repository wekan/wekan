const fs = require('fs');
const JSZip = require('jszip');
const {PassThrough} = require('readable-stream');
const ZipStream = require('../utils/zip-stream');
const StreamBuf = require('../utils/stream-buf');

const utils = require('../utils/utils');
const XmlStream = require('../utils/xml-stream');
const {bufferToString} = require('../utils/browser-buffer-decode');

const StylesXform = require('./xform/style/styles-xform');

const CoreXform = require('./xform/core/core-xform');
const SharedStringsXform = require('./xform/strings/shared-strings-xform');
const RelationshipsXform = require('./xform/core/relationships-xform');
const ContentTypesXform = require('./xform/core/content-types-xform');
const AppXform = require('./xform/core/app-xform');
const WorkbookXform = require('./xform/book/workbook-xform');
const WorksheetXform = require('./xform/sheet/worksheet-xform');
const DrawingXform = require('./xform/drawing/drawing-xform');
const TableXform = require('./xform/table/table-xform');
const PivotCacheRecordsXform = require('./xform/pivot-table/pivot-cache-records-xform');
const PivotCacheDefinitionXform = require('./xform/pivot-table/pivot-cache-definition-xform');
const PivotTableXform = require('./xform/pivot-table/pivot-table-xform');
const CommentsXform = require('./xform/comment/comments-xform');
const VmlNotesXform = require('./xform/comment/vml-notes-xform');

const theme1Xml = require('./xml/theme1');

function fsReadFileAsync(filename, options) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, options, (error, data) => {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
}

class XLSX {
  constructor(workbook) {
    this.workbook = workbook;
  }

  // ===============================================================================
  // Workbook
  // =========================================================================
  // Read

  async readFile(filename, options) {
    if (!(await utils.fs.exists(filename))) {
      throw new Error(`File not found: ${filename}`);
    }
    const stream = fs.createReadStream(filename);
    try {
      const workbook = await this.read(stream, options);
      stream.close();
      return workbook;
    } catch (error) {
      stream.close();
      throw error;
    }
  }

  parseRels(stream) {
    const xform = new RelationshipsXform();
    return xform.parseStream(stream);
  }

  parseWorkbook(stream) {
    const xform = new WorkbookXform();
    return xform.parseStream(stream);
  }

  parseSharedStrings(stream) {
    const xform = new SharedStringsXform();
    return xform.parseStream(stream);
  }

  reconcile(model, options) {
    const workbookXform = new WorkbookXform();
    const worksheetXform = new WorksheetXform(options);
    const drawingXform = new DrawingXform();
    const tableXform = new TableXform();

    workbookXform.reconcile(model);

    // reconcile drawings with their rels
    const drawingOptions = {
      media: model.media,
      mediaIndex: model.mediaIndex,
    };
    Object.keys(model.drawings).forEach(name => {
      const drawing = model.drawings[name];
      const drawingRel = model.drawingRels[name];
      if (drawingRel) {
        drawingOptions.rels = drawingRel.reduce((o, rel) => {
          o[rel.Id] = rel;
          return o;
        }, {});
        (drawing.anchors || []).forEach(anchor => {
          const hyperlinks = anchor.picture && anchor.picture.hyperlinks;
          if (hyperlinks && drawingOptions.rels[hyperlinks.rId]) {
            hyperlinks.hyperlink = drawingOptions.rels[hyperlinks.rId].Target;
            delete hyperlinks.rId;
          }
        });
        drawingXform.reconcile(drawing, drawingOptions);
      }
    });

    // reconcile tables with the default styles
    const tableOptions = {
      styles: model.styles,
    };
    Object.values(model.tables).forEach(table => {
      tableXform.reconcile(table, tableOptions);
    });

    const sheetOptions = {
      styles: model.styles,
      sharedStrings: model.sharedStrings,
      media: model.media,
      mediaIndex: model.mediaIndex,
      date1904: model.properties && model.properties.date1904,
      drawings: model.drawings,
      comments: model.comments,
      tables: model.tables,
      vmlDrawings: model.vmlDrawings,
    };
    model.worksheets.forEach(worksheet => {
      worksheet.relationships = model.worksheetRels[worksheet.sheetNo];
      worksheetXform.reconcile(worksheet, sheetOptions);
    });

    // delete unnecessary parts
    delete model.worksheetHash;
    delete model.worksheetRels;
    delete model.globalRels;
    delete model.sharedStrings;
    delete model.workbookRels;
    delete model.sheetDefs;
    delete model.styles;
    delete model.mediaIndex;
    delete model.drawings;
    delete model.drawingRels;
    delete model.vmlDrawings;
  }

  async _processWorksheetEntry(stream, model, sheetNo, options, path) {
    const xform = new WorksheetXform(options);
    const worksheet = await xform.parseStream(stream);
    worksheet.sheetNo = sheetNo;
    model.worksheetHash[path] = worksheet;
    model.worksheets.push(worksheet);
  }

  async _processCommentEntry(stream, model, name) {
    const xform = new CommentsXform();
    const comments = await xform.parseStream(stream);
    model.comments[`../${name}.xml`] = comments;
  }

  async _processTableEntry(stream, model, name) {
    const xform = new TableXform();
    const table = await xform.parseStream(stream);
    model.tables[`../tables/${name}.xml`] = table;
  }

  async _processWorksheetRelsEntry(stream, model, sheetNo) {
    const xform = new RelationshipsXform();
    const relationships = await xform.parseStream(stream);
    model.worksheetRels[sheetNo] = relationships;
  }

  async _processMediaEntry(entry, model, filename) {
    const lastDot = filename.lastIndexOf('.');
    // if we can't determine extension, ignore it
    if (lastDot >= 1) {
      const extension = filename.substr(lastDot + 1);
      const name = filename.substr(0, lastDot);
      await new Promise((resolve, reject) => {
        const streamBuf = new StreamBuf();
        streamBuf.on('finish', () => {
          model.mediaIndex[filename] = model.media.length;
          model.mediaIndex[name] = model.media.length;
          const medium = {
            type: 'image',
            name,
            extension,
            buffer: streamBuf.toBuffer(),
          };
          model.media.push(medium);
          resolve();
        });
        entry.on('error', error => {
          reject(error);
        });
        entry.pipe(streamBuf);
      });
    }
  }

  async _processDrawingEntry(entry, model, name) {
    const xform = new DrawingXform();
    const drawing = await xform.parseStream(entry);
    model.drawings[name] = drawing;
  }

  async _processDrawingRelsEntry(entry, model, name) {
    const xform = new RelationshipsXform();
    const relationships = await xform.parseStream(entry);
    model.drawingRels[name] = relationships;
  }

  async _processVmlDrawingEntry(entry, model, name) {
    const xform = new VmlNotesXform();
    const vmlDrawing = await xform.parseStream(entry);
    model.vmlDrawings[`../drawings/${name}.vml`] = vmlDrawing;
  }

  async _processThemeEntry(entry, model, name) {
    await new Promise((resolve, reject) => {
      // TODO: stream entry into buffer and store the xml in the model.themes[]
      const stream = new StreamBuf();
      entry.on('error', reject);
      stream.on('error', reject);
      stream.on('finish', () => {
        model.themes[name] = stream.read().toString();
        resolve();
      });
      entry.pipe(stream);
    });
  }

  /**
   * @deprecated since version 4.0. You should use `#read` instead. Please follow upgrade instruction: https://github.com/exceljs/exceljs/blob/master/UPGRADE-4.0.md
   */
  createInputStream() {
    throw new Error(
      '`XLSX#createInputStream` is deprecated. You should use `XLSX#read` instead. This method will be removed in version 5.0. Please follow upgrade instruction: https://github.com/exceljs/exceljs/blob/master/UPGRADE-4.0.md'
    );
  }

  async read(stream, options) {
    // TODO: Remove once node v8 is deprecated
    // Detect and upgrade old streams
    if (!stream[Symbol.asyncIterator] && stream.pipe) {
      stream = stream.pipe(new PassThrough());
    }
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return this.load(Buffer.concat(chunks), options);
  }

  async load(data, options) {
    let buffer;
    if (options && options.base64) {
      buffer = Buffer.from(data.toString(), 'base64');
    } else {
      buffer = data;
    }

    const model = {
      worksheets: [],
      worksheetHash: {},
      worksheetRels: [],
      themes: {},
      media: [],
      mediaIndex: {},
      drawings: {},
      drawingRels: {},
      comments: {},
      tables: {},
      vmlDrawings: {},
    };

    const zip = await JSZip.loadAsync(buffer);
    for (const entry of Object.values(zip.files)) {
      /* eslint-disable no-await-in-loop */
      if (!entry.dir) {
        let entryName = entry.name;
        if (entryName[0] === '/') {
          entryName = entryName.substr(1);
        }
        let stream;
        if (
          entryName.match(/xl\/media\//) ||
          // themes are not parsed as stream
          entryName.match(/xl\/theme\/([a-zA-Z0-9]+)[.]xml/)
        ) {
          stream = new PassThrough();
          stream.write(await entry.async('nodebuffer'));
        } else {
          // use object mode to avoid buffer-string convention
          stream = new PassThrough({
            writableObjectMode: true,
            readableObjectMode: true,
          });
          let content;
          // https://www.npmjs.com/package/process
          if (process.browser) {
            // running in browser, use TextDecoder if possible
            content = bufferToString(await entry.async('nodebuffer'));
          } else {
            // running in node.js
            content = await entry.async('string');
          }
          const chunkSize = 16 * 1024;
          for (let i = 0; i < content.length; i += chunkSize) {
            stream.write(content.substring(i, i + chunkSize));
          }
        }
        stream.end();
        switch (entryName) {
          case '_rels/.rels':
            model.globalRels = await this.parseRels(stream);
            break;

          case 'xl/workbook.xml': {
            const workbook = await this.parseWorkbook(stream);
            if (workbook) {
              model.sheets = workbook.sheets;
              model.definedNames = workbook.definedNames;
              model.views = workbook.views;
              model.properties = workbook.properties;
              model.calcProperties = workbook.calcProperties;
            }
            break;
          }

          case 'xl/_rels/workbook.xml.rels':
            model.workbookRels = await this.parseRels(stream);
            break;

          case 'xl/sharedStrings.xml':
            model.sharedStrings = new SharedStringsXform();
            await model.sharedStrings.parseStream(stream);
            break;

          case 'xl/styles.xml':
            model.styles = new StylesXform();
            await model.styles.parseStream(stream);
            break;

          case 'docProps/app.xml': {
            const appXform = new AppXform();
            const appProperties = await appXform.parseStream(stream);
            if (appProperties) {
              model.company = appProperties.company;
              model.manager = appProperties.manager;
            }
            break;
          }

          case 'docProps/core.xml': {
            const coreXform = new CoreXform();
            const coreProperties = await coreXform.parseStream(stream);
            if (coreProperties) {
              Object.assign(model, coreProperties);
            }
            break;
          }

          default: {
            let match = entryName.match(/xl\/worksheets\/sheet(\d+)[.]xml/);
            if (match) {
              await this._processWorksheetEntry(stream, model, match[1], options, entryName);
              break;
            }
            match = entryName.match(/xl\/worksheets\/_rels\/sheet(\d+)[.]xml.rels/);
            if (match) {
              await this._processWorksheetRelsEntry(stream, model, match[1]);
              break;
            }
            match = entryName.match(/xl\/theme\/([a-zA-Z0-9]+)[.]xml/);
            if (match) {
              await this._processThemeEntry(stream, model, match[1]);
              break;
            }
            match = entryName.match(/xl\/media\/([a-zA-Z0-9]+[.][a-zA-Z0-9]{3,4})$/);
            if (match) {
              await this._processMediaEntry(stream, model, match[1]);
              break;
            }
            match = entryName.match(/xl\/drawings\/([a-zA-Z0-9]+)[.]xml/);
            if (match) {
              await this._processDrawingEntry(stream, model, match[1]);
              break;
            }
            match = entryName.match(/xl\/(comments\d+)[.]xml/);
            if (match) {
              await this._processCommentEntry(stream, model, match[1]);
              break;
            }
            match = entryName.match(/xl\/tables\/(table\d+)[.]xml/);
            if (match) {
              await this._processTableEntry(stream, model, match[1]);
              break;
            }
            match = entryName.match(/xl\/drawings\/_rels\/([a-zA-Z0-9]+)[.]xml[.]rels/);
            if (match) {
              await this._processDrawingRelsEntry(stream, model, match[1]);
              break;
            }
            match = entryName.match(/xl\/drawings\/(vmlDrawing\d+)[.]vml/);
            if (match) {
              await this._processVmlDrawingEntry(stream, model, match[1]);
              break;
            }
          }
        }
      }
    }

    this.reconcile(model, options);

    // apply model
    this.workbook.model = model;
    return this.workbook;
  }

  // =========================================================================
  // Write

  async addMedia(zip, model) {
    await Promise.all(
      model.media.map(async medium => {
        if (medium.type === 'image') {
          const filename = `xl/media/${medium.name}.${medium.extension}`;
          if (medium.filename) {
            const data = await fsReadFileAsync(medium.filename);
            return zip.append(data, {name: filename});
          }
          if (medium.buffer) {
            return zip.append(medium.buffer, {name: filename});
          }
          if (medium.base64) {
            const dataimg64 = medium.base64;
            const content = dataimg64.substring(dataimg64.indexOf(',') + 1);
            return zip.append(content, {name: filename, base64: true});
          }
        }
        throw new Error('Unsupported media');
      })
    );
  }

  addDrawings(zip, model) {
    const drawingXform = new DrawingXform();
    const relsXform = new RelationshipsXform();

    model.worksheets.forEach(worksheet => {
      const {drawing} = worksheet;
      if (drawing) {
        drawingXform.prepare(drawing, {});
        let xml = drawingXform.toXml(drawing);
        zip.append(xml, {name: `xl/drawings/${drawing.name}.xml`});

        xml = relsXform.toXml(drawing.rels);
        zip.append(xml, {name: `xl/drawings/_rels/${drawing.name}.xml.rels`});
      }
    });
  }

  addTables(zip, model) {
    const tableXform = new TableXform();

    model.worksheets.forEach(worksheet => {
      const {tables} = worksheet;
      tables.forEach(table => {
        tableXform.prepare(table, {});
        const tableXml = tableXform.toXml(table);
        zip.append(tableXml, {name: `xl/tables/${table.target}`});
      });
    });
  }

  addPivotTables(zip, model) {
    if (!model.pivotTables.length) return;

    const pivotTable = model.pivotTables[0];

    const pivotCacheRecordsXform = new PivotCacheRecordsXform();
    const pivotCacheDefinitionXform = new PivotCacheDefinitionXform();
    const pivotTableXform = new PivotTableXform();
    const relsXform = new RelationshipsXform();

    // pivot cache records
    // --------------------------------------------------
    // copy of the source data.
    //
    // Note: cells in the columns of the source data which are part
    // of the "rows" or "columns" of the pivot table configuration are
    // replaced by references to their __cache field__ identifiers.
    // See "pivot cache definition" below.

    let xml = pivotCacheRecordsXform.toXml(pivotTable);
    zip.append(xml, {name: 'xl/pivotCache/pivotCacheRecords1.xml'});

    // pivot cache definition
    // --------------------------------------------------
    // cache source (source data):
    //    ref="A1:E7" on sheet="Sheet1"
    // cache fields:
    //    - 0: "A" (a1, a2, a3)
    //    - 1: "B" (b1, b2)
    //    - ...

    xml = pivotCacheDefinitionXform.toXml(pivotTable);
    zip.append(xml, {name: 'xl/pivotCache/pivotCacheDefinition1.xml'});

    xml = relsXform.toXml([
      {
        Id: 'rId1',
        Type: XLSX.RelType.PivotCacheRecords,
        Target: 'pivotCacheRecords1.xml',
      },
    ]);
    zip.append(xml, {name: 'xl/pivotCache/_rels/pivotCacheDefinition1.xml.rels'});

    // pivot tables (on destination worksheet)
    // --------------------------------------------------
    // location: ref="A3:E15"
    // pivotFields
    // rowFields and rowItems
    // colFields and colItems
    // dataFields
    // pivotTableStyleInfo

    xml = pivotTableXform.toXml(pivotTable);
    zip.append(xml, {name: 'xl/pivotTables/pivotTable1.xml'});

    xml = relsXform.toXml([
      {
        Id: 'rId1',
        Type: XLSX.RelType.PivotCacheDefinition,
        Target: '../pivotCache/pivotCacheDefinition1.xml',
      },
    ]);
    zip.append(xml, {name: 'xl/pivotTables/_rels/pivotTable1.xml.rels'});
  }

  async addContentTypes(zip, model) {
    const xform = new ContentTypesXform();
    const xml = xform.toXml(model);
    zip.append(xml, {name: '[Content_Types].xml'});
  }

  async addApp(zip, model) {
    const xform = new AppXform();
    const xml = xform.toXml(model);
    zip.append(xml, {name: 'docProps/app.xml'});
  }

  async addCore(zip, model) {
    const coreXform = new CoreXform();
    zip.append(coreXform.toXml(model), {name: 'docProps/core.xml'});
  }

  async addThemes(zip, model) {
    const themes = model.themes || {theme1: theme1Xml};
    Object.keys(themes).forEach(name => {
      const xml = themes[name];
      const path = `xl/theme/${name}.xml`;
      zip.append(xml, {name: path});
    });
  }

  async addOfficeRels(zip) {
    const xform = new RelationshipsXform();
    const xml = xform.toXml([
      {Id: 'rId1', Type: XLSX.RelType.OfficeDocument, Target: 'xl/workbook.xml'},
      {Id: 'rId2', Type: XLSX.RelType.CoreProperties, Target: 'docProps/core.xml'},
      {Id: 'rId3', Type: XLSX.RelType.ExtenderProperties, Target: 'docProps/app.xml'},
    ]);
    zip.append(xml, {name: '_rels/.rels'});
  }

  async addWorkbookRels(zip, model) {
    let count = 1;
    const relationships = [
      {Id: `rId${count++}`, Type: XLSX.RelType.Styles, Target: 'styles.xml'},
      {Id: `rId${count++}`, Type: XLSX.RelType.Theme, Target: 'theme/theme1.xml'},
    ];
    if (model.sharedStrings.count) {
      relationships.push({
        Id: `rId${count++}`,
        Type: XLSX.RelType.SharedStrings,
        Target: 'sharedStrings.xml',
      });
    }
    if ((model.pivotTables || []).length) {
      const pivotTable = model.pivotTables[0];
      pivotTable.rId = `rId${count++}`;
      relationships.push({
        Id: pivotTable.rId,
        Type: XLSX.RelType.PivotCacheDefinition,
        Target: 'pivotCache/pivotCacheDefinition1.xml',
      });
    }
    model.worksheets.forEach(worksheet => {
      worksheet.rId = `rId${count++}`;
      relationships.push({
        Id: worksheet.rId,
        Type: XLSX.RelType.Worksheet,
        Target: `worksheets/sheet${worksheet.id}.xml`,
      });
    });
    const xform = new RelationshipsXform();
    const xml = xform.toXml(relationships);
    zip.append(xml, {name: 'xl/_rels/workbook.xml.rels'});
  }

  async addSharedStrings(zip, model) {
    if (model.sharedStrings && model.sharedStrings.count) {
      zip.append(model.sharedStrings.xml, {name: 'xl/sharedStrings.xml'});
    }
  }

  async addStyles(zip, model) {
    const {xml} = model.styles;
    if (xml) {
      zip.append(xml, {name: 'xl/styles.xml'});
    }
  }

  async addWorkbook(zip, model) {
    const xform = new WorkbookXform();
    zip.append(xform.toXml(model), {name: 'xl/workbook.xml'});
  }

  async addWorksheets(zip, model) {
    // preparation phase
    const worksheetXform = new WorksheetXform();
    const relationshipsXform = new RelationshipsXform();
    const commentsXform = new CommentsXform();
    const vmlNotesXform = new VmlNotesXform();

    // write sheets
    model.worksheets.forEach(worksheet => {
      let xmlStream = new XmlStream();
      worksheetXform.render(xmlStream, worksheet);
      zip.append(xmlStream.xml, {name: `xl/worksheets/sheet${worksheet.id}.xml`});

      if (worksheet.rels && worksheet.rels.length) {
        xmlStream = new XmlStream();
        relationshipsXform.render(xmlStream, worksheet.rels);
        zip.append(xmlStream.xml, {name: `xl/worksheets/_rels/sheet${worksheet.id}.xml.rels`});
      }

      if (worksheet.comments.length > 0) {
        xmlStream = new XmlStream();
        commentsXform.render(xmlStream, worksheet);
        zip.append(xmlStream.xml, {name: `xl/comments${worksheet.id}.xml`});

        xmlStream = new XmlStream();
        vmlNotesXform.render(xmlStream, worksheet);
        zip.append(xmlStream.xml, {name: `xl/drawings/vmlDrawing${worksheet.id}.vml`});
      }
    });
  }

  _finalize(zip) {
    return new Promise((resolve, reject) => {
      zip.on('finish', () => {
        resolve(this);
      });
      zip.on('error', reject);
      zip.finalize();
    });
  }

  prepareModel(model, options) {
    // ensure following properties have sane values
    model.creator = model.creator || 'ExcelJS';
    model.lastModifiedBy = model.lastModifiedBy || 'ExcelJS';
    model.created = model.created || new Date();
    model.modified = model.modified || new Date();

    model.useSharedStrings = options.useSharedStrings !== undefined ? options.useSharedStrings : true;
    model.useStyles = options.useStyles !== undefined ? options.useStyles : true;

    // Manage the shared strings
    model.sharedStrings = new SharedStringsXform();

    // add a style manager to handle cell formats, fonts, etc.
    model.styles = model.useStyles ? new StylesXform(true) : new StylesXform.Mock();

    // prepare all of the things before the render
    const workbookXform = new WorkbookXform();
    const worksheetXform = new WorksheetXform();

    workbookXform.prepare(model);

    const worksheetOptions = {
      sharedStrings: model.sharedStrings,
      styles: model.styles,
      date1904: model.properties.date1904,
      drawingsCount: 0,
      media: model.media,
    };
    worksheetOptions.drawings = model.drawings = [];
    worksheetOptions.commentRefs = model.commentRefs = [];
    let tableCount = 0;
    model.tables = [];
    model.worksheets.forEach(worksheet => {
      // assign unique filenames to tables
      worksheet.tables.forEach(table => {
        tableCount++;
        table.target = `table${tableCount}.xml`;
        table.id = tableCount;
        model.tables.push(table);
      });

      worksheetXform.prepare(worksheet, worksheetOptions);
    });

    // TODO: workbook drawing list
  }

  async write(stream, options) {
    options = options || {};
    const {model} = this.workbook;
    const zip = new ZipStream.ZipWriter(options.zip);
    zip.pipe(stream);

    this.prepareModel(model, options);

    // render
    await this.addContentTypes(zip, model);
    await this.addOfficeRels(zip, model);
    await this.addWorkbookRels(zip, model);
    await this.addWorksheets(zip, model);
    await this.addSharedStrings(zip, model); // always after worksheets
    await this.addDrawings(zip, model);
    await this.addTables(zip, model);
    await this.addPivotTables(zip, model);
    await Promise.all([this.addThemes(zip, model), this.addStyles(zip, model)]);
    await this.addMedia(zip, model);
    await Promise.all([this.addApp(zip, model), this.addCore(zip, model)]);
    await this.addWorkbook(zip, model);
    return this._finalize(zip);
  }

  writeFile(filename, options) {
    const stream = fs.createWriteStream(filename);

    return new Promise((resolve, reject) => {
      stream.on('finish', () => {
        resolve();
      });
      stream.on('error', error => {
        reject(error);
      });

      this.write(stream, options)
        .then(() => {
          stream.end();
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  async writeBuffer(options) {
    const stream = new StreamBuf();
    await this.write(stream, options);
    return stream.read();
  }
}

XLSX.RelType = require('./rel-type');

module.exports = XLSX;
