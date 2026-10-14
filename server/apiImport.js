// Import from a service's API (models/lib/apiImportServices.js): the import
// page asks what can be imported, then fetches the chosen one; the JSON it
// gets back is imported like a pasted export, through importBoard. The
// credentials come with each call, are used for that call's requests only,
// and are never stored or logged.
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { assertImportEnabled } from '/models/lib/importExportSecurity';
import { apiImportRequest } from '/server/lib/apiImportRequest';
import * as planka from '/models/lib/apiImport/planka';
import * as mstodo from '/models/lib/apiImport/mstodo';
import * as kanbanflow from '/models/lib/apiImport/kanbanflow';
import * as basecamp from '/models/lib/apiImport/basecamp';
import * as googletasks from '/models/lib/apiImport/googletasks';
import * as googlekeep from '/models/lib/apiImport/googlekeep';

const { apiImportService, cleanApiImportCredentials } = require('/models/lib/apiImportServices');

const CLIENTS = { planka, mstodo, kanbanflow, basecamp, googletasks, googlekeep };
const MAX_ID_LENGTH = 200;

async function prepare(userId, service, credentials) {
  if (!userId) throw new Meteor.Error('error-notAuthorized');
  // Sandstorm reaches other sites only through Powerbox grants.
  if (Meteor.settings?.public?.sandstorm) throw new Meteor.Error('api-import-unavailable', 'Not available in Sandstorm.');
  await assertImportEnabled();
  if (!apiImportService(service) || !CLIENTS[service]) throw new Meteor.Error('api-import-unknown-service');
  try { return cleanApiImportCredentials(service, credentials); }
  catch (error) { throw new Meteor.Error('api-import-credentials', error.message); }
}

// Only the message - origin and status - reaches the page.
const failure = error => new Meteor.Error('api-import-failed', String((error && error.message) || error).slice(0, 300));

Meteor.methods({
  async apiImportList(service, credentials) {
    check(service, String);
    check(credentials, Match.Any);
    const clean = await prepare(this.userId, service, credentials);
    try {
      const items = await CLIENTS[service].list(clean, apiImportRequest);
      return (Array.isArray(items) ? items : []).slice(0, 1000)
        .map(item => ({ id: String(item.id).slice(0, MAX_ID_LENGTH), name: String(item.name || item.id).slice(0, 300) }));
    } catch (error) { throw failure(error); }
  },

  async apiImportFetch(service, credentials, id) {
    check(service, String);
    check(credentials, Match.Any);
    check(id, String);
    const clean = await prepare(this.userId, service, credentials);
    if (!id || id.length > MAX_ID_LENGTH) throw new Meteor.Error('api-import-failed', 'Choose what to import.');
    try {
      return await CLIENTS[service].fetch(clean, id, apiImportRequest);
    } catch (error) { throw failure(error); }
  },
});

// Each call makes requests to another site with the member's credentials.
DDPRateLimiter.addRule({ type: 'method', name: name => ['apiImportList', 'apiImportFetch'].includes(name),
  connectionId: () => true }, 10, 60000);
