import getGlobal from './getGlobal';
import findDotMeteorDir from './findDotMeteorDir';

const checks = {
  fileCheck() {
    if (process.env.NODE_ENV === 'production') return true;
    const meteor = getGlobal('meteor', 'Meteor');
    if (!meteor) return false;
    if (meteor.isClient) return true;
    const dotMeteor = findDotMeteorDir();
    return !!dotMeteor;
  },
  globalCheck() {
    return !!global.Package;
  },
};


export default function checkMeteor(opts, exception = false) {
  const options = Object.assign({
    fileCheck: false,
    globalCheck: true,
  }, opts);

  let result = true;
  Object.keys(options).forEach((key) => {
    if (!result || !options[key]) return;
    result = checks[key]();
  });

  if (exception) throw new Error('meteor-globals has to be run inside a meteor project!');
  return result;
}
