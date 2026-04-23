# Quick install for development / debugging

* Install [nvm](https://github.com/creationix/nvm)
* `source NVMPATH/nvm.sh` for example `source ~/.nvm/nvm.sh`
* `nvm install v8.16.0`
* `nvm use v8.16.0`
* `nvm install-latest-npm`
* `cd ~`
* Clone repo to home: `git clone https://github.com/wekan/wekan.git`
* Install meteor (you can skip sudo by entering invalid password): `curl https://install.meteor.com/ | sh`
* `cd wekan/`
* `~/.meteor/meteor npm install --save babel-runtime xss meteor-node-stubs`
* `~/.meteor/meteor npm install --save bcrypt`
* `~/.meteor/meteor`

When you get this output, wekan is ready:
```
=> Started your app.

=> App running at: http://localhost:3000/
```

Register new user for administrator
