cd /home/linux1
rm -rf bundle
unzip wekan-$1.zip
cd /home/linux1/bundle/programs/server
chmod u+w *.json
cd /home/linux1/bundle/programs/server/node_modules/fibers
node build.js
cd /home/linux1
#cp -pR /home/linux1/node-fibers/bin/linux-s390x-83-glibc bundle/programs/server/node_modules/fibers/bin/
cd bundle
find . -type d -name '*-garbage*' | xargs rm -rf
find . -name '*phantom*' | xargs rm -rf
find . -name '.*.swp' | xargs rm -f
find . -name '*.swp' | xargs rm -f
cd ..
zip -r wekan-$1-s390x.zip bundle
