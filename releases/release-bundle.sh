cd ~/repos/wekan
sudo apt-get -y install parallel
./releases/rebuild-release.sh
#./releases/delete-phantomjs.sh
cd ~/repos/wekan/.build
zip -r wekan-$1.zip bundle

{
  scp ~/repos/wekan/releases/build-bundle-arm64.sh a:/home/wekan/
  scp ~/repos/wekan/releases/build-bundle-s390x.sh s:/home/linux1/
  #scp ~/repos/wekan/releases/build-bundle-ppc64el.sh o:/home/ubuntu/
  scp ~/repos/wekan/releases/release-x2.sh x2:/data/websites/
  scp wekan-$1.zip x2:/data/websites/releases.wekan.team/public/
  scp wekan-$1.zip a:/home/wekan/
  scp wekan-$1.zip s:/home/linux1/
  #scp wekan-$1.zip o:/home/ubuntu/
} | parallel -k

cd ..

echo "x64 bundle and arm64/s390x/ppc64le build scripts uploaded to x2/a/s."
