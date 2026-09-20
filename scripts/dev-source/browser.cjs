const fs = require('fs'),
  path = require('path'),
  crypto = require('crypto');
const root = process.cwd();
const swc = require(path.join(root, 'node_modules/@swc/core'));
const {
  transform
} = require('./transform.cjs');
const {
  ResolverFactory,
  CachedInputFileSystem
} = require(path.join(root, 'node_modules/enhanced-resolve'));
const alias = require(path.join(root, 'node_modules/@meteorjs/rspack/lib/meteorRspackHelpers')).makeWebNodeBuiltinsAlias();
const resolver = ResolverFactory.createResolver({
  fileSystem: new CachedInputFileSystem(fs, 0),
  useSyncFileSystemCalls: true,
  extensions: ['.js', '.mjs', '.cjs', '.json', '.jade', '.css'],
  conditionNames: ['browser', 'require', 'default'],
  mainFields: ['browser', 'module', 'main'],
  aliasFields: ['browser'],
  alias
});
const {
  ClientImports
} = require('./module-access.cjs');
const access = new ClientImports(root, swc.parseSync);
const store = new Map(),
  dynamic = new Map();
const runtime = `
(function(){
 const cache={},resolved={};
 window.global=window;

 window.process=window.process||{env:{NODE_ENV:'development'},browser:true,nextTick:fn=>queueMicrotask(fn)};
 function load(request,parent){
  if(request.startsWith('meteor/')) return Package[request.slice(7)]||{};
  const key=JSON.stringify([parent,request]);if(resolved[key]&&cache[resolved[key]])return cache[resolved[key]].exports;
  const xhr=new XMLHttpRequest(); xhr.open('GET',(__meteor_runtime_config__.ROOT_URL_PATH_PREFIX||'')+'/__source/module?parent='+encodeURIComponent(parent||'')+'&id='+encodeURIComponent(request),false);xhr.send();
  if(xhr.status!==200) throw Error(xhr.responseText);
  const result=JSON.parse(xhr.responseText);resolved[key]=result.id;
  if(cache[result.id]) return cache[result.id].exports;
  const module={exports:{},id:result.id};cache[result.id]=module;
  const req=id=>load(id,result.id);req.resolve=id=>id;
  new Function('require','module','exports','__filename','__dirname',result.code+'\\n//# sourceURL='+location.origin+'/__source/files/'+result.id)(req,module,module.exports,result.id,result.id.slice(0,result.id.lastIndexOf('/')));
  return module.exports;
 }
 window.sourceLoad=load;
 const install=Package.modules.meteorInstall,proto=install.Module.prototype,original=proto.resolve;
 proto.resolve=function(id){try{return original.call(this,id);}catch(e){
  if(id.startsWith('.')||id.startsWith('/'))throw e;
  const tree={node_modules:{}},parts=id.split('/');let branch=tree.node_modules;
  for(const part of parts.slice(0,-1))branch=branch[part]={};
  branch[parts.at(-1)+'.js']=function(require,exports,module){module.exports=load(id,'');};
  install(tree);return original.call(this,id);
 }};
 const originalRequire=proto.require;proto.require=function(id){this.resolve(id);return originalRequire.call(this,id);};
})();`;
const transformed = new Map();
function moduleCode(id, parent) {
  access.authorize(id, parent || '');
  let spec = id;
  if (spec.startsWith('/') && !spec.startsWith(root + '/')) spec = root + spec;
  const file = resolver.resolveSync({}, parent ? path.dirname(root + '/' + parent) : root, spec);
  if (file === false) return {
    id: 'empty',
    code: 'module.exports={};'
  };
  const rel = access.file(file);
  const stamp = fs.statSync(file).mtimeMs;
  const cached = transformed.get(file);
  if (cached && cached.stamp === stamp) return cached.value;
  let src = fs.readFileSync(file, 'utf8'),
    code;
  if (file.endsWith('.json')) code = 'module.exports=' + src;else if (file.endsWith('.css')) code = `const s=document.createElement('style');s.textContent=${JSON.stringify(src)};document.head.appendChild(s);`;else if (file.endsWith('.jade')) code = require(path.join(root, 'npm-packages/meteor-jade-loader')).call({
    resourcePath: file
  }, src);else code = transform(src, file);
  access.register(rel, code);
  const value = {
    id: rel,
    code
  };
  transformed.set(file, {
    stamp,
    value
  });
  return value;
}
module.exports = {
  async prepare(target) {
    const manifest = [];
    const addScript = (url, body) => {
      store.set(url, {
        body,
        type: 'js'
      });
      manifest.push({
        url,
        path: url.slice(1),
        type: 'js',
        where: 'client',
        cacheable: false,
        size: body.length,
        hash: crypto.createHash('sha1').update(body).digest('hex')
      });
    };
    for (const [type, list] of [['js', target.js], ['css', target.css], ['asset', target.asset]]) for (const file of list) {
      if (file.targetPath.startsWith('dynamic/')) {
        dynamic.set(file.targetPath.slice(8), file.contents().toString());
        access.register('', `(${file.contents().toString()})`);
        continue;
      }
      const url = file.url || '/' + file.targetPath;
      const body = file.contents();
      if (type === 'js') access.register('', body.toString());
      store.set(url.split('?')[0], {
        body,
        type
      });
      manifest.push({
        url,
        path: file.targetPath,
        type,
        where: 'client',
        cacheable: false,
        size: body.length,
        hash: crypto.createHash('sha1').update(body).digest('hex')
      });
      if (file.targetPath === 'packages/modules.js') addScript('/__source/loader.js', runtime);
    }
    addScript('/__source/app.js', `for(const pkg of Object.values(Package)) for(const key in pkg) if(key!=='global'&&key!=='main'&&!(key in window)) window[key]=pkg[key]; window.require=id=>sourceLoad(id,''); sourceLoad('/client/main.js','');`);
    const dir = path.join(process.env.WEKAN_SOURCE_STATE, 'web.browser');
    fs.mkdirSync(dir, {
      recursive: true
    });
    fs.writeFileSync(path.join(dir, 'program.json'), JSON.stringify({
      format: 'web-program-pre1',
      manifest
    }));
  },
  middleware(req, res, next) {
    const url = new URL(req.url, 'http://localhost');
    const prefix = new URL(process.env.ROOT_URL).pathname.replace(/\/+$/, '');
    if (prefix && url.pathname.startsWith(prefix + '/')) url.pathname = url.pathname.slice(prefix.length);
    if (url.pathname.startsWith('/__source/') || url.pathname === '/__meteor__/dynamic-import/fetch') res.setHeader('Cache-Control', 'no-store');
    if (url.pathname === '/__meteor__/dynamic-import/fetch' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
        if (body.length > 100000) req.destroy();
      });
      req.on('end', () => {
        try {
          const walk = (tree, parts = []) => {
            if (typeof tree !== 'object' || tree === null) {
              const code = dynamic.get(parts.join('/').replace(/:/g, '_'));
              if (!code) throw Error('Unknown dynamic module ' + parts.join('/'));
              return code;
            }
            return Object.fromEntries(Object.entries(tree).map(([key, value]) => [key, walk(value, [...parts, key])]));
          };
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(walk(JSON.parse(body))));
        } catch (e) {
          console.error(e);
          res.statusCode = 400;
          res.end('Invalid dynamic import');
        }
      });
      return;
    }
    if (url.pathname === '/__source/status') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        mode: 'source',
        port: Number(process.env.PORT),
        mongoPort: Number(process.env.WEKAN_SOURCE_MONGO_PORT || Number(process.env.PORT) + 1)
      }));
      return;
    }
    if (url.pathname === '/__source/visualizer' && process.env.WEKAN_SOURCE_VISUALIZE === '1') {
      const escape = value => String(value).replace(/[&<>"]/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;'
      })[c]);
      const rows = [...transformed.values()].map(({
        value
      }) => ({
        id: value.id,
        size: Buffer.byteLength(value.code)
      })).sort((a, b) => b.size - a.size);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end('<!doctype html><title>Dev server nobuild modules</title><h1>Loaded source modules</h1><p>In-memory JavaScript sizes. Open application pages, then refresh this report.</p><table><tr><th>Module</th><th>Bytes</th></tr>' + rows.map(row => '<tr><td>' + escape(row.id) + '</td><td>' + row.size + '</td></tr>').join('') + '</table>');
      return;
    }
    if (url.pathname === '/__source/module') {
      try {
        const value = moduleCode(url.searchParams.get('id'), url.searchParams.get('parent'));
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(value));
      } catch (e) {
        console.error(e);
        res.statusCode = 403;
        res.end('Client module unavailable');
      }
      return;
    }
    const item = store.get(url.pathname);
    if (!item) return next();
    res.setHeader('Content-Type', item.type === 'js' ? 'application/javascript' : item.type === 'css' ? 'text/css' : 'application/octet-stream');
    res.end(item.body);
  }
};
