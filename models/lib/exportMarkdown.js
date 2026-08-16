'use strict';

// Markdown, as WeKan renders it, for a file rather than for a browser.
//
// WHY THIS EXISTS. A card's description, its comments and its checklist items
// are markdown, and WeKan draws them as markdown everywhere it shows them. The
// exports did not: the PDF flattened `**bold**` to the word with its asterisks
// still on, and Excel wrote the source text into a cell. So a card that reads
// well on screen exported as something nobody would write on purpose - which is
// the complaint in wekan/wekan#6586, "markdown is not formatted - this doesn't
// make sense in a pdf file, does it?"
//
// ONE PARSE, TWO MEDIA. Both exporters ask this module, and it answers in a
// shape neither of them is: a list of BLOCKS, each carrying RUNS of styled text.
//
//   [{ type: 'heading', level: 2, runs: [{ text: 'Plan', bold: true }] },
//    { type: 'bullet', level: 0, runs: [{ text: 'first' }] },
//    { type: 'code', text: 'npm install' }]
//
// A run is `{ text, bold, italic, code, strike, link }`. What a medium does with
// that is its own business: the PDF picks one of the four Courier faces and
// indents; Excel builds an ExcelJS `richText` array. Neither has to know
// markdown, and a fix to how a list nests reaches both at once.
//
// THE SAME PARSER, THE SAME OPTIONS. `packages/markdown/src/template-integration.js`
// renders what a reader sees with markdown-it and
// `{ html: true, linkify: true, typographer: true, breaks: true }`; this uses
// markdown-it with the same four, so the export agrees with the screen about
// what is emphasis, what is a list and where a paragraph ends. It does NOT
// render HTML: an export is a document, and a card that contains `<script>`
// should put those characters in the file rather than act on them. Inline HTML
// is therefore kept as text, which is also what a reader of a PDF can check.

// Bare Node resolves markdown-it's CommonJS export to the constructor itself.
// Meteor's production webpack bundle resolves the same package through its ESM
// condition and returns `{ default: constructor }`. Constructing that namespace
// crashes the whole server at startup with "is not a constructor", so normalize
// both resolver shapes before creating the parser.
function markdownItConstructor(moduleValue) {
  return moduleValue && moduleValue.default ? moduleValue.default : moduleValue;
}

const MarkdownIt = markdownItConstructor(require('markdown-it'));

// The reader's options, minus the plugins that only make sense on screen (emoji
// images, rendered maths). Their SOURCE still arrives as text, so nothing is
// lost from the file - `:smile:` exports as `:smile:`.
const parser = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
});

const EMPTY_STYLE = { bold: false, italic: false, code: false, strike: false, link: '' };

// One run of text with one style. Adjacent runs of the same style are merged, so
// a medium that pays per run (Excel writes a font object for each) is not handed
// forty runs saying the same thing.
function pushRun(runs, text, style) {
  if (!text) return;
  const last = runs[runs.length - 1];
  if (last
    && last.bold === style.bold && last.italic === style.italic
    && last.code === style.code && last.strike === style.strike
    && last.link === style.link) {
    last.text += text;
    return;
  }
  runs.push({ text, ...style });
}

// markdown-it gives inline content as a flat token stream with open/close pairs.
// A stack of styles turns that back into runs.
function runsOf(inlineToken) {
  const runs = [];
  if (!inlineToken || !inlineToken.children) return runs;
  const style = { ...EMPTY_STYLE };
  let linkDepth = 0;

  for (const token of inlineToken.children) {
    switch (token.type) {
      case 'strong_open': style.bold = true; break;
      case 'strong_close': style.bold = false; break;
      case 'em_open': style.italic = true; break;
      case 'em_close': style.italic = false; break;
      case 's_open': style.strike = true; break;
      case 's_close': style.strike = false; break;
      case 'link_open': {
        linkDepth += 1;
        const href = (token.attrs || []).find(a => a[0] === 'href');
        style.link = (href && href[1]) || '';
        break;
      }
      case 'link_close':
        linkDepth = Math.max(0, linkDepth - 1);
        if (linkDepth === 0) style.link = '';
        break;
      case 'code_inline':
        pushRun(runs, token.content, { ...style, code: true });
        break;
      case 'softbreak':
      case 'hardbreak':
        // `breaks: true` means a single newline IS a line break on screen, so it
        // is one here too. A medium that cannot break inside a run splits on it.
        pushRun(runs, '\n', style);
        break;
      case 'html_inline':
        // Kept as text, deliberately - see the note at the top.
        pushRun(runs, token.content, style);
        break;
      case 'image': {
        // The alt text, in brackets: a PDF cell cannot hold the picture, and
        // dropping it silently would lose the only words the author wrote about
        // it. An ATTACHED image is a different thing and is embedded properly.
        const alt = token.content || (token.attrs || []).find(a => a[0] === 'alt');
        pushRun(runs, `[${typeof alt === 'string' ? alt : 'image'}]`, style);
        break;
      }
      case 'text':
      default:
        if (token.content) pushRun(runs, token.content, style);
        break;
    }
  }
  return runs;
}

