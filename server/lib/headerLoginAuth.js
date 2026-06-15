import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

function normalizeHeaderValue(value) {
  if (Array.isArray(value)) {
    return normalizeHeaderValue(value[0]);
  }
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
}

function getHeaderByName(req, headerName) {
  if (!headerName || !req?.headers) {
    return '';
  }
  const direct = req.headers[headerName];
  if (direct) {
    return normalizeHeaderValue(direct);
  }
  const lower = req.headers[String(headerName).toLowerCase()];
  return normalizeHeaderValue(lower);
}

function normalizeUsername(rawUsername) {
  const value = normalizeHeaderValue(rawUsername)
    .replace(/[\\/]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  return value.slice(0, 64);
}

function normalizeEmail(rawEmail) {
  const value = normalizeHeaderValue(rawEmail).toLowerCase();
  if (!value || !value.includes('@') || value.includes(' ')) {
    return '';
  }
  return value.slice(0, 254);
}

// Parse a comma-separated IP env var into a normalized list (trimmed, with
// IPv4-mapped IPv6 collapsed to IPv4, e.g. "::ffff:10.0.0.1" -> "10.0.0.1", and
// empties dropped) so values match operator-configured allowlist entries.
function parseIpList(raw) {
  return normalizeHeaderValue(raw || '')
    .split(',')
    .map(ip => ip.trim().replace(/^::ffff:/i, ''))
    .filter(Boolean);
}

// SECURITY (GHSA-jggc-qvfc-jr6x): the source IP used for the header-login
// allowlist must come from the real TCP peer of the connection, NOT from the
// client-supplied X-Forwarded-For header. X-Forwarded-For is fully
// attacker-controlled, so deriving the source IP from it let anyone able to
// reach the app port directly spoof an allowlisted proxy IP and be minted a
// passwordless session for any existing user (including admin).
//
// Multi-proxy support is OPT-IN via HEADER_LOGIN_TRUSTED_PROXIES: X-Forwarded-For
// is consulted ONLY when the immediate TCP peer is one of those explicitly
// trusted proxies, and even then we take the right-most hop that is not itself a
// trusted proxy (the real client) — never the spoofable left-most value. A
// direct attacker's socket peer is not a trusted proxy, so their X-Forwarded-For
// is ignored entirely.
function getRequestIp(req) {
  const socketIp = normalizeHeaderValue(
    req?.socket?.remoteAddress || req?.connection?.remoteAddress || '',
  ).replace(/^::ffff:/i, '');

  const trustedProxies = parseIpList(process.env.HEADER_LOGIN_TRUSTED_PROXIES);
  if (socketIp && trustedProxies.length && trustedProxies.includes(socketIp)) {
    const forwardedFor = normalizeHeaderValue(req?.headers?.['x-forwarded-for']);
    if (forwardedFor) {
      const hops = forwardedFor
        .split(',')
        .map(hop => hop.trim().replace(/^::ffff:/i, ''))
        .filter(Boolean);
      // Walk right-to-left, skipping known trusted-proxy hops; the first
      // untrusted hop is the real client.
      for (let i = hops.length - 1; i >= 0; i -= 1) {
        if (!trustedProxies.includes(hops[i])) {
          return hops[i];
        }
      }
    }
  }

  return socketIp;
}

function isTrustedHeaderLoginSource(req) {
  const trustedIps = parseIpList(
    process.env.HEADER_LOGIN_TRUSTED_IP || process.env.HEADER_LOGIN_TRUSTED_IPS,
  );

  // SECURITY (GHSA-jggc-qvfc-jr6x): fail CLOSED. With no configured allowlist
  // there is nothing to authorize the header-injected identity against, so
  // header-login must NOT authenticate anyone. (Previously this returned true
  // and trusted every source, silently opening passwordless login to all
  // callers whenever the allowlist was unset.)
  if (trustedIps.length === 0) {
    return false;
  }

  const requestIp = getRequestIp(req);
  return !!requestIp && trustedIps.includes(requestIp);
}

function hasMeteorLoginTokenCookie(req) {
  const cookieHeader = normalizeHeaderValue(req?.headers?.cookie || '');
  if (!cookieHeader) {
    return false;
  }
  return cookieHeader.split(';').some(part => {
    const token = part.trim().split('=')[0];
    return token === 'meteor_login_token';
  });
}

function shouldProcessHeaderLoginMiddlewareRequest(req) {
  if (req?.method !== 'GET') {
    return false;
  }

  const requestPath = (req?.url || '').split('?')[0] || '';
  if (requestPath.startsWith('/api/') || requestPath.startsWith('/sockjs/')) {
    return false;
  }

  if (hasMeteorLoginTokenCookie(req)) {
    return false;
  }

  return true;
}

async function findOrCreateHeaderLoginUser(req) {
  const isSandstorm = Meteor.settings?.public?.sandstorm === true;
  if (isSandstorm) {
    return null;
  }

  const idHeaderName = process.env.HEADER_LOGIN_ID;
  if (!idHeaderName) {
    return null;
  }

  if (!isTrustedHeaderLoginSource(req)) {
    throw new Meteor.Error('unauthorized', 'Header login source is not trusted');
  }

  const usernameHeader = getHeaderByName(req, idHeaderName);
  const username = normalizeUsername(usernameHeader);
  if (!username) {
    return null;
  }

  const firstName = normalizeHeaderValue(getHeaderByName(req, process.env.HEADER_LOGIN_FIRSTNAME));
  const lastName = normalizeHeaderValue(getHeaderByName(req, process.env.HEADER_LOGIN_LASTNAME));
  const fullName = `${firstName} ${lastName}`.trim();
  const email = normalizeEmail(getHeaderByName(req, process.env.HEADER_LOGIN_EMAIL));

  let user = await Meteor.users.findOneAsync({ username });
  if (!user && email) {
    user = await Meteor.users.findOneAsync({ 'emails.address': email });
  }

  if (!user) {
    const userDoc = {
      username,
      authenticationMethod: 'header',
      profile: {
        fullname: fullName || username,
      },
    };

    if (email) {
      userDoc.emails = [{ address: email, verified: true }];
    }

    const newUserId = await Accounts.insertUserDoc({}, userDoc);
    user = await Meteor.users.findOneAsync({ _id: newUserId });
  }

  return user?._id || null;
}

export {
  normalizeHeaderValue,
  getHeaderByName,
  normalizeUsername,
  normalizeEmail,
  getRequestIp,
  isTrustedHeaderLoginSource,
  hasMeteorLoginTokenCookie,
  shouldProcessHeaderLoginMiddlewareRequest,
  findOrCreateHeaderLoginUser,
};
