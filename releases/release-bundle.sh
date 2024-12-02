cd ~/repos/wekan
#sudo apt-get -y install parallel
./releases/rebuild-release.sh
#./releases/delete-phantomjs.sh
cd ~/repos/wekan/.build
zip -r wekan-$1-amd64.zip bundle

#{
  #scp ~/repos/wekan/releases/build-bundle-arm64.sh a:/home/wekan/
  #scp ~/repos/wekan/releases/build-bundle-s390x.sh s:/home/linux1/
  #scp ~/repos/wekan/releases/build-bundle-ppc64el.sh o:/home/ubuntu/
  #scp ~/repos/wekan/releases/release-x2.sh 20i:/data/websites/
  #scp wekan-$1-amd64.zip 20i:/data/websites/releases.wekan.team/
  #scp wekan-$1-amd64.zip a:/home/wekan/
  #scp wekan-$1-amd64.zip s:/home/linux1/
  #scp wekan-$1.zip o:/home/ubuntu/
#} | parallel -k

cd ..

#echo "x64 bundle and arm64/s390x build scripts uploaded to x2/a/s."
#echo "x64 bundle and build script uploaded to 20i."
echo "x64 bundle done."
