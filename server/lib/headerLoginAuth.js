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

function getRequestIp(req) {
  const forwardedFor = normalizeHeaderValue(req?.headers?.['x-forwarded-for']);
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return normalizeHeaderValue(req?.socket?.remoteAddress || req?.connection?.remoteAddress || '');
}

function isTrustedHeaderLoginSource(req) {
  const trustedRaw = normalizeHeaderValue(process.env.HEADER_LOGIN_TRUSTED_IP || process.env.HEADER_LOGIN_TRUSTED_IPS || '');
  if (!trustedRaw) {
    return true;
  }

  const trustedIps = trustedRaw
    .split(',')
    .map(ip => ip.trim())
    .filter(Boolean);
  if (trustedIps.length === 0) {
    return true;
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
