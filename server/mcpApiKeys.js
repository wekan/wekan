import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { check } from 'meteor/check';
import { sendJsonResult } from '/server/apiMiddleware';
import { ensureIndex } from '/server/lib/mongoStartup';
const {
  MCP_KEY_EXPIRY_DAYS,
  McpApiKeys,
  createMcpApiKey,
  publicMcpApiKey,
} = require('/server/lib/mcpApiKeys');

Meteor.startup(async () => {
  await ensureIndex(McpApiKeys, { userId: 1, createdAt: -1 });
  await ensureIndex(McpApiKeys, { keyHash: 1 }, { unique: true });
  await ensureIndex(McpApiKeys, { expiresAt: 1 });
});

Meteor.methods({
  async 'mcpApiKeys.list'() {
    if (!this.userId) throw new Meteor.Error('not-authorized');
    return (await McpApiKeys.find(
      { userId: this.userId },
      { sort: { createdAt: -1 }, limit: 50 },
    ).fetchAsync()).map(publicMcpApiKey);
  },

  async 'mcpApiKeys.create'(name, expiresInDays = 90) {
    check(name, String);
    check(expiresInDays, Number);
    if (!MCP_KEY_EXPIRY_DAYS.includes(expiresInDays)) {
      throw new Meteor.Error('mcp-key-expiry-invalid');
    }
    return createMcpApiKey(this.userId, name, expiresInDays);
  },

  async 'mcpApiKeys.revoke'(keyId) {
    check(keyId, String);
    if (!this.userId) throw new Meteor.Error('not-authorized');
    const result = await McpApiKeys.updateAsync(
      { _id: keyId, userId: this.userId, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
    if (!result) throw new Meteor.Error('mcp-key-not-found');
    return { revoked: true, keyId };
  },
});

WebApp.handlers.get('/api/mcp/whoami', async function(req, res) {
  if (!req.userId) {
    sendJsonResult(res, { code: 401, data: { ok: false, error: 'Unauthorized' } });
    return;
  }
  sendJsonResult(res, {
    code: 200,
    data: {
      ok: true,
      userId: req.userId,
      apiKeyId: req.mcpApiKeyId || null,
      scopes: req.mcpApiKeyScopes || [],
    },
  });
});
