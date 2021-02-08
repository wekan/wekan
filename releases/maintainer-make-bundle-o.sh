cd /home/ubuntu
rm -rf bundle
#wget https://releases.wekan.team/wekan-$1.zip
unzip wekan-$1.zip
cd /home/ubuntu/bundle/programs/server
chmod u+w *.json
cd /home/ubuntu/bundle/programs/server/node_modules/fibers
node build.js
cd /home/ubuntu
cp -pR /home/ubuntu/node-fibers/bin/linux-ppc64-72-glibc bundle/programs/server/node_modules/fibers/bin/
cd bundle
find . -type d -name '*-garbage*' | xargs rm -rf
find . -name '*phantom*' | xargs rm -rf
find . -name '.*.swp' | xargs rm -f
find . -name '*.swp' | xargs rm -f
cd ..
zip -r wekan-$1-ppc64le.zip bundle
