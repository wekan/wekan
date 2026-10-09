import checkMeteor from './checkMeteor';
import ensureDependency from './ensureDependency';

export default function ensureDependencies(...args) {
  let options = {
    restart: true,
    name: 'A recently installed npm package',
  };
  if (typeof args[args.length - 1] !== 'string') {
    const userOpts = args.pop();
    if (typeof userOpts === 'boolean') {
      options.restart = userOpts;
    } else {
      options = Object.assign(options, userOpts);
    }
  }

  const inMeteor = checkMeteor({
    fileCheck: true,
    globalCheck: true,
  });
  if (!inMeteor) throw new Error(`${options.name} has to be installed inside a meteor project!`);

  const deps = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
  const installedDeps = [];
  deps.forEach((dep) => {
    const result = ensureDependency(dep, false);
    if (result && !result.neededVersion) installedDeps.push(dep);
    if (result && result.neededVersion) {
      console.log(`=> ${options.name} depends on ${result.name}@${result.neededVersion} but version ${result.installedVersion} is installed.`);
    }
  });
  if (options.restart && installedDeps.length) {
    console.log();
    console.log(`=> ${options.name} depends on some meteor packages from atmosphere.`);
    console.log('=> These dependencies were installed automatically.');
    console.log('=> Please restart meteor to continue.');
    console.log();
    process.exit(0);
  }
}
