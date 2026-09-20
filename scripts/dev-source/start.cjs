'use strict';

// The installed Meteor distribution supplies Node, MongoDB and package code.
// Application JavaScript is loaded by runtime.cjs from the checkout itself.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const net = require('node:net');
const {
  spawn
} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
async function waitForPortRelease(port, timeout = 15000) {
  const deadline = Date.now() + timeout;
  do {
    const occupied = await new Promise(resolve => {
      const socket = net.connect({ host: '127.0.0.1', port });
      const finish = value => { socket.destroy(); resolve(value); };
      socket.once('connect', () => finish(true));
      socket.once('error', error => finish(error.code !== 'ECONNREFUSED'));
      socket.setTimeout(500, () => finish(true));
    });
    if (!occupied) return true;
    if (Date.now() >= deadline) return false;
    await new Promise(resolve => setTimeout(resolve, 100));
  } while (true);
}
function findMeteor() {
  const release = fs.readFileSync(path.join(root, '.meteor/release'), 'utf8').trim().split('@')[1];
  const version = release.replace(/^(\d+\.\d+)(-)/, '$1.0$2');
  const warehouses = [process.env.METEOR_WAREHOUSE_DIR, path.join(os.homedir(), '.meteor'), process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, '.meteor'), path.join(root, '.tools/.meteor')].filter(Boolean);
  const arch = `os.${process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'osx' : process.platform}.${process.arch === 'arm64' ? process.platform === 'darwin' ? 'arm64' : 'aarch64' : 'x86_64'}`;
  for (const warehouse of warehouses) {
    const tool = path.join(warehouse, 'packages/meteor-tool', version, `mt-${arch}`);
    const node = path.join(tool, 'dev_bundle/bin', process.platform === 'win32' ? 'node.exe' : 'node');
    if (fs.existsSync(node)) return {
      warehouse,
      tool,
      node
    };
  }
  throw new Error(`Install the checkout's Meteor ${release} with the build menu first; its Node toolchain was not found.`);
}
function options(argv) {
  let port = 3000;
  let visualize = false;
  let serverTests = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--port') port = Number(argv[++i]);else if (argv[i] === '--extra-packages' && argv[++i] === 'bundle-visualizer') visualize = true;else if (argv[i] === '--server-tests') serverTests = true;else if (argv[i] !== '--production') throw new Error(`Unknown source-server option: ${argv[i]}`);
  }
  if (!Number.isInteger(port) || port < 1 || port > 65534) throw new Error('Dev port must be between 1 and 65534 (MongoDB uses the next port).');
  return {
    port,
    visualize,
    serverTests
  };
}
if (require.main === module) {
  try {
    const meteor = findMeteor();
    const {
      port,
      visualize,
      serverTests
    } = options(process.argv.slice(2));
    const temp = path.join(root, '.tools/tmp');
    fs.mkdirSync(temp, {
      recursive: true
    });
    const spawnOptions = {
      cwd: root,
      stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
      env: {
        ...process.env,
        WRITABLE_PATH: process.env.WRITABLE_PATH || path.join(root, '.tools/dev-source/files'),
        WITH_API: process.env.WITH_API || 'true',
        DDP_TRANSPORT: process.env.DDP_TRANSPORT || 'sockjs',
        DEFAULT_METEOR_REACTIVITY_ORDER: process.env.DEFAULT_METEOR_REACTIVITY_ORDER || 'changeStreams,oplog,polling',
        TMPDIR: temp,
        ...(process.platform === 'win32' ? {
          TEMP: temp,
          TMP: temp
        } : {}),
        METEOR_WAREHOUSE_DIR: meteor.warehouse,
        WEKAN_SOURCE_TOOL: meteor.tool,
        WEKAN_SOURCE_TESTS: serverTests ? '1' : '0',
        WEKAN_SOURCE_VISUALIZE: visualize ? '1' : '0',
        PORT: String(port),
        ROOT_URL: process.env.ROOT_URL || `http://localhost:${port}`
      }
    };
    let child;
    let restarting = false;
    let stopping = false;
    let debounce;
    const watchers = [];
    function closeWatchers() {
      clearTimeout(debounce);
      for (const watcher of watchers) watcher.close();
    }
    function launch() {
      let ownedMongoPort;
      child = spawn(meteor.node, [path.join(__dirname, 'runtime.cjs')], spawnOptions);
      child.on('message', message => {
        if (message?.type === 'source-mongo-started') ownedMongoPort = message.port;
      });
      child.on('error', error => {
        console.error(error.message);
        closeWatchers();
        process.exitCode = 1;
      });
      child.on('exit', async (code, signal) => {
        // App shutdown hooks may exit before Mongo finishes stopping. Wait in
        // the parent too, but only for a database this child actually started.
        if (ownedMongoPort && !await waitForPortRelease(ownedMongoPort)) {
          console.error(`Development MongoDB port ${ownedMongoPort} did not close.`);
          closeWatchers();
          process.exitCode = 1;
          return;
        }
        if (restarting && !stopping) {
          restarting = false;
          launch();
        } else {
          closeWatchers();
          process.exitCode = code ?? (signal ? 1 : 0);
        }
      });
    }
    for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
      stopping = true;
      closeWatchers();
      child.kill(signal);
    });
    // Tests own their restart boundaries. Interactive development reloads
    // source changes without writing any application build output.
    if (!serverTests && process.env.WEKAN_SOURCE_WATCH !== '0') {
      for (const directory of ['client', 'imports', 'models', 'server', 'packages', 'config', 'public']) {
        const watched = path.join(root, directory);
        if (!fs.existsSync(watched)) continue;
        watchers.push(fs.watch(watched, {
          recursive: true
        }, (_event, filename) => {
          if (!filename || String(filename).split(/[\\/]/).some(part => part.startsWith('.') || part === 'node_modules')) return;
          clearTimeout(debounce);
          debounce = setTimeout(() => {
            if (stopping || restarting) return;
            console.log(`Source changed: ${directory}/${filename}; restarting.`);
            restarting = true;
            child.kill('SIGTERM');
          }, 300);
        }));
      }
    }
    launch();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
module.exports = {
  findMeteor,
  options,
  waitForPortRelease
};
