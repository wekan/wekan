## Most of these are uncommented, because they are already installed.
#sudo rm -rf /usr/local/lib/node_modules
#sudo rm -rf ~/.npm
#sudo apt install build-essential c++ capnproto npm git curl
#sudo npm -g install n
#sudo n 4.8.6
#sudo npm -g install npm@4.6.1
#sudo npm -g install node-gyp
#sudo npm -g install node-pre-gyp
#sudo npm -g install fibers@1.0.15
sudo rm -rf wekan
git clone https://github.com/wekan/wekan
cd ~/repos
#curl https://install.meteor.com -o ./install_meteor.sh
#sed -i "s|RELEASE=.*|RELEASE=${METEOR_RELEASE}\"\"|g" ./install_meteor.sh
#echo "Starting meteor ${METEOR_RELEASE} installation...   \n"
#chown wekan:wekan ./install_meteor.sh 
#sh ./install_meteor.sh
mkdir -p ~/repos/wekan/packages
cd ~/repos/wekan/packages
rm -rf kadira-flow-router
rm -rf meteor-useraccounts-core
git clone https://github.com/wekan/flow-router.git kadira-flow-router
git clone https://github.com/meteor-useraccounts/core.git meteor-useraccounts-core
sed -i 's/api\.versionsFrom/\/\/api.versionsFrom/' ~/repos/wekan/packages/meteor-useraccounts-core/package.js
cd ~/repos/wekan

rm -rf node_modules
npm install
rm -rf .build
meteor build .build --directory
cp -f fix-download-unicode/cfs_access-point.txt .build/bundle/programs/server/packages/cfs_access-point.js
sed -i "s|build\/Release\/bson|browser_build\/bson|g" ~/repos/wekan/.build/bundle/programs/server/npm/node_modules/meteor/cfs_gridfs/node_modules/mongodb/node_modules/bson/ext/index.js
cd ~/repos/wekan/.build/bundle/programs/server/npm/node_modules/meteor/npm-bcrypt
rm -rf node_modules/bcrypt
meteor npm install --save bcrypt
cd ~/repos/wekan/.build/bundle/programs/server
rm -rf node_modules
npm install
meteor npm install --save bcrypt
cd ~/repos
echo Done.
