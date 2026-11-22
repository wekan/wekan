// An OpenDocument's content.xml as blocks in document order, from the SAX
// events of a streaming XML parser (htmlparser2 in xmlMode), so a document of
// any size is read a piece at a time. Pure: the server's preview conversion
// (server/lib/attachmentPreviewStore.js) feeds it and writes the blocks as
// rows the slideshow pages through.

export const MAX_COLUMNS = 1024;

const ODF_NS = {
  text: 'urn:oasis:names:tc:opendocument:xmlns:text:1.0',
  table: 'urn:oasis:names:tc:opendocument:xmlns:table:1.0',
  draw: 'urn:oasis:names:tc:opendocument:xmlns:drawing:1.0',
};

// content.xml's blocks in document order, from SAX events as it streams in:
// { kind: 'heading' | 'paragraph', text }, { kind: 'row', cells, count },
// { kind: 'page', name } for a sheet or a slide. Repeated rows are one block
// with a count, given out one at a time only as they are scrolled to, so a
// sheet whose last row repeats a million times to the edge of the grid costs
// nothing; trailing empty cells and rows are the grid, not content.
export class OdfBlocks {
  constructor() {
    this.queue = [];
    this.scopes = [{}];
    this.para = null;
    this.heading = false;
    this.note = 0;
    this.row = null;
    this.cell = null;
    this.emptyRows = 0;
  }

  // Prefixes are resolved through the xmlns declarations in scope, so a file
  // that names the namespaces differently is read the same.
  resolve(qname, attrs) {
    const map = Object.assign({}, this.scopes[this.scopes.length - 1]);
    for (const [k, v] of Object.entries(attrs || {})) if (k.startsWith('xmlns:')) map[k.slice(6)] = v;
    this.scopes.push(map);
    const at = qname.indexOf(':');
    return { ns: at > 0 ? map[qname.slice(0, at)] : '', local: at > 0 ? qname.slice(at + 1) : qname, map };
  }

  attr(attrs, map, ns, local) {
    for (const [k, v] of Object.entries(attrs || {})) {
      const at = k.indexOf(':');
      if (at > 0 && map[k.slice(0, at)] === ns && k.slice(at + 1) === local) return v;
    }
    return undefined;
  }

  addText(text) {
    if (!this.note && this.para !== null) this.para += text;
  }

  open(qname, attrs) {
    const { ns, local, map } = this.resolve(qname, attrs);
    if (ns === ODF_NS.text) {
      if (local === 'note') this.note += 1;
      // A footnote's own paragraphs are not the text's: they would end the
      // paragraph the note sits in.
      else if (this.note) return;
      else if (local === 'p' || local === 'h') { this.para = ''; this.heading = local === 'h'; }
      else if (local === 's') this.addText(' '.repeat(Math.min(Number(this.attr(attrs, map, ODF_NS.text, 'c')) || 1, 1000)));
      else if (local === 'tab') this.addText('\t');
      else if (local === 'line-break') this.addText('\n');
    } else if (ns === ODF_NS.table) {
      if (local === 'table') {
        const name = this.attr(attrs, map, ODF_NS.table, 'name');
        if (name) this.queue.push({ kind: 'page', name });
        this.emptyRows = 0;
      } else if (local === 'table-row') {
        const count = Math.max(1, Number(this.attr(attrs, map, ODF_NS.table, 'number-rows-repeated')) || 1);
        this.row = { cells: [], count };
      } else if ((local === 'table-cell' || local === 'covered-table-cell') && this.row) {
        const repeat = Number(this.attr(attrs, map, ODF_NS.table, 'number-columns-repeated')) || 1;
        this.cell = { parts: [], repeat: Math.max(1, Math.min(repeat, MAX_COLUMNS)) };
      }
    } else if (ns === ODF_NS.draw && local === 'page') {
      this.queue.push({ kind: 'page', name: this.attr(attrs, map, ODF_NS.draw, 'name') || '' });
    }
  }

  close(qname) {
    const map = this.scopes.pop() || {};
    const at = qname.indexOf(':');
    const ns = at > 0 ? map[qname.slice(0, at)] : '';
    const local = at > 0 ? qname.slice(at + 1) : qname;
    if (ns === ODF_NS.text) {
      if (local === 'note') this.note = Math.max(0, this.note - 1);
      else if (this.note) return;
      else if ((local === 'p' || local === 'h') && this.para !== null) {
        if (this.cell) this.cell.parts.push(this.para);
        else if (this.para.trim()) this.queue.push({ kind: this.heading ? 'heading' : 'paragraph', text: this.para });
        this.para = null;
      }
    } else if (ns === ODF_NS.table) {
      if ((local === 'table-cell' || local === 'covered-table-cell') && this.cell && this.row) {
        const text = this.cell.parts.join('\n');
        for (let i = 0; i < this.cell.repeat && this.row.cells.length < MAX_COLUMNS; i += 1) this.row.cells.push(text);
        this.cell = null;
      } else if (local === 'table-row' && this.row) {
        const cells = this.row.cells;
        while (cells.length && !cells[cells.length - 1]) cells.pop();
        if (!cells.length) this.emptyRows += this.row.count;
        else {
          if (this.emptyRows) this.queue.push({ kind: 'row', cells: [], count: this.emptyRows });
          this.emptyRows = 0;
          this.queue.push({ kind: 'row', cells, count: this.row.count });
        }
        this.row = null;
      } else if (local === 'table') {
        this.emptyRows = 0;
      }
    }
  }

  // The next block - a repeated row one at a time - or null when none is queued.
  take() {
    const head = this.queue[0];
    if (!head) return null;
    if (head.kind === 'row' && head.count > 1) {
      head.count -= 1;
      return { kind: 'row', cells: head.cells, count: 1 };
    }
    return this.queue.shift();
  }
}

