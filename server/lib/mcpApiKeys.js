const { Meteor } = require('meteor/meteor');
const { Mongo } = require('meteor/mongo');
const { Random } = require('meteor/random');
const {
  MCP_KEY_PREFIX,
  MCP_KEY_SCOPES,
  MCP_KEY_EXPIRY_DAYS,
  MAX_ACTIVE_KEYS_PER_USER,
  hashMcpApiKey,
  normalizeMcpKeyName,
  expiryDate,
  publicMcpApiKey,
} = require('/models/lib/mcpApiKeys');

const McpApiKeys = new Mongo.Collection('mcpApiKeys');

async function createMcpApiKey(userId, name, expiresInDays, now = new Date()) {
  if (!userId) throw new Meteor.Error('not-authorized');
  const normalizedName = normalizeMcpKeyName(name);
  if (!normalizedName) throw new Meteor.Error('mcp-key-name-required');
  const expiresAt = expiryDate(expiresInDays, now);
  if (!expiresAt) throw new Meteor.Error('mcp-key-expiry-invalid');

  const activeCount = await McpApiKeys.find({
    userId,
    revokedAt: null,
    expiresAt: { $gt: now },
  }).countAsync();
  if (activeCount >= MAX_ACTIVE_KEYS_PER_USER) {
    throw new Meteor.Error('mcp-key-limit-reached');
  }

  const apiKey = `${MCP_KEY_PREFIX}${Random.secret(36)}`;
  const id = await McpApiKeys.insertAsync({
    userId,
    name: normalizedName,
    keyHash: hashMcpApiKey(apiKey),
    prefix: apiKey.slice(0, MCP_KEY_PREFIX.length + 8),
    scopes: MCP_KEY_SCOPES,
    createdAt: now,
    lastUsedAt: null,
    expiresAt,
    revokedAt: null,
  });

  return {
    apiKey,
    key: publicMcpApiKey(await McpApiKeys.findOneAsync(id)),
  };
}

async function verifyMcpApiKey(value, now = new Date()) {
  if (
    typeof value !== 'string' ||
    !value.startsWith(MCP_KEY_PREFIX) ||
    value.length < MCP_KEY_PREFIX.length + 24
  ) {
    return null;
  }

  const key = await McpApiKeys.findOneAsync({
    keyHash: hashMcpApiKey(value),
    revokedAt: null,
    expiresAt: { $gt: now },
  });
  if (!key) return null;

  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  await McpApiKeys.updateAsync(
    {
      _id: key._id,
      $or: [
        { lastUsedAt: null },
        { lastUsedAt: { $lt: fiveMinutesAgo } },
      ],
    },
    { $set: { lastUsedAt: now } },
  );

  return {
    keyId: key._id,
    userId: key.userId,
    scopes: key.scopes || [],
  };
}

module.exports = {
  MCP_KEY_PREFIX,
  MCP_KEY_SCOPES,
  MCP_KEY_EXPIRY_DAYS,
  MAX_ACTIVE_KEYS_PER_USER,
  McpApiKeys,
  hashMcpApiKey,
  normalizeMcpKeyName,
  expiryDate,
  publicMcpApiKey,
  createMcpApiKey,
  verifyMcpApiKey,
};
