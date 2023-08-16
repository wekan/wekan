## After building bundles, copy and rename for uploading to releases

if [ $# -ne 1 ]
  then
    echo "Syntax with Wekan version number:"
    echo "  ./rel.sh 6.61"
    exit 1
fi


mkdir /Users/wekan/Downloads/rel$1
mv /Users/wekan/repos/wekan/wekan-$1*.zip /Users/wekan/Downloads/rel$1/
mv /Users/wekan/Downloads/WindowsJaettu/wekan-$1-amd64-windows.zip /Users/wekan/Downloads/rel$1/
curl -O https://releases.wekan.team/wekan-$1-amd64.zip
mv /Users/wekan/repos/wekan/wekan-$1-amd64.zip /Users/wekan/Downloads/rel$1/wekan-$1-amd64.zip
