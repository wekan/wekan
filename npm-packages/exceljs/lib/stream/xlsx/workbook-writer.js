const fs = require('fs');
const archiver = require('archiver');

// archiver 7 and older export a factory, archiver('zip', options); archiver 8
// exports classes, { ZipArchive }, and requiring it from CommonJS gives that
// namespace object. Calling it as the factory threw "Archiver is not a
// function", so the streaming writer could not be used with archiver 8.
function createZipArchive(options) {
  if (typeof archiver === 'function') return archiver('zip', options);
  const ZipArchive = archiver.ZipArchive || (archiver.default && archiver.default.ZipArchive);
  if (typeof ZipArchive !== 'function') throw new Error('archiver: no zip archive found');
  return new ZipArchive(options);
}

const StreamBuf = require('../../utils/stream-buf');

const RelType = require('../../xlsx/rel-type');
const StylesXform = require('../../xlsx/xform/style/styles-xform');
const SharedStrings = require('../../utils/shared-strings');
const DefinedNames = require('../../doc/defined-names');

const CoreXform = require('../../xlsx/xform/core/core-xform');
const RelationshipsXform = require('../../xlsx/xform/core/relationships-xform');
const ContentTypesXform = require('../../xlsx/xform/core/content-types-xform');
const AppXform = require('../../xlsx/xform/core/app-xform');
const WorkbookXform = require('../../xlsx/xform/book/workbook-xform');
const SharedStringsXform = require('../../xlsx/xform/strings/shared-strings-xform');

const WorksheetWriter = require('./worksheet-writer');

const theme1Xml = require('../../xlsx/xml/theme1.js');

class WorkbookWriter {
  constructor(options) {
    options = options || {};

    this.created = options.created || new Date();
    this.modified = options.modified || this.created;
    this.creator = options.creator || 'ExcelJS';
    this.lastModifiedBy = options.lastModifiedBy || 'ExcelJS';
    this.lastPrinted = options.lastPrinted;

    // using shared strings creates a smaller xlsx file but may use more memory
    this.useSharedStrings = options.useSharedStrings || false;
    this.sharedStrings = new SharedStrings();

    // style manager
    this.styles = options.useStyles ? new StylesXform(true) : new StylesXform.Mock(true);

    // defined names
    this._definedNames = new DefinedNames();

    this._worksheets = [];
    this.views = [];

    this.zipOptions = options.zip;

    this.media = [];
    this.drawings = [];
    this.commentRefs = [];

    this.zip = createZipArchive(this.zipOptions);
    if (options.stream) {
      this.stream = options.stream;
    } else if (options.filename) {
      this.stream = fs.createWriteStream(options.filename);
    } else {
      this.stream = new StreamBuf();
    }
    this.zip.pipe(this.stream);

    // these bits can be added right now
    this.promise = Promise.all([this.addThemes(), this.addOfficeRels()]);
  }

  get definedNames() {
    return this._definedNames;
  }

  _openStream(path) {
    const stream = new StreamBuf({bufSize: 65536, batch: true});
    this.zip.append(stream, {name: path});
    stream.on('finish', () => {
      stream.emit('zipped');
    });
    return stream;
  }

  _commitWorksheets() {
    const commitWorksheet = function(worksheet) {
      if (!worksheet.committed) {
        return new Promise(resolve => {
          worksheet.stream.on('zipped', () => {
            resolve();
          });
          worksheet.commit();
        });
      }
      return Promise.resolve();
    };
    // if there are any uncommitted worksheets, commit them now and wait
    const promises = this._worksheets.map(commitWorksheet);
    if (promises.length) {
      return Promise.all(promises);
    }
    return Promise.resolve();
  }

  async commit() {
    // commit all worksheets, then add suplimentary files
    await this.promise;
    // The images are queued behind the worksheets, which are streams still
    // open until they commit, so the media are not waited for until then.
    const media = this.addMedia();
    media.catch(() => {});
    await this._commitWorksheets();
    await media;
    await Promise.all([
      this.addContentTypes(),
      this.addApp(),
      this.addCore(),
      this.addSharedStrings(),
      this.addStyles(),
      this.addWorkbookRels(),
    ]);
    await this.addWorkbook();
    return this._finalize();
  }

