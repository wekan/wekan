// WeKan on Sandstorm - Cap'n Proto RPC to sandstorm-http-bridge, in plain
// JavaScript.
//
// Two Sandstorm features need more than the X-Sandstorm-* HTTP headers that
// log a user in: Powerbox identity claims (adding a user through the Powerbox
// picker) and activity events (Sandstorm's notifications and activity log).
// Both are Cap'n Proto calls on the bridge's /tmp/sandstorm-api socket - the
// bridge's HTTP proxy offers only `claim` for HTTP APIs and Bearer forwarding
// (sandstorm src/sandstorm/bridge-proxy.c++), so there is no HTTP route for
// either. They used to go through node-capnp (capnp.node), a native addon
// built for Node 14 that cannot load on Node 26, so the grain ran without
// them. This does the same calls with @wekanteam/capnp-es, which needs no
// native code: the WeKan fork in npm-packages/capnp-es, which adds the
// Resolve and Release handling the bridge relies on.
//
// Nothing here touches Meteor, so tests/sandstormCapnpRpc.test.cjs runs it
// against the reference C++ RPC implementation (tests/fixtures/capnp-rpc).

import net from 'node:net';
import { Conn, DeferredTransport, Message, utils } from '@wekanteam/capnp-es';
import { SandstormHttpBridge } from './capnp/sandstorm-http-bridge.mjs';
import { Identity, Identity$Client, Identity_PowerboxTag, Profile_Pronouns } from './capnp/identity.mjs';
import { StaticAsset_Protocol } from './capnp/util.mjs';
import { PowerboxDescriptor } from './capnp/powerbox.mjs';
import { BridgeConfig } from './capnp/package.mjs';
import { ApiSession$Client, ApiSession_PowerboxTag } from './capnp/api-session.mjs';
import { HackSessionContext$Client } from './capnp/hack-session.mjs';
import { EmailSendPort$Client, EmailMessage } from './capnp/email.mjs';

export const SANDSTORM_API_SOCKET = '/tmp/sandstorm-api';

// Cap'n Proto's standard stream framing over a socket: a segment count and
// segment sizes in words, padded to 8 bytes, then the segments.
export class SocketTransport extends DeferredTransport {
  constructor(socket) {
    super();
    this.socket = socket;
    this.pending = Buffer.alloc(0);
    socket.on('data', (chunk) => this.onData(chunk));
    socket.on('error', (err) => this.reject(err));
    socket.on('close', () => this.close());
  }

  onData(chunk) {
    this.pending = this.pending.length ? Buffer.concat([this.pending, chunk]) : chunk;
    for (;;) {
      const size = frameSize(this.pending);
      if (size === null || this.pending.length < size) return;
      const frame = this.pending.subarray(0, size);
      this.pending = this.pending.subarray(size);
      // A copy, not a view: the message keeps this buffer for its lifetime.
      this.resolve(frame.buffer.slice(frame.byteOffset, frame.byteOffset + size));
    }
  }

  sendMessage(msg) {
    if (this.closed) return;
    this.socket.write(Buffer.from(msg.segment.message.toArrayBuffer()));
  }

  close() {
    if (!this.closed) {
      super.close();
      this.socket.destroy();
    }
  }
}

// Bytes in the first complete frame of buf, or null while the header is
// incomplete.
export function frameSize(buf) {
  if (buf.length < 4) return null;
  const segments = buf.readUInt32LE(0) + 1;
  const header = 4 + 4 * segments + (segments % 2 === 0 ? 4 : 0);
  if (buf.length < header) return null;
  let words = 0;
  for (let i = 0; i < segments; i++) words += buf.readUInt32LE(4 + 4 * i);
  return header + words * 8;
}

