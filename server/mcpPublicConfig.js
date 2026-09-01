import { Meteor } from 'meteor/meteor';

function normalizePublicEndpoint(value) {
  if (!value || typeof value !== 'string') return '';
  try {
    const parsed = new URL(value.trim());
    if (!['http:', 'https:'].includes(parsed.protocol)) return '';
    return parsed.toString();
  } catch (error) {
    return '';
  }
}

if (!Meteor.settings.public) Meteor.settings.public = {};

const endpoint = normalizePublicEndpoint(process.env.MCP_PUBLIC_URL);
Meteor.settings.public.mcp = {
  enabled: Boolean(endpoint),
  endpoint,
  transport: 'streamable-http',
};

if (process.env.MCP_PUBLIC_URL && !endpoint) {
  console.warn('MCP_PUBLIC_URL must be an absolute http(s) URL; MCP tab disabled.');
}
