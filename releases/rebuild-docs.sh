# Generate docs.

# extract the OpenAPI specification
npm install -g api2html@0.3.3
mkdir -p ~/python
cd ~/python
git clone --depth 1 -b master https://github.com/Kronuz/esprima-python
cd ~/python/esprima-python
python3 setup.py install --record files.txt
cd ~/app
mkdir -p ~/app/public/api
chown wekan --recursive ~/app
python3 ./openapi/generate_openapi.py --release $(git describe --tags --abbrev=0) > ./public/api/wekan.yml
/opt/nodejs/bin/api2html -c ./public/logo-header.png -o ./public/api/wekan.html ./public/api/wekan.yml; \
# Build app
cd ~/app
mkdir -p ~/.npm
chown wekan --recursive ~/.npm ~/.config
#~/.meteor/meteor add standard-minifier-js
npm install
~/.meteor/meteor build --directory ~/app_build
cp ~/app/fix-download-unicode/cfs_access-point.txt ~/app_build/bundle/programs/server/packages/cfs_access-point.js
#rm ~/app_build/bundle/programs/server/npm/node_modules/meteor/rajit_bootstrap3-datepicker/lib/bootstrap-datepicker/node_modules/phantomjs-prebuilt/lib/phantom/bin/phantomjs
chown wekan ~/app_build/bundle/programs/server/packages/cfs_access-point.js
#Removed binary version of bcrypt because of security vulnerability that is not fixed yet.
#https://github.com/wekan/wekan/commit/4b2010213907c61b0e0482ab55abb06f6a668eac
#https://github.com/wekan/wekan/commit/7eeabf14be3c63fae2226e561ef8a0c1390c8d3c
#cd ~/app_build/bundle/programs/server/npm/node_modules/meteor/npm-bcrypt
#rm -rf node_modules/bcrypt
#npm install bcrypt
cd ~/app_build/bundle/programs/server/
npm install
#npm install bcrypt
mv ~/app_build/bundle /build
\
# Put back the original tar
mv $(which tar)~ $(which tar)
\
# Cleanup
apt-get remove --purge -y ${BUILD_DEPS}
apt-get autoremove -y
npm uninstall -g api2html &&\
rm -R /var/lib/apt/lists/*
rm -R ~/.meteor
rm -R ~/app
rm -R ~/app_build
cat ~/python/esprima-python/files.txt | xargs rm -R
rm -R ~/python

echo Done.
