// Read POST /api/inbound-email into the message shape of
// server/lib/inboundEmailPayload.js, whatever the provider sends:
//   - JSON or a URL-encoded form (Postmark; Mailgun and SendGrid without
//     attachments) - already parsed by server/apiMiddleware.js;
//   - multipart/form-data (Mailgun and SendGrid with attachments) - read here
//     with @fastify/busboy, under size and count limits;
//   - the whole message: SendGrid's "raw" mode (an `email` field), a relay's
//     `raw`/`mime` field, or a body of type message/rfc822 - parsed with
//     mailparser.
const Busboy = require('@fastify/busboy');
const { simpleParser } = require('mailparser');
const { fromProviderFields, fromParsedMail } = require('./inboundEmailPayload');

const MAX_BYTES = Number(process.env.INBOUND_EMAIL_MAX_BYTES) || 30 * 1024 * 1024;

function contentType(req) {
  return String((req.headers && req.headers['content-type']) || '').toLowerCase();
}

function readMultipart(req) {
  return new Promise((resolve, reject) => {
    const fields = {};
    const files = [];
    let total = 0;
    let busboy;
    try {
      busboy = new Busboy({
        headers: req.headers,
        limits: { fileSize: MAX_BYTES, files: 30, fields: 200, fieldSize: MAX_BYTES, parts: 230 },
      });
    } catch (e) {
      reject(e);
      return;
    }
    busboy.on('field', (name, value) => {
      total += Buffer.byteLength(value || '');
      if (total > MAX_BYTES) { reject(new Error('too-large')); return; }
      fields[name] = value;
    });
    busboy.on('file', (fieldname, stream, filename, encoding, mimetype) => {
      const chunks = [];
      stream.on('data', chunk => {
        total += chunk.length;
        if (total > MAX_BYTES) { stream.resume(); return; }
        chunks.push(chunk);
      });
      stream.on('end', () => {
        if (!stream.truncated && total <= MAX_BYTES) {
          files.push({ fieldname, filename, contentType: mimetype, content: Buffer.concat(chunks) });
        }
      });
    });
    busboy.on('error', reject);
    busboy.on('finish', () => (total > MAX_BYTES ? reject(new Error('too-large')) : resolve({ fields, files })));
    req.pipe(busboy);
  });
}

function readRaw(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', chunk => {
      total += chunk.length;
      if (total > MAX_BYTES) { reject(new Error('too-large')); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function parseWhole(source) {
  return fromParsedMail(await simpleParser(source, { skipImageLinks: true, skipTextLinks: true }));
}

const RAW_FIELDS = ['email', 'raw', 'mime', 'body-mime'];

async function readInboundMessage(req) {
  const type = contentType(req);
  if (type.startsWith('multipart/form-data')) {
    const { fields, files } = await readMultipart(req);
    const raw = RAW_FIELDS.map(name => fields[name]).find(v => typeof v === 'string' && v);
    return { message: raw ? await parseWhole(raw) : fromProviderFields(fields, files), fields };
  }
  if (type.startsWith('message/rfc822')) {
    return { message: await parseWhole(await readRaw(req)), fields: {} };
  }
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const raw = RAW_FIELDS.map(name => body[name]).find(v => typeof v === 'string' && v);
  return { message: raw ? await parseWhole(raw) : fromProviderFields(body), fields: body };
}

module.exports = { readInboundMessage, MAX_BYTES };
