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
  sudo apt-get -y install python3-pip python3-swagger-spec-validator python3-wheel python3-setuptools
  # Install older version of api2html that works with Node.js 14
  sudo npm install -g api2html@0.3.0 || sudo npm install -g swagger-ui-watcher
  (mkdir -p ~/python && cd ~/python && git clone --depth 1 -b master https://github.com/Kronuz/esprima-python)
  (cd ~/python/esprima-python && git fetch origin pull/20/head:delete_fix && git checkout delete_fix &&  sudo python3 setup.py install --record files.txt)
  #(cd ~/python/esprima-python && git fetch origin pull/20/head:delete_fix && git checkout delete_fix && sudo pip3 install .)
  # temporary fix until https://github.com/Kronuz/esprima-python/pull/20 gets merged
  # a) Generating docs works on Kubuntu 21.10 with this,
  #    but generating Sandstorm WeKan package does not work
  #    https://github.com/wekan/wekan/issues/4280
  #    https://github.com/sandstorm-io/sandstorm/issues/3600
  #      sudo pip3 install .
  # b) Generating docs Works on Linux Mint with this,
  #    and also generating Sandstorm WeKan package works:
  #      sudo python3 setup.py install --record files.txt
fi

# 2) Go to Wekan repo directory
cd ~/repos/wekan

# 3) Create api docs directory, if it does not exist
if [ ! -d public/api ]; then
  mkdir -p public/api
fi

# 4) Generate docs with api2html or fallback to swagger-ui-watcher
python3 ./openapi/generate_openapi.py --release v$1 > ./public/api/wekan.yml
if ! api2html -c ./public/logo-header.png -o ./public/api/wekan.html ./public/api/wekan.yml; then
  swagger-ui-watcher ./public/api/wekan.yml -p 8080
fi

# Copy docs to bundle
#cp -pR ./public/api ~/repos/wekan/.build/bundle/programs/web.browser/app/