  get nextId() {
    // find the next unique spot to add worksheet
    let i;
    for (i = 1; i < this._worksheets.length; i++) {
      if (!this._worksheets[i]) {
        return i;
      }
    }
    return this._worksheets.length || 1;
  }

  addImage(image) {
    const id = this.media.length;
    const medium = Object.assign({}, image, {type: 'image', name: `image${id}.${image.extension}`});
    this.media.push(medium);
    return id;
  }

  getImage(id) {
    return this.media[id];
  }

  // A worksheet's drawing (its placed images), written when the sheet commits.
  _addDrawing(drawing, xml, relsXml) {
    this.drawings.push({name: drawing.name});
    this.zip.append(xml, {name: `xl/drawings/${drawing.name}.xml`});
    this.zip.append(relsXml, {name: `xl/drawings/_rels/${drawing.name}.xml.rels`});
  }

  addWorksheet(name, options) {
    // it's possible to add a worksheet with different than default
    // shared string handling
    // in fact, it's even possible to switch it mid-sheet
    options = options || {};
    const useSharedStrings =
      options.useSharedStrings !== undefined ? options.useSharedStrings : this.useSharedStrings;

    if (options.tabColor) {
      // eslint-disable-next-line no-console
      console.trace('tabColor option has moved to { properties: tabColor: {...} }');
      options.properties = Object.assign(
        {
          tabColor: options.tabColor,
        },
        options.properties
      );
    }

    const id = this.nextId;
    name = name || `sheet${id}`;

    const worksheet = new WorksheetWriter({
      id,
      name,
      workbook: this,
      useSharedStrings,
      properties: options.properties,
      state: options.state,
      pageSetup: options.pageSetup,
      views: options.views,
      autoFilter: options.autoFilter,
      headerFooter: options.headerFooter,
    });

    this._worksheets[id] = worksheet;
    return worksheet;
  }

  getWorksheet(id) {
    if (id === undefined) {
      return this._worksheets.find(() => true);
    }
    if (typeof id === 'number') {
      return this._worksheets[id];
    }
    if (typeof id === 'string') {
      return this._worksheets.find(worksheet => worksheet && worksheet.name === id);
    }
    return undefined;
  }

  addStyles() {
    return new Promise(resolve => {
      this.zip.append(this.styles.xml, {name: 'xl/styles.xml'});
      resolve();
    });
  }

  addThemes() {
    return new Promise(resolve => {
      this.zip.append(theme1Xml, {name: 'xl/theme/theme1.xml'});
      resolve();
    });
  }

  addOfficeRels() {
    return new Promise(resolve => {
      const xform = new RelationshipsXform();
      const xml = xform.toXml([
        {Id: 'rId1', Type: RelType.OfficeDocument, Target: 'xl/workbook.xml'},
        {Id: 'rId2', Type: RelType.CoreProperties, Target: 'docProps/core.xml'},
        {Id: 'rId3', Type: RelType.ExtenderProperties, Target: 'docProps/app.xml'},
      ]);
      this.zip.append(xml, {name: '/_rels/.rels'});
      resolve();
    });
  }

  addContentTypes() {
    return new Promise(resolve => {
      const model = {
        worksheets: this._worksheets.filter(Boolean),
        sharedStrings: this.sharedStrings,
        commentRefs: this.commentRefs,
        media: this.media,
        drawings: this.drawings,
      };
      const xform = new ContentTypesXform();
      const xml = xform.toXml(model);
      this.zip.append(xml, {name: '[Content_Types].xml'});
      resolve();
    });
  }

  // Each image is added to the zip when the one before it has been written.
  // An image given as a stream, or as a function returning one ({stream}),
  // is read only then: a workbook of many large images holds one at a time,
  // not all of them. archiver pipes an appended stream at once, so appending
  // them all up front would open every one.
  addMedia() {
    return this.media.reduce(
      (previous, medium) => previous.then(() => this._addMedium(medium)),
      Promise.resolve()
    );
  }

