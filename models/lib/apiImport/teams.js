// Microsoft Teams through Microsoft Graph (models/lib/apiImportServices.js):
// the member's chats and the channels of the teams they belong to, and one
// chat's or channel's messages, as the JSON models/lib/chatExportFormats.js
// parseTeamsExport reads. Plain Node; `request` is passed in.
//
// The token is a Microsoft Graph access token of a work or school account
// with Chat.Read (chats) and Team.ReadBasic.All, Channel.ReadBasic.All and
// ChannelMessage.Read.All (channels; the last one needs an administrator's
// consent). Graph does not serve personal Teams accounts - their messages
// come from the personal "Export your data" instead. The token goes only
// into the Authorization header of requests to graph.microsoft.com.
import { GRAPH, graphHeaders, graphAll } from './graph.js';

export const MAX_TEAMS_REQUESTS = 2000;
export const MAX_TEAMS_MESSAGES = 200000;
const enc = value => encodeURIComponent(String(value));
const limit = what => ({ what, max: MAX_TEAMS_REQUESTS, maxItems: MAX_TEAMS_MESSAGES });

export async function list(credentials, request) {
  const headers = graphHeaders(credentials);
  const state = { pages: 0 };
  const out = [];
  const chats = await graphAll(`${GRAPH}/me/chats`, headers, request, state, limit('Teams chats'));
  for (const chat of chats.filter(c => c && typeof c.id === 'string')) {
    out.push({ id: `chat:${chat.id}`, name: String(chat.topic || `${chat.chatType || 'chat'} ${chat.id.slice(0, 12)}`) });
  }
  let teams = [];
  try { teams = await graphAll(`${GRAPH}/me/joinedTeams`, headers, request, state, limit('teams')); } catch (error) { teams = []; }
  for (const team of teams.filter(t => t && typeof t.id === 'string')) {
    let channels = [];
    try { channels = await graphAll(`${GRAPH}/teams/${enc(team.id)}/channels`, headers, request, state, limit('channels')); } catch (error) { channels = []; }
    for (const channel of channels.filter(c => c && typeof c.id === 'string')) {
      out.push({ id: `channel:${team.id}:${channel.id}`, name: `${team.displayName || 'Team'} / ${channel.displayName || channel.id}` });
    }
  }
  return out;
}

export async function fetch(credentials, id, request) {
  const headers = graphHeaders(credentials);
  if (typeof id !== 'string' || !id) throw new Error('Choose what to import');
  const state = { pages: 0 };
  const chat = /^chat:(.+)$/.exec(id);
  if (chat) {
    const info = await request(`${GRAPH}/chats/${enc(chat[1])}`, { method: 'GET', headers });
    const messages = await graphAll(`${GRAPH}/chats/${enc(chat[1])}/messages?$top=50`, headers, request, state, limit('messages'));
    return { teams: true, chats: [{ id: chat[1], topic: String((info && info.topic) || ''), chatType: String((info && info.chatType) || 'group'),
      kind: 'chat', messages }] };
  }
  const channel = /^channel:([^:]+):(.+)$/.exec(id);
  if (!channel) throw new Error('Choose what to import');
  const team = await request(`${GRAPH}/teams/${enc(channel[1])}`, { method: 'GET', headers });
  const info = await request(`${GRAPH}/teams/${enc(channel[1])}/channels/${enc(channel[2])}`, { method: 'GET', headers });
  const messages = await graphAll(`${GRAPH}/teams/${enc(channel[1])}/channels/${enc(channel[2])}/messages?$expand=replies`,
    headers, request, state, limit('messages'));
  return { teams: true, chats: [{ id: channel[2], topic: String((info && info.displayName) || ''), description: String((info && info.description) || ''),
    kind: 'channel', team: String((team && team.displayName) || ''), messages }] };
}
