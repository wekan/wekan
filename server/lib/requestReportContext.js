// Preserve the current HTTP request across awaited work so every Problems
// logger can recover the same actor/address/location context without each route
// having to forward `req` through every helper layer.
import { AsyncLocalStorage } from 'node:async_hooks';
import { WebApp } from 'meteor/webapp';

const requestStorage = new AsyncLocalStorage();

WebApp.handlers.use(function problemReportRequestContext(req, res, next) {
  requestStorage.run(req, next);
});

export function currentReportRequest() {
  return requestStorage.getStore() || null;
}

export default { currentReportRequest };
