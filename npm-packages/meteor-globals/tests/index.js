import test from 'ava';
import fs from 'fs';
import { getGlobal, checkMeteor, ensureDependency, ensureDependencies } from '../src';

global.Package = {
  mongo: { Mongo: true },
  meteor: { Meteor: { isClient: false } },
  underscore: { _: true },
  'cultofcoders:redis-oplog': { RedisOplog: true },
};
fs.writeFileSync('./.meteor/packages', '');

test(async (t) => {
  t.is(getGlobal('mongo', 'Mongo'), true);
  t.is(getGlobal('underscore', '_'), true);
  t.is(getGlobal('cultofcoders:redis-oplog', 'RedisOplog'), true);
  t.is(getGlobal('tracker', 'Tracker'), undefined);

  t.true(getGlobal('mongo').Mongo);
});

test(async (t) => {
  t.true(checkMeteor({ fileCheck: true }, false));
});

test(async (t) => {
  t.true(checkMeteor(null, false));
});

test(async (t) => {
  t.false(ensureDependency('mongo'));
  t.true(ensureDependency('some:meteor-package'));
  ensureDependencies('some:meteor-package', { restart: false });
  ensureDependencies(['some:meteor-package'], { restart: false });
  ensureDependencies(['some:meteor-package'], false);
});

test(async (t) => {
  t.false(ensureDependency('some:meteor-package@1.0.0'));
  t.true(ensureDependency('another:meteor-package@1.0.0'));
  const result = ensureDependency('another:meteor-package@2.0.0');
  t.is(result.installedVersion, '1.0.0');
  t.is(result.neededVersion, '2.0.0');
  t.is(result.name, 'another:meteor-package');
});
