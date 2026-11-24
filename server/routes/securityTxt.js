import { WebApp } from 'meteor/webapp';
import LegalPages from '/models/legalPages';

// /.well-known/security.txt ([RFC9116], WP-9): made from the security contact
// of Admin Panel / Settings / Legal pages (models/lib/securityTxt.js); 404
// while none is set. /security.txt, the older place, answers the same.
const { securityTxt } = require('/models/lib/securityTxt');

async function serveSecurityTxt(req, res, next) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  let body = null;
  try {
    const contacts = await LegalPages.findOneAsync({ _id: 'contacts' }, { fields: { securityContact: 1 } });
    body = securityTxt({ securityContact: contacts && contacts.securityContact, rootUrl: process.env.ROOT_URL });
  } catch (e) {
    body = null;
  }
  if (!body) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Not found\n');
  }
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'max-age=3600' });
  return res.end(req.method === 'HEAD' ? undefined : body);
}

WebApp.handlers.use('/.well-known/security.txt', serveSecurityTxt);
WebApp.handlers.use('/security.txt', serveSecurityTxt);
