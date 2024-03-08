Migrations from every possible old Wekan version are not implemented yet.

Here are some starting points.

## 1) Required: Backups

https://github.com/wekan/wekan/wiki/Backup

Do backups to multiple places. And test does restore work, with restore script already made.

## 2) You can save all data from MongoDB to .json files and compare them

That way you can also edit files to fix something, and also save back to MongoDB:
- https://forums.rocket.chat/t/big-issue-with-custom-javascript/261/3

## 3) Change text in all files in current directory in-place

Take backup before runnning this.

Using sed on Linux or Mac. 
```
sed -i 's|FindThisText|ReplaceWithThisText|g' *
```
## 4) Example: From v0.77 to newest

### v0.77
- Schema https://github.com/wekan/wekan/tree/v0.77/models
- Migrations https://github.com/wekan/wekan/blob/v0.77/server/migrations.js

### Newest
- Schema https://github.com/wekan/wekan/tree/devel/models
- Migrations https://github.com/wekan/wekan/blob/main/server/migrations.js

## 5) Some migrations could be missing

Some of the database schema can be different. If you see difference in these files, you could fix it for everybody by adding new code to migrations, so old schema is converted to new one automatically when Wekan starts.

## 6) Inform Wekan about what is missing

### a) Add issue
- [Add issue](https://github.com/wekan/wekan/issues)

### b) Create pull request
- [Build from source or build on VirtualBox image](Platforms)
- [Please try to fix lint error before creating pull request](Developer-Documentation#preventing-travis-ci-lint-errors-before-submitting-pull-requests)
- [Making Pull Request](https://help.github.com/articles/creating-a-pull-request/)