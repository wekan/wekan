'use strict';

const MCP_USAGE_TIMEZONE = 'Asia/Ho_Chi_Minh';
const MCP_USAGE_RETENTION_DAYS = 90;
const DEFAULT_MCP_DAILY_CREATE_LIMIT = null;
const MCP_USAGE_ACTIONS = ['health', 'read', 'create', 'update'];
const MCP_USAGE_PHASES = ['requested', 'success', 'failed'];

function mcpUsageDateKey(value = new Date(), timezone = MCP_USAGE_TIMEZONE) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = type => parts.find(item => item.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function normalizeMcpDailyCreateLimit(value) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return DEFAULT_MCP_DAILY_CREATE_LIMIT;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_MCP_DAILY_CREATE_LIMIT;
}

function emptyMcpUsageCounters() {
  return {
    toolCallTotal: 0,
    downloadTotal: 0,
    createRequested: 0,
    createSuccess: 0,
    createFailed: 0,
  };
}

function sumMcpUsageCounters(rows) {
  return (Array.isArray(rows) ? rows : []).reduce((totals, row) => {
    Object.keys(totals).forEach(key => {
      totals[key] += Number(row?.[key]) || 0;
    });
    return totals;
  }, emptyMcpUsageCounters());
}

module.exports = {
  MCP_USAGE_TIMEZONE,
  MCP_USAGE_RETENTION_DAYS,
  DEFAULT_MCP_DAILY_CREATE_LIMIT,
  MCP_USAGE_ACTIONS,
  MCP_USAGE_PHASES,
  mcpUsageDateKey,
  normalizeMcpDailyCreateLimit,
  emptyMcpUsageCounters,
  sumMcpUsageCounters,
};
