'use strict';
const http = require('node:http');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const { SignedXml } = require('xml-crypto');
const { startLdap } = require('./ldap.cjs');
const { parseOAuthHeader } = require('./oauth-header.cjs');
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);
module.exports.startProvider = async ({ privateKey, certificate }) => {
  const state = { mode: 'allow', user: 'alice', events: [], codes: new Map(), tokens: new Map(), tickets: new Map() };
  const ldap = await startLdap(state);
  const server = http.createServer(async (req, res) => {
    try {
      const chunks = []; for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString();
      const url = new URL(req.url, 'http://127.0.0.1');
      const params = new URLSearchParams(url.search);
      for (const [key, value] of new URLSearchParams(raw)) params.set(key, value);
      const json = (value, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(value)); };
      const redirect = value => { res.writeHead(302, { Location: value }); res.end(); };
      if (url.pathname === '/__control') { Object.assign(state, JSON.parse(raw)); state.events = []; return json({ ok: true }); }
      if (url.pathname === '/__events') return json(state.events);
      if (url.pathname === '/__mail') return json(state.messages || []);
      const service = url.pathname.startsWith('/authorize/') ? url.pathname.split('/')[2] : 'oidc';
      if (url.pathname.startsWith('/authorize/') || url.pathname === '/authorize') {
        state.events.push({ protocol: service, operation: 'authorize', params: Object.fromEntries(params) });
        const target = new URL(params.get('redirect_uri') || state.twitterCallback);
        if (service === 'twitter') {
          if (state.mode === 'deny') target.searchParams.set('denied', 'fixture-request-token');
          else { target.searchParams.set('oauth_token', 'fixture-request-token'); target.searchParams.set('oauth_verifier', 'fixture-verifier'); }
        } else {
          target.searchParams.set('state', params.get('state'));
          if (state.mode === 'deny') target.searchParams.set('error', 'access_denied');
          else {
            const code = crypto.randomUUID(); state.codes.set(code, { service, redirect: params.get('redirect_uri'), user: state.user });
            target.searchParams.set('code', code);
          }
        }
        return redirect(target.toString());
      }
      if (url.pathname === '/cas/login') {
        const serviceUrl = params.get('service'); const ticket = 'ST-' + crypto.randomUUID();
        state.events.push({ protocol: 'cas', operation: 'authorize', service: serviceUrl });
        state.tickets.set(ticket, { service: serviceUrl, user: state.user });
        const target = new URL(serviceUrl); target.searchParams.set('ticket', ticket); return redirect(target.toString());
      }
      if (url.pathname.includes('cas.identity.invalid')) {
        const ticket = state.tickets.get(params.get('ticket')); state.tickets.delete(params.get('ticket'));
        const valid = ticket && ticket.service === params.get('service') && state.mode !== 'deny';
        state.events.push({ protocol: 'cas', operation: 'validate', accepted: !!valid, service: params.get('service') });
        res.setHeader('Content-Type', 'application/xml');
        return res.end(`<cas:serviceResponse xmlns:cas="http://www.yale.edu/tp/cas">${valid ? `<cas:authenticationSuccess><cas:user>${ticket.user}.cas</cas:user><cas:attributes><cas:givenName>Alice</cas:givenName><cas:sn>CAS</cas:sn><cas:mail>${ticket.user}.cas@example.invalid</cas:mail></cas:attributes></cas:authenticationSuccess>` : '<cas:authenticationFailure code="INVALID_TICKET">Denied</cas:authenticationFailure>'}</cas:serviceResponse>`);
      }
      if (url.pathname === '/saml') {
        const request = zlib.inflateRawSync(Buffer.from(params.get('SAMLRequest'), 'base64')).toString();
        const id = /\bID="([^"]+)"/.exec(request)[1];
        const acs = /AssertionConsumerServiceURL="([^"]+)"/.exec(request)[1];
        const issuer = /<(?:\w+:)?Issuer[^>]*>([^<]+)</.exec(request)[1];
        state.events.push({ protocol: 'saml', operation: 'authorize', requestId: id, acs, issuer });
        const now = new Date().toISOString(), expires = new Date(Date.now() + (state.mode === 'expired' ? -600000 : 300000)).toISOString();
        const uid = '_' + crypto.randomUUID();
        let xml = `<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="${uid}" Version="2.0" IssueInstant="${now}" Destination="${esc(acs)}" InResponseTo="${esc(id)}"><saml:Issuer>fixture-idp</saml:Issuer><samlp:Status><samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/></samlp:Status><saml:Assertion ID="_${crypto.randomUUID()}" Version="2.0" IssueInstant="${now}"><saml:Issuer>fixture-idp</saml:Issuer><saml:Subject><saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">${state.user}.saml@example.invalid</saml:NameID><saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer"><saml:SubjectConfirmationData InResponseTo="${esc(id)}" Recipient="${esc(acs)}" NotOnOrAfter="${expires}"/></saml:SubjectConfirmation></saml:Subject><saml:Conditions NotBefore="${new Date(Date.now()-60000).toISOString()}" NotOnOrAfter="${expires}"><saml:AudienceRestriction><saml:Audience>${esc(issuer)}</saml:Audience></saml:AudienceRestriction></saml:Conditions><saml:AuthnStatement AuthnInstant="${now}" SessionIndex="fixture-session"><saml:AuthnContext><saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport</saml:AuthnContextClassRef></saml:AuthnContext></saml:AuthnStatement><saml:AttributeStatement><saml:Attribute Name="displayName"><saml:AttributeValue>Alice SAML</saml:AttributeValue></saml:Attribute></saml:AttributeStatement></saml:Assertion></samlp:Response>`;
        if (state.mode !== 'unsigned') {
          const signer = new SignedXml({ privateKey, publicCert: certificate,
            signatureAlgorithm: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256', canonicalizationAlgorithm: 'http://www.w3.org/2001/10/xml-exc-c14n#' });
          signer.addReference({ xpath: "/*[local-name()='Response']", transforms: ['http://www.w3.org/2000/09/xmldsig#enveloped-signature', 'http://www.w3.org/2001/10/xml-exc-c14n#'], digestAlgorithm: 'http://www.w3.org/2001/04/xmlenc#sha256' });
          signer.computeSignature(xml, { location: { reference: "/*[local-name()='Response']/*[local-name()='Issuer']", action: 'after' } }); xml = signer.getSignedXml();
        }
        if (state.mode === 'tampered') xml = xml.replace('Alice SAML', 'Mallory SAML');
        res.setHeader('Content-Type', 'text/html');
        return res.end(`<form method="post" action="${esc(acs)}"><input name="SAMLResponse" value="${Buffer.from(xml).toString('base64')}"><input name="RelayState" value="${esc(params.get('RelayState'))}"></form><script>document.forms[0].submit()</script>`);
      }
      if (url.pathname.startsWith('/social/api.twitter.com/')) {
        let oauth;
        try { oauth = parseOAuthHeader(req.headers.authorization); }
        catch (_) { return json({ error: 'invalid_oauth_header' }, 400); }
        const path = url.pathname.replace('/social/api.twitter.com', '');
        const tokenSecret = path.endsWith('/access_token') ? 'fixture-request-secret' : path.includes('verify_credentials') ? 'fixture-access-secret' : '';
        const encode = value => encodeURIComponent(value).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
        const signatureParams = [...params.entries(), ...Object.entries(oauth).filter(([key]) => key !== 'oauth_signature')]
          .map(([key, value]) => [encode(key), encode(value)]).sort((a, b) => a.join('=') < b.join('=') ? -1 : a.join('=') > b.join('=') ? 1 : 0);
        const baseString = [req.method, 'https://api.twitter.com' + path, signatureParams.map(pair => pair.join('=')).join('&')].map(encode).join('&');
        const signature = crypto.createHmac('sha1', 'fixture-secret&' + tokenSecret).update(baseString).digest('base64');
        const accepted = signature === oauth.oauth_signature;
        state.events.push({ protocol: 'twitter', operation: path.includes('verify_credentials') ? 'userinfo' : 'token', accepted, secretMatches: accepted, bearerAccepted: accepted, path });
        if (!accepted) return json({ error: 'invalid_signature' }, 401);
        res.setHeader('Content-Type', 'application/x-www-form-urlencoded');
        if (path.endsWith('/request_token')) { state.twitterCallback = oauth.oauth_callback || params.get('oauth_callback'); return res.end('oauth_token=fixture-request-token&oauth_token_secret=fixture-request-secret&oauth_callback_confirmed=true'); }
        if (path.endsWith('/access_token')) return res.end('oauth_token=fixture-twitter-access&oauth_token_secret=fixture-access-secret&user_id=alice-twitter&screen_name=alice.twitter');
        return json({ id_str: 'alice-twitter', screen_name: 'alice.twitter', name: 'Alice Twitter', email: 'alice.twitter@example.invalid' });
      }
      // Both configurable OAuth2 and the fixed-url Meteor social adapters.
      const path = url.pathname;
      const tokenRequest = /(?:\/token|\/access_token|\/oauth2\/access)$/.test(path);
      if (tokenRequest) {
        const code = state.codes.get(params.get('code')); state.codes.delete(params.get('code'));
        const valid = code && params.get('redirect_uri') === code.redirect && params.get('client_id') === 'fixture-client' && params.get('client_secret') === 'fixture-secret';
        state.events.push({ protocol: code?.service || 'unknown', operation: 'token', method: req.method,
          clientId: params.get('client_id'), secretMatches: params.get('client_secret') === 'fixture-secret', grant: params.get('grant_type'), redirect: params.get('redirect_uri'), accepted: !!valid });
        if (!valid || state.mode === 'bad-token') return json({ error: 'invalid_grant' }, 400);
        const access = 'fixture-access-' + crypto.randomUUID(); state.tokens.set(access, code);
        return json({ access_token: access, token_type: 'Bearer', expires_in: 3600, uid: code.service === 'weibo' ? '123456789' : `${code.user}-${code.service}` });
      }
      const access = params.get('access_token') || (req.headers.authorization || '').replace(/^(?:Bearer|token)\s+/i, '');
      const identity = state.tokens.get(access);
      state.events.push({ protocol: identity?.service || 'unknown', operation: 'userinfo', path, bearerAccepted: !!identity });
      if (!identity) return json({ error: 'invalid_token' }, 401);
      const name = identity.user, key = identity.service, email = `${name}.${key}@example.invalid`;
      const profile = { id: `${name}-${key}`, sub: `${name}-${key}`, login: `${name}.${key}`, username: `${name}.${key}`,
        name: `Alice ${key}`, displayName: `Alice ${key}`, email, email_verified: true, verified_email: true, screen_name: `${name}.${key}`, lang: 'en' };
      if (state.mode === 'empty-userinfo') return json(null);
      if (path.endsWith('/user/emails')) return json([{ email, primary: true, verified: true }]);
      if (path.endsWith('/tokeninfo')) return json({ audience: 'fixture-client', user_id: profile.id, scope: 'openid email profile' });
      if (path.endsWith('/api/v1/identity')) return json({ id: profile.id, ...profile, emails: [{ address: email, verified: true }] });
      if (path.endsWith('/2/members')) return json({ results: [profile] });
      return json(profile);
    } catch (_) {
      // Even a loopback-only test server must not return local paths, stack
      // traces or request-derived exception messages to an HTTP caller.
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Identity fixture request failed');
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { state, ldapPort: ldap.port, url: `http://127.0.0.1:${server.address().port}`,
    close: async () => { await ldap.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); } };
};
