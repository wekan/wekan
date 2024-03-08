In-progress script for installing npm modules locally. Not tested.

Anyone: If you get this working, edit this wiki and add remaining to be installed locally.

## TODO
- Add MongoDB running locally like at wiki page [Install from source](Install-and-Update#install-mongodb-1)
- Add node.js, npm etc installed locally
- Update [wekan-autoinstall](https://github.com/wekan/wekan-autoinstall), please send pull requests
- Update [Install from source](Install-and-Update#install-mongodb-1) so then this temporary page can possibly be removed later

## Related info
- Node.js and npm version downloaded at [Dockerfile](https://github.com/wekan/wekan/blob/main/Dockerfile)
- https://gist.github.com/isaacs/579814
- http://linuxbrew.sh

## Only this run with sudo
```
sudo apt-get install build-essential c++ capnproto nodejs nodejs-legacy npm git curl
```

## Install npm modules etc locally
```
# Local node module install from here:
# https://docs.npmjs.com/getting-started/fixing-npm-permissions

# If NPM global package directory does not exists
if [ ! -d "~/.npm-global" ]; then
  # Create it
  mkdir ~/.npm-global
fi

# If .npm-global/bin is in the path
if grep -Fxq "export PATH=~/.npm-global/bin:$PATH" ~/.bashrc
then
    # Continue
else
    # Add it to path
    echo "export PATH=~/.npm-global/bin:$PATH" >> ~/.bashrc
    # Add it to current path in RAM
    export PATH=~/.npm-global/bin:$PATH
fi

```

## Install packages globally to local ~/.npm-global directory

```
npm -g install n
npm -g install npm@4.6.1 
npm -g install node-gyp
npm -g install node-pre-gyp
npm -g install fibers@1.0.15
```

## Install meteor

Continue at [Install from source](Install-and-Update#install-manually-from-source)
