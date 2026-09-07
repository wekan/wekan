import { PassThrough } from 'stream';
import { Exporter } from '/models/exporter';
import { fileStoreStrategyFactory } from '/models/attachments.server';
const { sanitizeDownloadFileName } = require('/imports/lib/fileNameDisplay');
const { numberedName } = require('/models/lib/uploadFileName');

// The same export, as a .zip: the JSON beside the attachment FILES.
//
// #1173 asked for both shapes at every menu, and they are the same export twice
// over, not two exports:
//
//   JSON  - one document; attachments, if asked for, are base64 INSIDE it.
//   .zip  - the same document as `wekan.json`, and each attachment as the file
//           it actually is, under `attachments/`.
//
// The document is written by models/exporter.js' `buildStream`, unchanged and
// undated, so a .zip's JSON and a .json export of the same scope are the same
// bytes. Nothing here knows what a board contains; it knows how to put a stream
// in an archive.
//
// STREAMING, both halves. `buildStream` writes into a PassThrough that archiver
// consumes as it compresses, and every attachment is piped from the file store
// rather than read into a Buffer - so a board with a gigabyte of attachments
// costs a gigabyte of disk reads and not a gigabyte of RAM. The JSON inside a
// .zip carries no base64 file data at all (`attachments` are files here), which
// is what makes the .zip the shape to use on a board too large for the .json.

class ExporterZip {
  constructor(boardId, options = {}) {
    this._boardId = boardId;
    this._options = options;
  }

  async canExport(user) {
    // The same check the JSON export makes, from the same place.
    const { ReactiveCache } = require('/imports/reactiveCache');
    const board = await ReactiveCache.getBoard(this._boardId);
    return board && board.isVisibleBy(user);
  }

  async build(res, filename = 'export.zip') {
    const archiver = require('archiver');

    // store, not deflate, for the JSON? No: a board's JSON compresses to a
    // fraction of itself, and the attachments are usually already-compressed
    // formats where level 1 costs nothing and saves little. One level for both,
    // chosen for the JSON, which is the part that is worth compressing.
    const archive = archiver('zip', { zlib: { level: 6 } });

    filename = sanitizeDownloadFileName(filename);
    res.writeHead(200, {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    let failed = null;
    archive.on('error', err => { failed = err; });
    // A warning is a file that could not be added - a deleted attachment, a
    // permission problem - and is not a reason to throw away the whole export.
    archive.on('warning', err => {
      console.warn('ExporterZip: ', err && err.message);
    });
    archive.pipe(res);

    // ── the document ───────────────────────────────────────────────────────
    // The .zip carries the files themselves, so the JSON in it never carries
    // them again as base64: `attachments` here means the metadata rows.
    const jsonStream = new PassThrough();
    archive.append(jsonStream, { name: 'wekan.json' });

    const exporter = new Exporter(this._boardId, undefined, {
      ...this._options,
      excludeAttachments: true,
    });
    const jsonDone = exporter.buildStream(jsonStream)
      .then(() => jsonStream.end())
      .catch(err => { jsonStream.end(); throw err; });

    // ── the files ──────────────────────────────────────────────────────────
    // Added while the JSON is still being written: archiver serialises the
    // entries itself, and waiting would mean holding the whole document first.
    const attachments = await this._attachmentsToPack();
    const archiveNames = new Set();
    for (const attachment of attachments) {
      try {
        const strategy = fileStoreStrategyFactory.getFileStrategy(attachment, 'original');
        const stream = strategy && strategy.getReadStream();
        if (!stream) continue;
        // The id in the name is what ties the file back to its metadata row in
        // wekan.json, and what stops two attachments called "photo.png" from
        // being one file in the archive.
        const desiredName = sanitizeDownloadFileName(attachment.name || attachment._id);
        let name = desiredName;
        for (let suffix = 1; archiveNames.has(name); suffix += 1) {
          name = numberedName(desiredName, suffix);
        }
        archiveNames.add(name);
        archive.append(stream, { name: `attachments/${name}` });
      } catch (error) {
        console.warn(`ExporterZip: could not add attachment ${attachment._id}: ${error.message}`);
      }
    }

    await jsonDone;
    await archive.finalize();
    if (failed) throw failed;
  }

  // The attachments of what was actually exported: the whole board, or the one
  // swimlane, list, card or checklist the menu asked for.
  async _attachmentsToPack() {
    const { ReactiveCache } = require('/imports/reactiveCache');
    const exporter = new Exporter(this._boardId, undefined, this._options);
    if (!exporter.hasField('attachments')) return [];

    if (!exporter.hasScope()) {
      return ReactiveCache.getAttachments({ 'meta.boardId': this._boardId });
    }

    const cardsRaw = require('/models/cards').default.rawCollection();
    const selector = await exporter._scopedCardSelector(this._boardId);
    const cards = await cardsRaw.find(selector, { projection: { _id: 1 } }).toArray();
    const cardIds = cards.map(card => card._id);
    return ReactiveCache.getAttachments({ 'meta.cardId': { $in: cardIds } });
  }
}

export { ExporterZip };
