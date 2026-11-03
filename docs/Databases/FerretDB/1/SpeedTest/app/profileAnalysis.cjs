'use strict';

// A Node inspector CPU profile of the Meteor server, by who spends the time. Apart from
// the browser and the database so a test can drive it with a made-up profile.

function categorise(node) {
  const { functionName, url } = node.callFrame;
  if (functionName === '(idle)') return 'idle';
  if (functionName === '(garbage collector)') return 'garbage collector';
  if (functionName === '(program)') return 'native (program)';
  if (/\/mongodb\/|npm-mongo|\/bson\//.test(url)) return 'MongoDB driver (wire, decode, encode)';
  if (/packages\/ddp-server|packages\/ddp-common|packages\/ddp\b/.test(url)) return 'Meteor DDP (publish, mergebox, sessions)';
  if (/packages\/mongo|minimongo|diff-sequence/.test(url)) return 'Meteor mongo (observe, polling, diff)';
  if (/packages\/ejson/.test(url)) return 'EJSON';
  // Other Meteor packages and dependencies are not WeKan's: their paths contain /server/ too.
  if (/programs\/server\/packages|node_modules/.test(url)) return 'other packages';
  if (/programs\/server\/app|\/_build\/|\/models\/|\/server\/|\/imports\/|wekan/.test(url)) return 'WeKan code';
  if (/^node:/.test(url) || url === '') return 'node internals';
  return 'other packages';
}

function analyse(profile) {
  const byId = new Map(profile.nodes.map((n) => [n.id, n]));
  const cats = new Map();
  const fns = new Map();
  let total = 0;
  profile.samples.forEach((sid, i) => {
    const dt = (profile.timeDeltas[i + 1] ?? profile.timeDeltas[i] ?? 0) / 1000; // ms
    const node = byId.get(sid);
    const cat = categorise(node);
    cats.set(cat, (cats.get(cat) || 0) + dt);
    total += dt;
    if (cat !== 'idle') {
      const key = `${node.callFrame.functionName || '(anonymous)'}  ${node.callFrame.url.split('/').slice(-2).join('/')}`;
      fns.set(key, (fns.get(key) || 0) + dt);
    }
  });
  const idle = cats.get('idle') || 0;
  return {
    totalMs: total, busyMs: total - idle,
    categories: [...cats.entries()].filter(([c]) => c !== 'idle').sort((a, b) => b[1] - a[1]),
    topFunctions: [...fns.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8),
  };
}

module.exports = { categorise, analyse };
