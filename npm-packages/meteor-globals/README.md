# meteor-globals ![Build status](https://travis-ci.org/maxnowack/meteor-globals.svg?branch=master) [![Coverage Status](https://coveralls.io/repos/github/maxnowack/meteor-globals/badge.svg?branch=master)](https://coveralls.io/github/maxnowack/meteor-globals?branch=master)
Allows simple usage of meteor globals inside npm packages

## Limitations
As the name suggests, it's only possible to get the globals. It's not possible to get the es6 exports of custom atmosphere packages.

## Installation
````es6
  npm install meteor-globals
````

## Usage
Use `ensureDependencies` to ensure, that all your dependencies are installed. Do it, right after your package was loaded and make sure that you have specified the `name` option, that the user knows were the dependencies are coming from.
After that, you can use `getGlobal` to get the globals from these packages.

````es6
  import { ensureDependencies, getGlobal } from 'meteor-globals'

  ensureDependencies([
    'mongo',
    'cultofcoders:redis-oplog',
    'teamgrid:optimistic-increment@1.0.0', // depending on specific versions are also possible (semver)
  ], {
    name: 'my-awesome-meteor-npm-package',
    restart: true,
  })

  const Mongo = getGlobal('mongo', 'Mongo') // from core package
  const RedisOplog = getGlobal('cultofcoders:redis-oplog', 'RedisOplog') // from atmosphere package
````

## Exports

#### `ensureDependencies(packageNames[], options = { restart: true, name: 'A recently installed npm package'})`
Installes the specified atmosphere packages and forces a restart if the `restart` option is true.
It's highly recommended to specify a name from where the dependencies were installed.

#### `getGlobal(packageName, globalName) => Any`
Gets the value of a meteor global. If `globalName` is omitted, all exports of the specified package will be returned. `getGlobal` returns null if a Package isn't present

#### `checkMeteor(opts = { fileCheck: false, globalCheck: true }) => Boolean`
Checks if executed inside of a meteor project.

#### `ensureDependency(packageName) => Boolean`
Installes a single atmosphere package. Use `ensureDependencies` for convenience.

## License
Licensed under MIT license. Copyright (c) 2017 Max Nowack

## Contributions
Contributions are welcome. Please open issues and/or file Pull Requests.

## Maintainers
- Max Nowack ([maxnowack](https://github.com/maxnowack))
