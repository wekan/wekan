'use strict';

const crypto = require('node:crypto');
const { normalizeCaptureUrl } = require('./personalInbox');

const CONNECTOR_TOKEN_BYTES = 32;
const CONNECTOR_TYPES = ['browser', 'slack', 'teams'];
const DEFAULT_CONNECTOR_TYPES = ['browser', 'slack', 'teams'];
const MAX_CONNECTOR_TITLE_LENGTH = 1000;
const MAX_CONNECTOR_DESCRIPTION_LENGTH = 100000;

function generateConnectorToken() {
  return crypto.randomBytes(CONNECTOR_TOKEN_BYTES).toString('base64url');
}

function hashConnectorToken(token) {
  const raw = typeof token === 'string' ? token.trim() : '';
  if (!raw) return '';
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function constantTimeEqual(left, right) {
  const a = Buffer.from(String(left || ''), 'utf8');
  const b = Buffer.from(String(right || ''), 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function verifyConnectorToken(user, token) {
  const expected = user && user.profile && user.profile.personalInboxConnectorTokenHash;
  if (typeof expected !== 'string' || expected.length !== 64) return false;
  const actual = hashConnectorToken(token);
  return constantTimeEqual(actual, expected);
}

function normalizeConnectorType(value) {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return CONNECTOR_TYPES.includes(normalized) ? normalized : '';
}

function normalizeConnectorTypes(value) {
  const input = Array.isArray(value) ? value : DEFAULT_CONNECTOR_TYPES;
  const normalized = input.map(normalizeConnectorType).filter(Boolean);
  return [...new Set(normalized)];
}

function connectorTypeIsAllowed(user, type) {
  const normalizedType = normalizeConnectorType(type);
  if (!normalizedType) return false;
  const configured = normalizeConnectorTypes(
    user && user.profile && user.profile.personalInboxConnectorTypes,
  );
  return configured.includes(normalizedType);
}

function normalizeConnectorOrigin(value) {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw || raw.length > 2048) return '';
  try {
    const parsed = new URL(raw);
    if (!['http:', 'https:'].includes(parsed.protocol)) return '';
    if (parsed.username || parsed.password) return '';
    return parsed.origin;
  } catch (_) {
    return '';
  }
}

function normalizeConnectorOrigins(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(normalizeConnectorOrigin).filter(Boolean))].slice(0, 50);
}

function connectorOriginIsAllowed(user, origin) {
  const configured = normalizeConnectorOrigins(
    user && user.profile && user.profile.personalInboxConnectorOrigins,
  );
  if (!configured.length) return true;
  const normalizedOrigin = normalizeConnectorOrigin(origin);
  return Boolean(normalizedOrigin && configured.includes(normalizedOrigin));
}

function normalizeConnectorPayload(payload) {
  const body = payload && typeof payload === 'object' ? payload : {};
  const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
  if (!userId) return { valid: false, error: 'personal-inbox-connector-user-required' };

  const type = normalizeConnectorType(body.type || body.connectorType || body.sourceType);
  if (!type) return { valid: false, error: 'personal-inbox-connector-type-required' };

  const rawTitle = typeof body.title === 'string' ? body.title.trim() : '';
  const fallbackTitle = typeof body.text === 'string'
    ? body.text.trim().split(/\r?\n/).find(Boolean)
    : '';
  const title = (rawTitle || fallbackTitle || '').slice(0, MAX_CONNECTOR_TITLE_LENGTH).trim();
  if (!title) return { valid: false, error: 'personal-inbox-title-required' };

  const sourceUrl = normalizeCaptureUrl(body.sourceUrl || body.url);
  if (sourceUrl === null) {
    return { valid: false, error: 'personal-inbox-invalid-url' };
  }

  const description = typeof body.description === 'string'
    ? body.description.trim()
    : (typeof body.text === 'string' ? body.text.trim() : '');
  const origin = normalizeConnectorOrigin(body.origin);
  const externalId = typeof body.externalId === 'string'
    ? body.externalId.trim().slice(0, 255)
    : '';

  return {
    valid: true,
    connector: {
      userId,
      type,
      title,
      description: description.slice(0, MAX_CONNECTOR_DESCRIPTION_LENGTH),
      sourceUrl,
      origin,
      externalId,
    },
  };
}

function connectorCaptureDescription(connector) {
  const lines = [`Captured from ${connector.type} connector.`];
  if (connector.origin) lines.push(`Origin: ${connector.origin}`);
  if (connector.externalId) lines.push(`External Id: ${connector.externalId}`);
  if (connector.description) lines.push('', connector.description);
  return lines.join('\n').slice(0, MAX_CONNECTOR_DESCRIPTION_LENGTH);
}

module.exports = {
  CONNECTOR_TYPES,
  DEFAULT_CONNECTOR_TYPES,
  generateConnectorToken,
  hashConnectorToken,
  verifyConnectorToken,
  normalizeConnectorType,
  normalizeConnectorTypes,
  connectorTypeIsAllowed,
  normalizeConnectorOrigin,
  normalizeConnectorOrigins,
  connectorOriginIsAllowed,
  normalizeConnectorPayload,
  connectorCaptureDescription,
};
