FROM meteorhacks/meteord:onbuild
MAINTAINER Maxime Quandalle <maxime@quandalle.com>

# Run as you wish!
# docker run -d --name libreboard-db mongo
# docker run -d --link "libreboard-db:db" -e "MONGO_URL=mongodb://db" \
#   -e "ROOT_URL=http://example.com" -p 8080:80 mquandalle/libreboard
