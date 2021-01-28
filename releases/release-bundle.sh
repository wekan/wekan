cd ~/repos/wekan
sudo apt -y install parallel
./releases/rebuild-release.sh
#./releases/delete-phantomjs.sh
cd ~/repos/wekan/.build
zip -r wekan-$1.zip bundle

#{
#    scp wekan-$1.zip x2:/var/snap/wekan/common/releases.wekan.team/
#    scp wekan-$1.zip a:/home/wekan/repos/ && ssh a ' sudo npm -g install npm' && ssh a './maintainer-make-release.sh $1' && scp a:/home/wekan/repos/wekan-$1-arm64.zip . && scp wekan-$1-arm64.zip x2:/var/snap/wekan/common/releases.wekan.team/raspi3/
#    scp wekan-$1.zip s:/home/linux1/ && ssh s 'sudo npm -g install npm ' && ssh s './maintainer-make-release.sh $1' && scp s:/home/linux1/wekan-$1-s390x.zip . && scp wekan-$1-s390x.zip x2:/var/snap/wekan/common/releases.wekan.team/s390x/
#    scp wekan-$1.zip openpower:/home/ubuntu/ && ssh openpower './maintainer-make-release.sh $1' && scp openpower:/home/ubuntu/wekan-$1-ppc64le.zip . && scp wekan-$1-ppc64le.zip x2:/var/snap/wekan/common/releases.wekan.team/ppc64le/
#    sudo systemctl enable sandstorm && sudo sandstorm start && rm -rf ~/sandbuild && sudo mkdir -p /usr/local/lib/node_modules/fibers/.node-gyp && mkdir -p ~/sandbuild && cp -pR ~/repos/wekan ~/sandbuild/ && rm -rf ~/sandbuild/wekan/.meteor-spk && cd ~/sandbuild/wekan/.build/bundle/programs/server && npm install node-gyp node-pre-gyp fibers && cd ~/sandbuild/wekan && meteor-spk pack wekan-$1.spk && spk publish wekan-$1.spk && cd ~/repos/wekan && sudo sandstorm stop && sudo systemctl disable sandstorm && cd ~/repos/wekan
#} | parallel -k

cd ..
