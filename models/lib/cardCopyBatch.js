'use strict';

const MAX_BATCH_CARDS = 200;
const MAX_BATCH_JSON_BYTES = 256 * 1024;
const MAX_CARD_TITLE_LENGTH = 1000;
const MAX_CARD_DESCRIPTION_LENGTH = 1024 * 1024;

function normalizeCardCopyBatch(value) {
  let parsed = value;
  if (typeof value === 'string') {
    if (Buffer.byteLength(value, 'utf8') > MAX_BATCH_JSON_BYTES) {
      throw new Error('card-copy-batch-too-large');
    }
    try { parsed = JSON.parse(value); } catch (_) {
      throw new Error('invalid-card-copy-batch');
    }
  }
  if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > MAX_BATCH_CARDS) {
    throw new Error('invalid-card-copy-batch');
  }
  return parsed.map(item => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error('invalid-card-copy-batch');
    }
    const keys = Object.keys(item);
    if (keys.some(key => !['title', 'description'].includes(key))) {
      throw new Error('invalid-card-copy-batch');
    }
    const title = typeof item.title === 'string' ? item.title.trim() : '';
    const description = item.description === undefined ? undefined : item.description;
    if (!title || title.length > MAX_CARD_TITLE_LENGTH
      || /[\u0000-\u001f\u007f]/.test(title)
      || (description !== undefined && typeof description !== 'string')
      || (typeof description === 'string' && description.length > MAX_CARD_DESCRIPTION_LENGTH)) {
      throw new Error('invalid-card-copy-batch');
    }
    return { title, ...(description !== undefined ? { description } : {}) };
  });
}

module.exports = {
  MAX_BATCH_CARDS,
  MAX_BATCH_JSON_BYTES,
  normalizeCardCopyBatch,
};
