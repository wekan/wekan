import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';

// Optional HTTPS in WeKan's own server (#916; settings in
// models/lib/httpsConfig.js). Meteor's HTTP server is what DDP, its websockets
// and every route attach to, so it is not replaced: a TLS listener takes the
// encrypted connections and hands each decrypted socket to that same server.
// Everything WeKan serves over HTTP it then serves over HTTPS too.
//
// The certificate is read again when its file changes, so a renewal (certbot,
// acme.sh) needs no restart. With HTTPS_REDIRECT=true, a plain-HTTP request
// gets a redirect to HTTPS instead of the page.
const { httpsConfig, redirectLocation } = require('/models/lib/httpsConfig');
const { startHttpsBridge } = require('/server/lib/httpsBridge');

let config = null;
try {
  config = httpsConfig();
} catch (error) {
  console.error(`HTTPS is not started: ${error.message}`);
}

if (config) {
  if (config.redirect) {
    WebApp.rawConnectHandlers.use((req, res, next) => {
      if (req.socket && req.socket.encrypted) return next();
      const location = redirectLocation(req.headers.host, req.url, config.port, process.env.ROOT_URL);
      if (!location) return next();
      res.writeHead(301, { Location: location, 'Cache-Control': 'no-store' });
      res.end();
      return undefined;
    });
  }

  Meteor.startup(() => {
    const { server } = startHttpsBridge(WebApp.httpServer, config, { readConfig: () => httpsConfig() });
    server.listen(config.port, config.host, () => {
      console.log(`WeKan serves HTTPS on ${config.host || 'all addresses'}:${config.port}.`);
    });
  });
}

export { config as httpsServerConfig };
