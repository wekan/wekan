# Extract the OpenAPI specification.

# 1) Check that there is only one parameter
#    of Wekan version number:

if [ $# -ne 1 ]
  then
    echo "Syntax with Wekan version number:"
    echo "  ./rebuild-docs.sh 5.10"
    exit 1
fi

# 2) If esprima-python directory does not exist,
#   install dependencies.

if [ ! -d ~/python/esprima-python ]; then
  sudo apt-get -y install python3-pip
  sudo pip3 install -U setuptools wheel
  sudo npm install -g api2html
  mkdir -p ~/python
  cd ~/python
  git clone --depth 1 -b master https://github.com/Kronuz/esprima-python
  cd ~/python/esprima-python
  sudo python3 setup.py install --record files.txt
fi

# 2) Go to Wekan repo directory
cd ~/repos/wekan

# 3) Create api docs directory, if it does not exist
if [ ! -d public/api ]; then
  mkdir -p public/api
fi

# 4) Generate docs.
#python3 ./openapi/generate_openapi.py --release $(git describe --tags --abbrev=0) > ./public/api/wekan.yml
python3 ./openapi/generate_openapi.py --release v$1 > ./public/api/wekan.yml
api2html -c ./public/logo-header.png -o ./public/api/wekan.html ./public/api/wekan.yml

# Copy docs to bundle
#cp -pR ./public/api ~/repos/wekan/.build/bundle/programs/web.browser/app/
