# Publish new chart version

## In wekan.git (master branch)

* Increase the (chart) `version` number in `helm/wekan/Chart.yaml`
* Commit, push

## Here / in charts.git (gh-pages branch)

    helm package ../wekan.git/helm/wekan
    helm repo index . --url https://wekan.github.io/charts
