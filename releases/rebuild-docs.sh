# Generate docs.

#mkdir -p public/api
python3 ./openapi/generate_openapi.py --release $(git describe --tags --abbrev=0) > ./public/api/wekan.yml
api2html -c ./public/logo-header.png -o ./public/api/wekan.html ./public/api/wekan.yml

# Copy docs to bundle
#cp -pR ./public/api ~/repos/wekan/.build/bundle/programs/web.browser/app/
#cp -pR ./public/api ~/repos/wekan/.build/bundle/programs/web.browser.legacy/app/
