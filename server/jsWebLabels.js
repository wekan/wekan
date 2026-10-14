// #1040: the JS Web Labels page LibreJS reads (models/lib/jsWebLabels.js),
// built from the client bundle this server is serving.
import { WebApp } from 'meteor/webapp';

const { bundleScripts, renderJsWebLabels } = require('/models/lib/jsWebLabels');

function prefix() {
  return (typeof __meteor_runtime_config__ !== 'undefined' && __meteor_runtime_config__.ROOT_URL_PATH_PREFIX) || '';
}

WebApp.handlers.get('/jslicense.html', (req, res) => {
  try {
    const programs = WebApp.clientPrograms || {};
    const scripts = [...new Set(['web.browser', 'web.browser.legacy']
      .flatMap(arch => bundleScripts(programs[arch] && programs[arch].manifest, prefix())))];
    const version = (() => { try { return require('/package.json').version; } catch (e) { return ''; } })();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.end(renderJsWebLabels({ scripts, version }));
  } catch (error) {
    res.statusCode = 500;
    res.end();
  }
});

