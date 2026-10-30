# CHANGELOG-big.md is written; CHANGELOG.md, the short changelog, is written from it.
node "$(dirname "$0")/changelog-short.mjs" &&
git add CHANGELOG-big.md CHANGELOG.md && git commit -n -m "Updated ChangeLog." && git push