// One connection, opened on first use and opened again after it drops (a
// grain's bridge outlives WeKan, but a broken socket must not disable the
// features until the next restart).
export function createBridge({ socketPath = SANDSTORM_API_SOCKET, connect = net.connect } = {}) {
  let state = null;

  function open() {
    if (state && !state.transport.closed) return state;
    const socket = connect(socketPath);
    const transport = new SocketTransport(socket);
    const conn = new Conn(transport);
    conn.onError = () => {};            // a dropped socket surfaces as rejected calls
    state = { conn, transport, bridge: conn.bootstrap(SandstormHttpBridge) };
    return state;
  }

  return {
    get bridge() { return open().bridge; },
    close() { if (state) { state.conn.shutdown(); state = null; } },
  };
}

// Close a capability client so its Release goes out now, not at GC.
export function release(...clients) {
  for (const c of clients) {
    try { c?.client?.close?.(); } catch (_) { /* already gone */ }
  }
}

// Which activity type an activityType NAME is: its index in the grain's
// pkgdef bridgeConfig.viewInfo.eventTypes, read from the
// /sandstorm-http-bridge-config file Sandstorm puts in every grain.
export function parseEventTypeNames(configBytes) {
  const buf = toArrayBuffer(configBytes);
  const config = new Message(buf, false).getRoot(BridgeConfig);
  return config.viewInfo.eventTypes.map((t) => t.name);
}

// The permissions a Powerbox identity request asked for, from its packed,
// base64 descriptor (the client's powerboxRequest reply). Index 0 of the
// grain's permission list is `participate`, index 1 `configure` (pkgdef).
export function parseIdentityRequestPermissions(descriptorBase64) {
  const bytes = Buffer.from(descriptorBase64.replace(/_/g, '/').replace(/-/g, '+'), 'base64');
  const descriptor = new Message(toArrayBuffer(bytes), true).getRoot(PowerboxDescriptor);
  const tag = utils.getAs(Identity_PowerboxTag, descriptor.tags.get(0).value);
  const granted = tag.permissions;
  const permissions = [];
  if (granted.length > 1 && granted.get(1)) permissions.push('configure');
  if (granted.length > 0 && granted.get(0)) permissions.push('participate');
  return permissions;
}

