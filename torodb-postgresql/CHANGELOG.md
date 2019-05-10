# v0.9 2018-12-22

* Update docker-compose.yml:
  * Add more docs and environment settings
  * Add latest Wekan and ToroDB.

Thanks to GitHub user xet7 for contributions.

# v0.8 2018-08-25

* Add OAuth2.

Thanks to GitHub users salleman33 and xet7 for their contributions.

# v0.7 2018-08-22

* Add browser-policy, trusted-url and webhooks-settings.

Thanks to GitHub users omarsy and xet7 for their contribution.

# v0.6 2018-08-03

* Update wekan-app container internal port to 8080.

Thanks to GitHub user xet7 for contributions.

# v0.5 2018-08-01

* Enable Wekan API by default, so that Export Board works.
* Add Matomo options.

Thanks to GitHub user xet7 for contributions.

# v0.4 2017-08-18

This release fixes following bugs:

* [ToroDB exits because of compound indexes not supported](https://github.com/torodb/stampede/issues/202).

Thanks to GitHub user teoincontatto for contributions.

# v0.3 2017-05-18

This release adds following new features:

* Use latest tag of Docker image.

Thanks to GitHub user xet7 for contributions.

# v0.2 2017-04-06

This release adds following new features:

* Use Meteor 1.4 based Docker image.

Thanks to GitHub users brylie and stephenmoloney for
their contributions.

MongoDB is kept at 3.2 because ToroDB is compatible
with it.

# v0.1 2017-02-13

This release adds following new features:

* Wekan <=> MongoDB <=> ToroDB => PostgreSQL read-only
  mirroring for SQL access with any programming language
  or Office package that has PostgreSQL support, like
  newest LibreOffice 3.5.

Thanks to GitHub users mquandalle, stephenmoloney and xet7
for their contributions.