// The block list. Nesting is flattened to a `level`, because both media lay a
// list out by indenting rather than by containing.
function markdownBlocks(source) {
  const text = typeof source === 'string' ? source : '';
  if (!text.trim()) return [];

  let tokens;
  try {
    tokens = parser.parse(text, {});
  } catch (e) {
    // A card must always export. Anything markdown-it cannot parse is written
    // as the plain text it is.
    return [{ type: 'paragraph', level: 0, runs: [{ text, ...EMPTY_STYLE }] }];
  }

  const blocks = [];
  let listDepth = -1;
  const ordered = [];       // one counter per open ordered list
  let quoteDepth = 0;
  let pendingListItem = false;

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    switch (token.type) {
      case 'heading_open': {
        const inline = tokens[i + 1];
        blocks.push({
          type: 'heading',
          level: parseInt(token.tag.slice(1), 10) || 1,
          runs: runsOf(inline),
        });
        i += 2;
        break;
      }
      case 'paragraph_open': {
        const inline = tokens[i + 1];
        const runs = runsOf(inline);
        if (pendingListItem) {
          const last = blocks[blocks.length - 1];
          if (last && (last.type === 'bullet' || last.type === 'ordered') && !last.runs.length) {
            last.runs = runs;
          } else {
            blocks.push({ type: 'paragraph', level: Math.max(0, listDepth) + 1, runs, quote: quoteDepth });
          }
          pendingListItem = false;
        } else if (runs.length) {
          blocks.push({ type: 'paragraph', level: Math.max(0, listDepth), runs, quote: quoteDepth });
        }
        i += 2;
        break;
      }
      case 'bullet_list_open':
        listDepth += 1;
        ordered.push(null);
        break;
      case 'ordered_list_open': {
        listDepth += 1;
        const startAttr = (token.attrs || []).find(a => a[0] === 'start');
        ordered.push(startAttr ? parseInt(startAttr[1], 10) : 1);
        break;
      }
      case 'bullet_list_close':
      case 'ordered_list_close':
        listDepth -= 1;
        ordered.pop();
        break;
      case 'list_item_open': {
        const isOrdered = ordered[ordered.length - 1] !== null
          && ordered[ordered.length - 1] !== undefined;
        const block = {
          type: isOrdered ? 'ordered' : 'bullet',
          level: Math.max(0, listDepth),
          runs: [],
          quote: quoteDepth,
        };
        if (isOrdered) {
          block.index = ordered[ordered.length - 1];
          ordered[ordered.length - 1] += 1;
        }
        blocks.push(block);
        pendingListItem = true;
        break;
      }
      case 'blockquote_open': quoteDepth += 1; break;
      case 'blockquote_close': quoteDepth = Math.max(0, quoteDepth - 1); break;
      case 'fence':
      case 'code_block':
        blocks.push({
          type: 'code',
          level: Math.max(0, listDepth),
          text: String(token.content || '').replace(/\n$/, ''),
          language: token.info ? String(token.info).trim() : '',
        });
        break;
      case 'hr':
        blocks.push({ type: 'rule', level: 0 });
        break;
      case 'html_block':
        blocks.push({
          type: 'paragraph',
          level: Math.max(0, listDepth),
          runs: [{ text: String(token.content || '').trim(), ...EMPTY_STYLE }],
          quote: quoteDepth,
        });
        break;
      case 'inline':
        // An inline token the cases above did not consume - a list item written
        // "tight", where markdown-it emits no paragraph around it.
        if (pendingListItem) {
          const last = blocks[blocks.length - 1];
          if (last && !last.runs.length) last.runs = runsOf(token);
          pendingListItem = false;
        }
        break;
      default:
        break;
    }
  }
  return blocks.filter(b => b.type !== 'paragraph' || b.runs.length);
}

// The whole of a markdown source as ONE list of runs, for a place that has a
// single line to give it: a spreadsheet cell, a table column. Blocks are joined
// with newlines and a list keeps its bullet, so the text still reads as a list.
function markdownRuns(source) {
  const runs = [];
  const blocks = markdownBlocks(source);
  blocks.forEach((block, index) => {
    if (index > 0) pushRun(runs, '\n', { ...EMPTY_STYLE });
    const indent = '    '.repeat(block.level || 0);
    if (block.type === 'bullet') pushRun(runs, `${indent}• `, { ...EMPTY_STYLE });
    if (block.type === 'ordered') pushRun(runs, `${indent}${block.index}. `, { ...EMPTY_STYLE });
    if (block.type === 'rule') { pushRun(runs, '———', { ...EMPTY_STYLE }); return; }
    if (block.type === 'code') {
      pushRun(runs, block.text, { ...EMPTY_STYLE, code: true });
      return;
    }
    if (block.quote) pushRun(runs, '> '.repeat(block.quote), { ...EMPTY_STYLE, italic: true });
    for (const run of block.runs) {
      // A heading has no larger size to be given in a cell, so it is bold - the
      // same answer the PDF gives when it runs out of heading sizes.
      pushRun(runs, run.text, block.type === 'heading' ? { ...run, bold: true } : run);
    }
  });
  return runs;
}

// The plain text of a markdown source, for a place that can style nothing at all
// (a CSV column, a filename). Same parse, so the three agree on what the text is.
function markdownPlainText(source) {
  return markdownRuns(source).map(run => run.text).join('');
}

module.exports = {
  markdownBlocks,
  markdownRuns,
  markdownPlainText,
  runsOf,
  markdownItConstructor,
};