  _addMedium(medium) {
    if (medium.type === 'image') {
      const filename = `xl/media/${medium.name}`;
      if (medium.filename) {
        return this.zip.file(medium.filename, {name: filename});
      }
      if (medium.stream) {
        return new Promise((resolve, reject) => {
          const source = typeof medium.stream === 'function' ? medium.stream() : medium.stream;
          if (!source || typeof source.pipe !== 'function') {
            reject(new Error(`Image ${medium.name}: stream is not a readable stream`));
            return;
          }
          const done = error => {
            this.zip.removeListener('entry', onEntry);
            this.zip.removeListener('error', done);
            if (error) reject(error);
            else resolve();
          };
          const onEntry = entry => {
            if (entry.name === filename) done();
          };
          this.zip.on('entry', onEntry);
          this.zip.on('error', done);
          source.once('error', done);
          this.zip.append(source, {name: filename});
        });
      }
      if (medium.buffer) {
        return this.zip.append(medium.buffer, {name: filename});
      }
      if (medium.base64) {
        const dataimg64 = medium.base64;
        const content = dataimg64.substring(dataimg64.indexOf(',') + 1);
        return this.zip.append(content, {name: filename, base64: true});
      }
    }
    return Promise.reject(new Error('Unsupported media'));
  }

  addApp() {
    return new Promise(resolve => {
      const model = {
        worksheets: this._worksheets.filter(Boolean),
      };
      const xform = new AppXform();
      const xml = xform.toXml(model);
      this.zip.append(xml, {name: 'docProps/app.xml'});
      resolve();
    });
  }

  addCore() {
    return new Promise(resolve => {
      const coreXform = new CoreXform();
      const xml = coreXform.toXml(this);
      this.zip.append(xml, {name: 'docProps/core.xml'});
      resolve();
    });
  }

  addSharedStrings() {
    if (this.sharedStrings.count) {
      return new Promise(resolve => {
        const sharedStringsXform = new SharedStringsXform();
        const xml = sharedStringsXform.toXml(this.sharedStrings);
        this.zip.append(xml, {name: '/xl/sharedStrings.xml'});
        resolve();
      });
    }
    return Promise.resolve();
  }

  addWorkbookRels() {
    let count = 1;
    const relationships = [
      {Id: `rId${count++}`, Type: RelType.Styles, Target: 'styles.xml'},
      {Id: `rId${count++}`, Type: RelType.Theme, Target: 'theme/theme1.xml'},
    ];
    if (this.sharedStrings.count) {
      relationships.push({
        Id: `rId${count++}`,
        Type: RelType.SharedStrings,
        Target: 'sharedStrings.xml',
      });
    }
    this._worksheets.forEach(worksheet => {
      if (worksheet) {
        worksheet.rId = `rId${count++}`;
        relationships.push({
          Id: worksheet.rId,
          Type: RelType.Worksheet,
          Target: `worksheets/sheet${worksheet.id}.xml`,
        });
      }
    });
    return new Promise(resolve => {
      const xform = new RelationshipsXform();
      const xml = xform.toXml(relationships);
      this.zip.append(xml, {name: '/xl/_rels/workbook.xml.rels'});
      resolve();
    });
  }

  addWorkbook() {
    const {zip} = this;
    const model = {
      worksheets: this._worksheets.filter(Boolean),
      definedNames: this._definedNames.model,
      views: this.views,
      properties: {},
      calcProperties: {},
    };

    return new Promise(resolve => {
      const xform = new WorkbookXform();
      xform.prepare(model);
      zip.append(xform.toXml(model), {name: '/xl/workbook.xml'});
      resolve();
    });
  }

  _finalize() {
    return new Promise((resolve, reject) => {
      this.stream.on('error', reject);
      this.stream.on('finish', () => {
        resolve(this);
      });
      this.zip.on('error', reject);

      this.zip.finalize();
    });
  }
}

module.exports = WorkbookWriter;
