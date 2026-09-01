import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { check } from 'meteor/check';
import { sendJsonResult } from '/server/apiMiddleware';
import { ensureIndex } from '/server/lib/mongoStartup';
const {
  MCP_USAGE_ACTIONS,
  MCP_USAGE_PHASES,
} = require('/models/lib/mcpUsage');
const {
  McpUsageDaily,
  recordMcpUsage,
  mcpUsageSummary,
} = require('/server/lib/mcpUsage');

Meteor.startup(async () => {
  await ensureIndex(McpUsageDaily, { userId: 1, dateKey: -1 }, { unique: true });
  await ensureIndex(McpUsageDaily, { expiresAt: 1 }, { expireAfterSeconds: 0 });
});

Meteor.methods({
  async 'mcpUsage.summary'() {
    if (!this.userId) throw new Meteor.Error('not-authorized');
    return mcpUsageSummary(this.userId);
  },
});

WebApp.handlers.post('/api/mcp/usage/event', async function(req, res) {
  if (!req.userId || !req.mcpApiKeyId) {
    sendJsonResult(res, { code: 401, data: { ok: false, error: 'Unauthorized' } });
    return;
  }

  const { tool, action, phase } = req.body || {};
  try {
    check(tool, String);
    check(action, String);
    check(phase, String);
    if (!/^[a-z][a-z0-9_]{0,79}$/.test(tool)) {
      throw new Meteor.Error('mcp-usage-tool-invalid');
    }
    if (!MCP_USAGE_ACTIONS.includes(action) || !MCP_USAGE_PHASES.includes(phase)) {
      throw new Meteor.Error('mcp-usage-event-invalid');
    }
    const usage = await recordMcpUsage(req.userId, action, phase);
    sendJsonResult(res, { code: 200, data: { ok: true, usage } });
  } catch (error) {
    const quotaReached = error?.error === 'mcp-daily-create-limit-reached';
    sendJsonResult(res, {
      code: quotaReached ? 429 : 400,
      data: {
        ok: false,
        error: quotaReached
          ? 'Daily MCP create limit reached'
          : 'Invalid MCP usage event',
      },
    });
  }
});
