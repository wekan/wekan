cd ~/repos/wekan
./rebuild-wekan.sh
./releases/delete-phantomjs.sh
cd ~/repos/wekan/.build
zip -r wekan-$1.zip bundle
scp wekan-$1.zip x2:/var/snap/wekan/common/releases.wekan.team/
cd ..
