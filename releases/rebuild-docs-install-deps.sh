# Extract the OpenAPI specification.

# Install dependencies.
sudo apt-get install python3-pip
sudo pip3 install -U setuptools wheel
sudo npm install -g api2html
mkdir -p ~/python
cd ~/python
git clone --depth 1 -b master https://github.com/Kronuz/esprima-python
cd ~/python/esprima-python
sudo python3 setup.py install --record files.txt
cd ~/repos/wekan
mkdir -p public/api

# Generate docs.
python3 ./openapi/generate_openapi.py --release $(git describe --tags --abbrev=0) > ./public/api/wekan.yml
api2html -c ./public/logo-header.png -o ./public/api/wekan.html ./public/api/wekan.yml

# Copy docs to bundle
#cp -pR ./public/api ~/repos/wekan/.build/bundle/programs/web.browser/app/
