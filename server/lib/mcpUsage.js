const { Meteor } = require('meteor/meteor');
const { Mongo } = require('meteor/mongo');
const {
  MCP_USAGE_TIMEZONE,
  MCP_USAGE_RETENTION_DAYS,
  mcpUsageDateKey,
  normalizeMcpDailyCreateLimit,
  emptyMcpUsageCounters,
  sumMcpUsageCounters,
} = require('/models/lib/mcpUsage');

const McpUsageDaily = new Mongo.Collection('mcpUsageDaily');

function dailyCreateLimit() {
  return normalizeMcpDailyCreateLimit(process.env.MCP_DAILY_CREATE_LIMIT);
}

async function ensureUsageDay(userId, dateKey, now) {
  const expiresAt = new Date(
    now.getTime() + MCP_USAGE_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  );
  await McpUsageDaily.updateAsync(
    { userId, dateKey },
    {
      $setOnInsert: {
        userId,
        dateKey,
        timezone: MCP_USAGE_TIMEZONE,
        ...emptyMcpUsageCounters(),
        createdAt: now,
        expiresAt,
      },
      $set: { updatedAt: now },
    },
    { upsert: true },
  );
}

async function recordMcpUsage(userId, action, phase, now = new Date()) {
  if (!userId) throw new Meteor.Error('not-authorized');
  const dateKey = mcpUsageDateKey(now);
  await ensureUsageDay(userId, dateKey, now);
  const base = { userId, dateKey };

  if (phase === 'requested') {
    if (action === 'create') {
      const result = await McpUsageDaily.updateAsync(
        { ...base, createRequested: { $lt: dailyCreateLimit() } },
        {
          $inc: { toolCallTotal: 1, createRequested: 1 },
          $set: { updatedAt: now },
        },
      );
      if (!result) {
        await McpUsageDaily.updateAsync(base, {
          $inc: { toolCallTotal: 1, createFailed: 1 },
          $set: { updatedAt: now },
        });
        throw new Meteor.Error('mcp-daily-create-limit-reached');
      }
    } else {
      await McpUsageDaily.updateAsync(base, {
        $inc: { toolCallTotal: 1 },
        $set: { updatedAt: now },
      });
    }
  } else if (phase === 'success') {
    const increments = {};
    if (action === 'create') increments.createSuccess = 1;
    if (action === 'read') increments.downloadTotal = 1;
    if (Object.keys(increments).length) {
      await McpUsageDaily.updateAsync(base, {
        $inc: increments,
        $set: { updatedAt: now },
      });
    }
  } else if (phase === 'failed' && action === 'create') {
    await McpUsageDaily.updateAsync(base, {
      $inc: { createFailed: 1 },
      $set: { updatedAt: now },
    });
  }

  const today = await McpUsageDaily.findOneAsync(base);
  return {
    dateKey,
    dailyCreateLimit: dailyCreateLimit(),
    createRequested: Number(today?.createRequested) || 0,
  };
}

async function mcpUsageSummary(userId, now = new Date()) {
  if (!userId) throw new Meteor.Error('not-authorized');
  const rows = await McpUsageDaily.find(
    { userId },
    { sort: { dateKey: -1 }, limit: MCP_USAGE_RETENTION_DAYS },
  ).fetchAsync();
  const todayKey = mcpUsageDateKey(now);
  const today = rows.find(row => row.dateKey === todayKey) || {
    dateKey: todayKey,
    ...emptyMcpUsageCounters(),
  };
  const limit = dailyCreateLimit();
  return {
    timezone: MCP_USAGE_TIMEZONE,
    retentionDays: MCP_USAGE_RETENTION_DAYS,
    dailyCreateLimit: limit,
    dailyCreateRemaining: Math.max(0, limit - (Number(today.createRequested) || 0)),
    today: { dateKey: today.dateKey, ...sumMcpUsageCounters([today]) },
    totals: sumMcpUsageCounters(rows),
    history: rows.slice(0, 7).map(row => ({
      dateKey: row.dateKey,
      ...sumMcpUsageCounters([row]),
    })),
  };
}

module.exports = {
  McpUsageDaily,
  dailyCreateLimit,
  recordMcpUsage,
  mcpUsageSummary,
};
