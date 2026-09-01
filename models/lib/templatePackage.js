'use strict';

const crypto = require('node:crypto');

const TEMPLATE_PACKAGE_SCHEMA_VERSION = 1;
const MAX_TEMPLATE_PACKAGE_LISTS = 20;
const MAX_TEMPLATE_PACKAGE_CARDS = 100;
const MAX_TEMPLATE_PACKAGE_TITLE = 120;
const MAX_TEMPLATE_PACKAGE_DESCRIPTION = 5000;
const MAX_TEMPLATE_PACKAGE_CARD_TITLE = 1000;
const MAX_TEMPLATE_PACKAGE_CARD_DESCRIPTION = 100000;

const TOP_LEVEL_KEYS = new Set([
  'schemaVersion',
  'packageId',
  'title',
  'description',
  'lists',
]);
const LIST_KEYS = new Set(['title', 'cards']);
const CARD_KEYS = new Set(['title', 'description']);

function unexpectedKeys(object, allowed) {
  return Object.keys(object || {}).filter(key => !allowed.has(key));
}

function hasControlCharacters(value) {
  return /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value);
}

function normalizePlainText(value, maxLength) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text || text.length > maxLength || hasControlCharacters(text)) return '';
  return text;
}

function normalizeOptionalPlainText(value, maxLength) {
  if (value === undefined || value === null || value === '') return '';
  return normalizePlainText(value, maxLength);
}

function normalizePackageId(value) {
  const id = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!/^[a-z0-9][a-z0-9._-]{2,80}$/.test(id)) return '';
  return id;
}

function stableJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map(key => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function reviewHashForPackage(templatePackage) {
  return crypto.createHash('sha256').update(stableJson(templatePackage)).digest('hex');
}

function normalizeReviewableTemplatePackage(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { valid: false, error: 'template-package-invalid' };
  }
  const extraTopLevel = unexpectedKeys(payload, TOP_LEVEL_KEYS);
  if (extraTopLevel.length) {
    return {
      valid: false,
      error: 'template-package-unreviewed-field',
      field: extraTopLevel[0],
    };
  }
  if (payload.schemaVersion !== TEMPLATE_PACKAGE_SCHEMA_VERSION) {
    return { valid: false, error: 'template-package-schema-version' };
  }
  const packageId = normalizePackageId(payload.packageId);
  if (!packageId) return { valid: false, error: 'template-package-id-required' };
  const title = normalizePlainText(payload.title, MAX_TEMPLATE_PACKAGE_TITLE);
  if (!title) return { valid: false, error: 'template-package-title-required' };
  const description = normalizeOptionalPlainText(
    payload.description,
    MAX_TEMPLATE_PACKAGE_DESCRIPTION,
  );
  if (payload.description && !description) {
    return { valid: false, error: 'template-package-description-invalid' };
  }
  if (!Array.isArray(payload.lists) || payload.lists.length === 0) {
    return { valid: false, error: 'template-package-list-required' };
  }
  if (payload.lists.length > MAX_TEMPLATE_PACKAGE_LISTS) {
    return { valid: false, error: 'template-package-list-limit' };
  }

  let cardCount = 0;
  const lists = [];
  for (const list of payload.lists) {
    if (!list || typeof list !== 'object' || Array.isArray(list)) {
      return { valid: false, error: 'template-package-list-invalid' };
    }
    const extraList = unexpectedKeys(list, LIST_KEYS);
    if (extraList.length) {
      return {
        valid: false,
        error: 'template-package-unreviewed-field',
        field: `lists.${extraList[0]}`,
      };
    }
    const listTitle = normalizePlainText(list.title, MAX_TEMPLATE_PACKAGE_TITLE);
    if (!listTitle) return { valid: false, error: 'template-package-list-title-required' };
    if (!Array.isArray(list.cards)) {
      return { valid: false, error: 'template-package-cards-required' };
    }
    const cards = [];
    for (const card of list.cards) {
      if (!card || typeof card !== 'object' || Array.isArray(card)) {
        return { valid: false, error: 'template-package-card-invalid' };
      }
      const extraCard = unexpectedKeys(card, CARD_KEYS);
      if (extraCard.length) {
        return {
          valid: false,
          error: 'template-package-unreviewed-field',
          field: `cards.${extraCard[0]}`,
        };
      }
      const cardTitle = normalizePlainText(card.title, MAX_TEMPLATE_PACKAGE_CARD_TITLE);
      if (!cardTitle) {
        return { valid: false, error: 'template-package-card-title-required' };
      }
      const cardDescription = normalizeOptionalPlainText(
        card.description,
        MAX_TEMPLATE_PACKAGE_CARD_DESCRIPTION,
      );
      if (card.description && !cardDescription) {
        return { valid: false, error: 'template-package-card-description-invalid' };
      }
      cards.push({ title: cardTitle, description: cardDescription });
      cardCount += 1;
      if (cardCount > MAX_TEMPLATE_PACKAGE_CARDS) {
        return { valid: false, error: 'template-package-card-limit' };
      }
    }
    lists.push({ title: listTitle, cards });
  }

  const templatePackage = {
    schemaVersion: TEMPLATE_PACKAGE_SCHEMA_VERSION,
    packageId,
    title,
    description,
    lists,
  };
  return {
    valid: true,
    package: templatePackage,
    review: {
      hash: reviewHashForPackage(templatePackage),
      listCount: lists.length,
      cardCount,
      allowedTopLevelKeys: [...TOP_LEVEL_KEYS],
    },
  };
}

module.exports = {
  TEMPLATE_PACKAGE_SCHEMA_VERSION,
  MAX_TEMPLATE_PACKAGE_LISTS,
  MAX_TEMPLATE_PACKAGE_CARDS,
  normalizeReviewableTemplatePackage,
  reviewHashForPackage,
};
