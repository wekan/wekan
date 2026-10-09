const {SaxesParser} = require('saxes');
const {PassThrough} = require('readable-stream');
const {bufferToString} = require('./browser-buffer-decode');

// Strip 'x:' prefix used by HAN CELL for spreadsheet tags (but preserve other prefixes like dc:, cp:, etc.)
function normalizeTagName(name) {
  return name.startsWith('x:') ? name.substring(2) : name;
}

module.exports = async function* (iterable) {
  // TODO: Remove once node v8 is deprecated
  // Detect and upgrade old streams
  if (iterable.pipe && !iterable[Symbol.asyncIterator]) {
    iterable = iterable.pipe(new PassThrough());
  }
  const saxesParser = new SaxesParser();
  let error;
  saxesParser.on('error', err => {
    error = err;
  });
  let events = [];
  saxesParser.on('opentag', value => {
    // Normalize 'x:' prefix for compatibility with HAN CELL
    const normalizedValue = {...value, name: normalizeTagName(value.name)};
    events.push({eventType: 'opentag', value: normalizedValue});
  });
  saxesParser.on('text', value => events.push({eventType: 'text', value}));
  saxesParser.on('closetag', value => {
    // Normalize 'x:' prefix for compatibility with HAN CELL
    const normalizedValue = {...value, name: normalizeTagName(value.name)};
    events.push({eventType: 'closetag', value: normalizedValue});
  });
  for await (const chunk of iterable) {
    saxesParser.write(bufferToString(chunk));
    // saxesParser.write and saxesParser.on() are synchronous,
    // so we can only reach the below line once all events have been emitted
    if (error) throw error;
    // As a performance optimization, we gather all events instead of passing
    // them one by one, which would cause each event to go through the event queue
    yield events;
    events = [];
  }
};
