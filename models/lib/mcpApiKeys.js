'use strict';

const crypto = require('node:crypto');

const MCP_KEY_PREFIX = 'wk_mcp_';
const MCP_KEY_SCOPES = ['mcp-key:manage', 'mcp-usage:read', 'mcp-tools:call'];
const MCP_KEY_EXPIRY_DAYS = [30, 90, 365];
const MAX_ACTIVE_KEYS_PER_USER = 10;

function hashMcpApiKey(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function normalizeMcpKeyName(value) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ').slice(0, 80);
}

function expiryDate(days, now = new Date()) {
  const value = Number(days);
  if (!MCP_KEY_EXPIRY_DAYS.includes(value)) return null;
  return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
}

function publicMcpApiKey(doc) {
  return {
    _id: doc._id,
    name: doc.name,
    prefix: doc.prefix,
    scopes: doc.scopes || [],
    createdAt: doc.createdAt,
    lastUsedAt: doc.lastUsedAt || null,
    expiresAt: doc.expiresAt,
    revokedAt: doc.revokedAt || null,
  };
}

module.exports = {
  MCP_KEY_PREFIX,
  MCP_KEY_SCOPES,
  MCP_KEY_EXPIRY_DAYS,
  MAX_ACTIVE_KEYS_PER_USER,
  hashMcpApiKey,
  normalizeMcpKeyName,
  expiryDate,
  publicMcpApiKey,
};
