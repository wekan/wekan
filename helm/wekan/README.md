# WeKan ® - Open Source kanban

## Installing the Chart

To install the chart with the release name `my-release`:

```bash
helm repo add wekan https://wekan.github.io/charts
helm install my-release wekan/wekan
```

These commands deploy Wekan on the Kubernetes cluster in the default configuration.

Tip: List all releases using `helm list`

For all available values see `helm show values wekan/wekan`.

## Uninstalling the Chart

To uninstall/delete the my-release deployment:

```bash
helm delete my-release
```

The command removes all the Kubernetes components associated with the chart and
deletes the release.

## Features

* Uses a MongoDB replica set by default - this allows fault-tolerant
  and scalable MongoDB deployment (or just set the replicas to 1 for
  a single server install)

* Optional Horizontal Pod Autoscaler (HPA), so that your Wekan pods
  will scale automatically with increased CPU load.

## The configurable values (values.yaml)

Scaling Wekan:

```yaml
## Configuration for wekan component
##

replicaCount: 1
```

**replicaCount** will set the initial number of replicas for the Wekan pod
(and container)

```yaml
## Configure an horizontal pod autoscaler
##
autoscaling:
  enabled: true
  config:
    minReplicas: 1
    maxReplicas: 16
    ## Note: when setting this, a `resources.request.cpu` is required. You
    ## likely want to set it to `1` or some lower value.
    ##
    targetCPUUtilizationPercentage: 80
```

This section (if *enabled* is set to **true**) will enable the Kubernetes
Horizontal Pod Autoscaler (HPA).

**minReplicas:** this is the minimum number of pods to scale down to
(We recommend setting this to the same value as **replicaCount**).

**maxReplicas:** this is the maximum number of pods to scale up to.

**targetCPUUtilizationPercentage:** This is the CPU at which the HPA will
scale-out the number of Wekan pods.

```yaml
mongodb-replicaset:
  enabled: true
  replicas: 3
  replicaSetName: rs0
  securityContext:
    runAsUser: 1000
    fsGroup: 1000
    runAsNonRoot: true
```

This section controls the scale of the MongoDB redundant Replica Set.

**replicas:** This is the number of MongoDB instances to include in the set.
You can set this to 1 for a single server - this will still allow you to
scale-up later with a helm upgrade.

### Install OCP route

If you use this chart to deploy Wekan on an OCP cluster, you can create route
instead of ingress with following command:

```bash
helm template --set route.enabled=true,ingress.enabled=false values.yaml . | \
  oc apply -f-
```