// The Powerbox query for an external HTTP API (an ApiSession) at canonicalUrl:
// a PowerboxDescriptor with one tag, ApiSession's type id, whose value is an
// ApiSession.PowerboxTag. Packed and base64'd the way the shell wants it, with
// '/' and '+' replaced as for the identity descriptor in /sandstorm.js. The
// client embeds the result as a constant; tests/sandstormApiEgress.test.cjs
// rebuilds it here so the two cannot drift.
// `authentication: 'basic'` asks the HTTP driver for an endpoint that signs in
// with HTTP Basic: the user gives the credentials in the Powerbox, they are
// kept in the grant, and the driver adds them to every request
// (sandstorm shell/imports/server/drivers/external-ui-view.js).
export function apiSessionDescriptor(canonicalUrl, { authentication } = {}) {
  if (!/^https?:\/\/[^/]+(\/.*[^/])?$/.test(canonicalUrl)) {
    throw new Error('canonicalUrl must be an http(s) URL without a trailing slash');
  }
  const message = new Message();
  const descriptor = message.initRoot(PowerboxDescriptor);
  const tag = descriptor._initTags(1).get(0);
  tag.id = ApiSession$Client.interfaceId;
  const value = new Message().initRoot(ApiSession_PowerboxTag);
  value.canonicalUrl = canonicalUrl;
  if (authentication === 'basic') value.authentication = 'basic';
  tag.value = value;
  return Buffer.from(message.toPackedArrayBuffer()).toString('base64')
    .replace(/\//g, '_').replace(/\+/g, '-');
}

// The other direction, for the tests: which ApiSession URL a descriptor asks for.
export function parseApiSessionDescriptor(descriptorBase64) {
  const bytes = Buffer.from(descriptorBase64.replace(/_/g, '/').replace(/-/g, '+'), 'base64');
  const descriptor = new Message(toArrayBuffer(bytes), true).getRoot(PowerboxDescriptor);
  const tag = descriptor.tags.get(0);
  const value = utils.getAs(ApiSession_PowerboxTag, tag.value);
  return {
    tagId: tag.id,
    canonicalUrl: value.canonicalUrl,
    authentication: value.authentication || null,
  };
}

async function sessionContext(bridge, sessionId) {
  const { context } = await bridge.getSessionContext((p) => { p.id = sessionId; }).promise();
  return context;
}

// Redeem a Powerbox identity request token: what the old capnp code did, call
// for call. Returns what Accounts.updateOrCreateUserFromExternalService needs.
export async function claimIdentity(bridge, sessionId, requestToken, permissions) {
  const context = await sessionContext(bridge, sessionId);
  let identity;
  let api;
  try {
    const claimed = await context.claimRequest((p) => {
      p.requestToken = requestToken;
      p._initRequiredPermissions(0);
    }).promise();
    identity = new Identity$Client(utils.getInterfaceClientOrNullAt(0, claimed));
    ({ api } = await bridge.getSandstormApi(() => {}).promise());
    const [idResult, profileResult] = await Promise.all([
      api.getIdentityId((p) => { p.identity = identity; }).promise(),
      identity.getProfile(() => {}).promise(),
      bridge.saveIdentity((p) => { p.identity = identity; }).promise(),
    ]);
    const { profile } = profileResult;
    let picture;
    try {
      const url = await profile.picture.getUrl(() => {}).promise();
      picture = `${enumName(StaticAsset_Protocol, url.protocol)}://${url.hostPath}`;
      release(profile.picture);
    } catch (_) {
      picture = undefined;                 // a profile without a picture is fine
    }
    return {
      id: Buffer.from(idResult.id.toUint8Array()).toString('hex').slice(0, 32),
      name: profile.displayName.defaultText,
      permissions,
      picture,
      preferredHandle: profile.preferredHandle,
      pronouns: enumName(Profile_Pronouns, profile.pronouns),
    };
  } finally {
    release(identity, api, context);
  }
}

// Send one activity event. users: [{ id, mentioned, subscribed }], where id
// is the user's Sandstorm identity id; identities that no longer resolve
// (added before saveIdentityCaps, or lost access) are left out, as before.
export async function reportActivity(bridge, sessionId, { path, type, users = [], caption = null }) {
  const identities = await Promise.all(users.map(async (user) => {
    try {
      const { identity } = await bridge.getSavedIdentity((p) => { p.identityId = user.id; }).promise();
      await identity.getProfile(() => {}).promise();   // it actually resolves
      return { identity, user };
    } catch (_) {
      return null;
    }
  }));
  const resolved = identities.filter(Boolean);
  const context = await sessionContext(bridge, sessionId);
  try {
    await context.activity((p) => {
      const event = p._initEvent();
      event.path = path;
      event.type = type;
      if (caption) event._initNotification()._initCaption().defaultText = caption;
      const list = event._initUsers(resolved.length);
      resolved.forEach(({ identity, user }, i) => {
        const u = list.get(i);
        u.identity = identity;
        u.mentioned = !!user.mentioned;
        u.subscribed = !!user.subscribed;
      });
    }).promise();
  } finally {
    release(context, ...resolved.map((r) => r.identity));
  }
}

function enumName(values, n) {
  const name = Object.keys(values).find((k) => values[k] === n);
  return name ? name.toLowerCase() : undefined;
}

function toArrayBuffer(bytes) {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

// --- Grain email (sandstorm src/sandstorm/hack-session.capnp, email.capnp) ---
//
// A grain's session context is also a HackSessionContext and an
// EmailSendPort: getPublicId() gives the grain its own address,
// <publicId>@<hostname> (assigned on the first call - until then the grain
// has none), and send() mails through the server's SMTP, From the grain's
// address or the user's verified one, at most 20 recipients a message.
// Mail TO the grain is written by the bridge as Maildir files under
// /var/mail (server/sandstormEmail.js reads them).

// A session context to keep: unlike claimIdentity's, this one is NOT
// released, so notifications can still be sent after that browser tab has
// gone (the shell does not revoke it; it lasts until the grain restarts).
export async function retainSessionContext(bridge, sessionId) {
  return sessionContext(bridge, sessionId);
}

export async function grainPublicId(context) {
  const hack = new HackSessionContext$Client(context.client);
  const r = await hack.getPublicId(() => {}).promise();
  return { publicId: r.publicId, hostname: r.hostname, isDemoUser: r.isDemoUser };
}

const MAX_RECIPIENTS = 20;

function setAddress(struct, { address = '', name = '' } = {}) {
  struct.address = address;
  if (name) struct.name = name;
}

// Fill an EmailMessage from { from, to, cc, bcc, replyTo, subject, text, html,
// messageId, inReplyTo, references, date, attachments: [{ filename,
// contentType, content, cid }] }, addresses as { address, name }. Throws when
// the recipients are over Sandstorm's limit, which the shell would refuse.
export function fillEmailMessage(email, message) {
  const lists = ['to', 'cc', 'bcc'].map((k) => (Array.isArray(message[k]) ? message[k] : []));
  if (lists.reduce((n, l) => n + l.length, 0) > MAX_RECIPIENTS) {
    throw new Error(`Sandstorm sends to at most ${MAX_RECIPIENTS} recipients a message`);
  }
  const date = message.date instanceof Date ? message.date : new Date();
  email.date = BigInt(date.getTime()) * 1000000n;
  if (message.from && message.from.address) setAddress(email._initFrom(), message.from);
  const [to, cc, bcc] = lists;
  [[to, (n) => email._initTo(n)], [cc, (n) => email._initCc(n)], [bcc, (n) => email._initBcc(n)]]
    .forEach(([list, init]) => {
      if (!list.length) return;
      const out = init(list.length);
      list.forEach((a, i) => setAddress(out.get(i), a));
    });
  if (message.replyTo && message.replyTo.address) setAddress(email._initReplyTo(), message.replyTo);
  if (message.messageId) email.messageId = message.messageId;
  for (const [key, init] of [['references', (n) => email._initReferences(n)], ['inReplyTo', (n) => email._initInReplyTo(n)]]) {
    const ids = Array.isArray(message[key]) ? message[key] : (message[key] ? [message[key]] : []);
    if (ids.length) {
      const out = init(ids.length);
      ids.forEach((id, i) => out.set(i, String(id)));
    }
  }
  email.subject = message.subject || '';
  if (message.text) email.text = message.text;
  if (message.html) email.html = message.html;
  const attachments = Array.isArray(message.attachments) ? message.attachments.filter((a) => a && a.content) : [];
  if (attachments.length) {
    const out = email._initAttachments(attachments.length);
    attachments.forEach((a, i) => {
      const bytes = Buffer.isBuffer(a.content) ? a.content : Buffer.from(String(a.content));
      const att = out.get(i);
      att.contentType = a.contentType || 'application/octet-stream';
      att.contentDisposition = a.cid ? `inline; filename="${a.filename || 'file'}"`
        : `attachment; filename="${a.filename || 'file'}"`;
      if (a.cid) att.contentId = `<${a.cid}>`;
      att._initContent(bytes.length).copyBuffer(bytes);
    });
  }
  return email;
}

export async function sendGrainEmail(context, message) {
  const port = new EmailSendPort$Client(context.client);
  await port.send((p) => { fillEmailMessage(p._initEmail(), message); }).promise();
}

// For the tests: an EmailMessage built in its own message, read back.
export function emailMessageRoundTrip(message) {
  const m = new Message();
  fillEmailMessage(m.initRoot(EmailMessage), message);
  return new Message(m.toArrayBuffer(), false).getRoot(EmailMessage);
}
