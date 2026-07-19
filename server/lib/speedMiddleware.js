// ============================================================================
// Slow-HTTP-request speed detector  (docs/Security/Remediation/WeKan.md §9)
// ----------------------------------------------------------------------------
// Times non-asset HTTP requests and records the ones slower than a threshold to
// the speed stream of the eventlog (Admin Panel → Problems → Speed) via speedLog.
// This is one of WeKan's "detected but not auto-remediated" performance signals.
// Best-effort and never throws into the request path. Server-only.
//
// Threshold: WEKAN_SLOW_REQUEST_MS (default 2000 ms; 0 disables).
// ============================================================================

import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { record as speedRecord } from '/server/lib/speedLog';

const SLOW_MS = parseInt(process.env.WEKAN_SLOW_REQUEST_MS || '2000', 10);

Meteor.startup(() => {
  if (!(SLOW_MS > 0)) return; // disabled

  WebApp.handlers.use((req, res, next) => {
    try {
      const url = req.url || '';
      // Skip static assets / CDN storage to keep the signal about app/API work.
      if (/\.(js|css|png|jpe?g|gif|svg|woff2?|ico|map|webp|avif)(\?|$)/i.test(url) || url.startsWith('/cdn/')) {
        return next();
      }
      const start = Date.now();
      res.on('finish', () => {
        const ms = Date.now() - start;
        if (ms >= SLOW_MS) {
          speedRecord({
            category: 'slow-request',
            severity: ms >= SLOW_MS * 3 ? 'medium' : 'low',
            source: 'http',
            detail: (req.method || 'GET') + ' ' + url.split('?')[0] + ' — ' + ms + 'ms >= ' + SLOW_MS + 'ms',
          });
        }
      });
    } catch (e) {
      /* timing must never break the request */
    }
    next();
  });
});
