import Excel from '@wekanteam/exceljs';

export const createWorkbook = function() {
  return new Excel.Workbook();
};

// CAN the streaming writer actually stream? (#6591: "Board Settings -> Export
// board -> export/Excel didn't work".)
//
// exceljs 4.7.3's WorkbookWriter zips through archiver, and calls it the way
// archiver 7 was used:
//
//   const Archiver = require('archiver');   // lib/stream/xlsx/workbook-writer.js
//   this.zip = Archiver('zip', this.zipOptions);
//
// archiver 8 is ESM and exports CLASSES - { Archiver, ZipArchive, TarArchive,
// JsonArchive } - so that call is `TypeError: Archiver is not a function`, and
// WeKan moved to archiver 8 for the low-memory backup zips. The export was
// therefore broken from the moment the dependency was bumped, and broken in the
// worst way: the route calls build(res) without awaiting it, so the rejection
// went nowhere, no error was logged, and the browser waited for a response that
// was never coming. A request for the board export simply hung.
//
// Constructing the missing factory is not enough - archiver 8's own
// readable-stream then rejects the stream objects exceljs hands to append()
// ("input source must be valid Stream or Buffer instance"), which is an error
// EVENT on the archive, i.e. a crash rather than a rejected promise. So the
// question is answered before anything is constructed, by what archiver
// exports: callable means exceljs's writer works, an object means it cannot.
//
// The @wekanteam/exceljs fork fixed both (.tools/exceljs commit 7b2f939): its
// writer builds archiver 8's ZipArchive itself, and StreamBuf.pipe returns its
// destination as archiver 8 needs. The same change gave the streaming worksheet
// addImage, so WorkbookWriter._addDrawing marks an exceljs that streams with
// archiver 8 - and one that can stream images.
function forkStreamsImages() {
  return typeof Excel.stream.xlsx.WorkbookWriter.prototype._addDrawing === 'function';
}

function streamingWriterWorks() {
  if (forkStreamsImages()) return true;
  try {
    // eslint-disable-next-line global-require
    return typeof require('archiver') === 'function';
  } catch (e) {
    return false;
  }
}

// The same API as WorkbookWriter, backed by an ordinary Workbook: rows are kept
// in memory and the whole file is written when commit() is called. That is what
// the export did before it was made streaming, so it is a known-good path -
// bounded memory is what is lost, not the export.
class BufferedWorkbookWriter {
  constructor(stream) {
    this._stream = stream;
    this._workbook = new Excel.Workbook();
  }

  // exceljs's writer takes these as plain properties; pass them through.
  set creator(v) { this._workbook.creator = v; }
  get creator() { return this._workbook.creator; }
  set lastModifiedBy(v) { this._workbook.lastModifiedBy = v; }
  get lastModifiedBy() { return this._workbook.lastModifiedBy; }
  set created(v) { this._workbook.created = v; }
  get created() { return this._workbook.created; }
  set modified(v) { this._workbook.modified = v; }
  get modified() { return this._workbook.modified; }
  set lastPrinted(v) { this._workbook.lastPrinted = v; }
  get lastPrinted() { return this._workbook.lastPrinted; }

  addWorksheet(name, options) {
    const worksheet = this._workbook.addWorksheet(name, options);
    // A streaming worksheet has commit(); an in-memory one does not, and the
    // caller commits every row and then the sheet.
    if (typeof worksheet.commit !== 'function') worksheet.commit = () => {};
    return worksheet;
  }

  getWorksheet(name) {
    const worksheet = this._workbook.getWorksheet(name);
    if (worksheet && typeof worksheet.commit !== 'function') worksheet.commit = () => {};
    return worksheet;
  }

  // A picture is kept as its bytes here; only the streaming writer reads one
  // when it is written.
  addImage(image) {
    return this._workbook.addImage(image);
  }

  // Rows already have a commit() on the in-memory Row class, so nothing is
  // needed for those.
  async commit() {
    await this._workbook.xlsx.write(this._stream);
    if (this._stream && typeof this._stream.end === 'function') this._stream.end();
  }
}

// Streaming workbook writer: flushes rows straight to `stream` (the HTTP
// response) as they are committed, instead of holding the whole workbook in
// memory. Used by board Excel export so a board with thousands of cards exports
// with bounded RAM. useStyles/useSharedStrings keep the styled output identical
// to the in-memory Workbook.
//
// When the streaming writer cannot work (see above), this returns the buffered
// stand-in instead. Same calls, same file, more memory - and an export that
// finishes, which is the part that matters.
//
// { images: true } is for a workbook that places images over cells (the card
// export, and the board export drawn in the card layout): an older exceljs has
// no addImage on a streaming worksheet, so there it is the buffered stand-in.
export const createWorkbookWriter = function(stream, options = {}) {
  if (!streamingWriterWorks() || (options.images && !forkStreamsImages())) {
    return new BufferedWorkbookWriter(stream);
  }
  return new Excel.stream.xlsx.WorkbookWriter({
    stream,
    useStyles: true,
    useSharedStrings: true,
  });
};

export const streamingExcelAvailable = streamingWriterWorks;

// Does this workbook take an image as { stream }, read when it is written? The
// streaming writer of the fork does; an in-memory workbook needs the bytes.
export const workbookStreamsImages = workbook =>
  workbook instanceof Excel.stream.xlsx.WorkbookWriter && forkStreamsImages();
