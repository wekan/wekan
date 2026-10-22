// The other end of reportToWekan() in WeKan's forks of Meteor's allow-deny,
// ddp-server, dynamic-import, google-oauth and facebook-oauth packages
// (packages/). Those carry the Meteor 3.5.3 security fixes, and a refused
// attempt is recorded in Admin Panel / Problems through this hook. A package
// cannot import application code, so it calls a global; securityLog is loaded
// on the first event, not here, because this runs before the models exist.
const { meteorSecurityEvent } = require('/models/lib/meteorSecurityEvent.cjs');

let record = null;

export function installMeteorSecurityHook(target = globalThis) {
  target.__wekanSecurityRecord = (evt) => {
    try {
      const event = meteorSecurityEvent(evt);
      if (!event) return;
      if (!record) record = require('/server/lib/securityLog').record;
      record(event);
    } catch (e) { /* logging must never break the guard */ }
  };
}
