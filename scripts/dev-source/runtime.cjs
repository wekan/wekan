const fs = require('fs'),
  path = require('path'),
  Module = require('module');
const root = process.cwd();
const tool = process.env.WEKAN_SOURCE_TOOL;
const state = path.join(root, '.tools/dev-source', process.env.PORT);
fs.mkdirSync(state, {
  recursive: true
});
process.env.WEKAN_SOURCE_STATE = state;
// Cache installed/local Meteor package transforms, never application bundles.
process.env.BABEL_CACHE_DIR = path.join(state, 'package-cache');
fs.mkdirSync(process.env.BABEL_CACHE_DIR, { recursive: true });
require(path.join(tool, 'tools/tool-env/install-babel.js'));
const { convertToStandardPath: standardPath } = require(path.join(tool, 'tools/static-assets/server/mini-files'));
const {
  LocalCatalog
} = require(path.join(tool, 'tools/packaging/catalog/catalog-local'));
const bp = path.join(tool, 'tools/isobuild/bundler.js');
const mod = new Module(bp, module);
mod.filename = bp;
mod.paths = Module._nodeModulePaths(path.dirname(bp));
require.cache[bp] = mod;
// Meteor does not export its in-memory targets. Adapt this one export in memory;
// the installed distribution and all application source files remain untouched.
const bundlerSource = fs.readFileSync(bp, 'utf8');
const exportMarker = 'exports.NodeModulesDirectory = NodeModulesDirectory;';
if (!bundlerSource.includes(exportMarker)) throw Error('This Meteor linker is unsupported by Dev server nobuild; update the source-loader adapter.');
mod._compile(bundlerSource.replace(exportMarker, exportMarker + ' exports.SourceClient = ClientTarget; exports.SourceServer = JsImageTarget;'), bp);
mod.loaded = true;
const toolMain = new Module(path.join(tool, 'tools/index.js'));
toolMain.filename = path.join(tool, 'tools/index.js');
toolMain.paths = Module._nodeModulePaths(path.join(tool, 'tools'));
process.mainModule = toolMain;
const bm = require(path.join(tool, 'tools/utils/buildmessage'));
const {
  PackageMap
} = require(path.join(tool, 'tools/packaging/package-map'));
const {
  IsopackCache
} = require(path.join(tool, 'tools/isobuild/isopack-cache'));
const {
  Isopack
} = require(path.join(tool, 'tools/isobuild/isopack'));
const versions = Object.fromEntries(fs.readFileSync('.meteor/versions', 'utf8').trim().split('\n').map(l => l.split('@')));
const packagePath = (n, v) => path.resolve(process.env.METEOR_WAREHOUSE_DIR, 'packages', n.replace(/:/g, '_'), v);
require(path.join(tool, "tools/utils/fiber-helpers")).makeGlobalAsyncLocalStorage().run({}, async () => {
  await require(path.join(tool, 'tools/tool-env/isopackets')).ensureIsopacketsLoadable();
  const {
    MongoRunner
  } = require(path.join(tool, 'tools/runners/run-mongo'));
  const mongoPort = Number(process.env.WEKAN_SOURCE_MONGO_PORT || Number(process.env.PORT) + 1);
  if (!Number.isInteger(mongoPort) || mongoPort < 1 || mongoPort > 65535 || mongoPort === Number(process.env.PORT)) throw Error('Invalid development MongoDB port');
  const mongo = new MongoRunner({
    projectLocalDir: standardPath(state),
    port: mongoPort,
    onFailure: () => {
      throw Error('Development MongoDB failed to start');
    }
  });
  // Never terminate another development database to acquire its port.
  mongo.firstStart = false;
  let closing = false;
  const stop = async code => {
    if (closing) return;
    closing = true;
    mongo.stop();
    if (global.Package?.webapp?.WebApp?.httpServer) Package.webapp.WebApp.httpServer.close();
    const net = require('node:net');
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      const open = await new Promise(resolve => {
        const socket = net.connect({
          host: '127.0.0.1',
          port: mongo.port
        });
        socket.on('connect', () => {
          socket.destroy();
          resolve(true);
        });
        socket.on('error', () => resolve(false));
        socket.setTimeout(500, () => {
          socket.destroy();
          resolve(false);
        });
      });
      if (!open) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    process.exit(code);
  };
  process.on('SIGINT', () => stop(130));
  process.on('SIGTERM', () => stop(143));
  process.on('exit', () => mongo.stop());
  await mongo.start();
  if (!mongo.handle) throw Error('Development MongoDB did not become ready');
  if (process.send) process.send({ type: 'source-mongo-started', port: mongoPort });
  process.env.MONGO_URL = mongo.mongoUrl().replace(/meteor$/, process.env.WEKAN_SOURCE_MONGO_DATABASE === 'wekan' ? 'wekan' : 'meteor');
  process.env.MONGO_OPLOG_URL = mongo.oplogUrl();
  console.log(`Source server: ${process.env.ROOT_URL}; bundled development MongoDB: ${process.env.MONGO_URL}`);
  const messages = await require(path.join(tool, "tools/utils/fiber-helpers")).makeGlobalAsyncLocalStorage().run({}, () => bm.capture(async () => {
    await require(path.join(tool, 'tools/packaging/catalog/catalog')).official.initialize({
      offline: true
    });
    const localCatalog = new LocalCatalog();
    await localCatalog.initialize({
      localPackageSearchDirs: [standardPath(path.join(root, 'packages'))]
    });
    const packageMap = new PackageMap(versions, {
      localCatalog
    });
    const cache = new IsopackCache({
      packageMap,
      tropohouse: {
        packagePath: (name, version) => standardPath(packagePath(name, version))
      }
    });
    for (const [name, version] of Object.entries(versions)) {
      let dir = packagePath(name, version);
      if (localCatalog.getPackageSource(name)) continue;
      if (!fs.existsSync(dir)) throw Error(`missing ${name}`);
      const iso = new Isopack();
      await iso.initFromPath(name, standardPath(dir));
      cache._isopacks[name] = iso;
    }
    for (const name of Object.keys(versions)) if (localCatalog.getPackageSource(name)) await cache._ensurePackageLoaded(name, {
      [name]: true
    });
    const use = fs.readFileSync('.meteor/packages', 'utf8').split('\n').map(x => x.split('#')[0].trim().split('@')[0]).filter(x => x && !['rspack', 'standard-minifier-css', 'standard-minifier-js', 'meteortesting:mocha', 'hot-module-replacement'].includes(x));
    const t = new mod.exports.SourceServer({
      packageMap,
      isopackCache: cache,
      sourceRoot: standardPath(root),
      arch: require(path.join(tool, 'tools/utils/archinfo')).host(),
      buildMode: 'development'
    });
    console.log('Linking packages', use.length);
    await t.make({
      packages: use,
      minifyMode: 'development'
    });
    const browser = require('./browser.cjs');
    const client = new mod.exports.SourceClient({
      packageMap,
      isopackCache: cache,
      sourceRoot: standardPath(root),
      arch: 'web.browser',
      buildMode: 'development'
    });
    await client.make({
      packages: use,
      minifyMode: 'development',
      minifiers: []
    });
    await browser.prepare(client);
    const image = t.toJsImage();
    console.log('Linked', image.jsToLoad.length);
    global.__meteor_bootstrap__ = {
      startupHooks: [],
      serverDir: path.join(state, 'server'),
      configJson: {
        clientPaths: {
          'web.browser': '../web.browser'
        }
      },
      isFibersDisabled: true
    };
    global.__meteor_runtime_config__ = {
      meteorRelease: fs.readFileSync('.meteor/release', 'utf8').trim(),
      ROOT_URL: process.env.ROOT_URL,
      ROOT_URL_PATH_PREFIX: new URL(process.env.ROOT_URL).pathname.replace(/\/+$/, '')
    };
    global.Package = await image.load({
      __meteor_bootstrap__,
      __meteor_runtime_config__,
      dynamicImportInfo: {
        server: {
          dynamicRoot: path.join(state, 'dynamic')
        }
      }
    });
    for (const [name, exports] of Object.entries(Package)) {
      if (name.startsWith('_')) continue;
      for (const [key, value] of Object.entries(exports)) if (key !== 'global' && key !== 'main' && !(key in global)) global[key] = value;
      const id = path.join(state, 'meteor', name + '.js');
      require.cache[id] = {
        id,
        filename: id,
        loaded: true,
        exports
      };
    }
    const resolve = Module._resolveFilename;
    Module._resolveFilename = function (id, parent, ...args) {
      if (id.startsWith('meteor/') && Package[id.slice(7)]) return path.join(state, 'meteor', id.slice(7) + '.js');
      if (id.startsWith('/') && !id.startsWith(root + '/') && (fs.existsSync(root + id) || fs.existsSync(root + id + '.js'))) id = root + id;
      return resolve.call(this, id, parent, ...args);
    };
    const {
      transform
    } = require('./transform.cjs');
    const js = Module._extensions['.js'];
    Module._extensions['.js'] = function (m, file) {
      const rel = path.relative(root, file);
      if (/^(imports|models|server|client|config)[/\\]/.test(rel) || rel === 'sandstorm.js') {
        const source = fs.readFileSync(file, 'utf8');
        return m._compile(transform(source, file, 'inline'), file);
      }
      return js(m, file);
    };
    const privatePath = file => {
      const base = path.join(root, 'private');
      const result = path.resolve(base, file);
      if (!result.startsWith(base + path.sep)) throw Error('Invalid private asset path');
      return result;
    };
    global.Assets = {
      getTextAsync: async file => fs.promises.readFile(privatePath(file), 'utf8'),
      getBinaryAsync: async file => fs.promises.readFile(privatePath(file)),
      absoluteFilePath: file => privatePath(file)
    };
    global.Npm = {
      require: Module.createRequire(path.join(root, 'package.json'))
    };
    console.log('Loading source server');
    require(path.join(root, 'server/main.js'));
    Package.webapp.WebApp.rawConnectHandlers.use(browser.middleware);
    Package.webapp.WebApp.rawConnectHandlers.use(__meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '/', Package.webapp.WebApp.express.static(path.join(root, 'public')));
    console.log('Running startup hooks');
    while (__meteor_bootstrap__.startupHooks.length) await __meteor_bootstrap__.startupHooks.shift()();
    __meteor_bootstrap__.startupHooks = null;
    await Package.webapp.main([]);
    console.log('Ready');
    if (process.env.WEKAN_SOURCE_VISUALIZE === '1') console.log('Source module visualizer: ' + process.env.ROOT_URL.replace(/\/+$/, '') + '/__source/visualizer');
    if (process.env.WEKAN_SOURCE_TESTS === '1') stop(await require('./server-tests.cjs')({
      root,
      packagePath,
      versions
    }));
  }));
  if (messages.hasMessages()) {
    console.error(messages.formatMessages());
    stop(1);
  }
}).catch(e => {
  console.error(e);
  process.exit(1);
});
