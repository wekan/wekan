# Helm Chart for Wekan

## Features

o Uses a MongoDB replica set by default - this allows fault-tolerant
  and scalable MongoDB deployment (or just set the replicas to 1 for
  a single server install)

o Optional Horizontal Pod Autoscaler (HPA), so that your Wekan pods
  will scale automatically with increased CPU load.

## The configurable values (values.yaml)

Scaling Wekan:

```yaml
## Configuration for wekan component
##

replicaCount: 1
```
**replicaCount** Will set the initial number of replicas for the Wekan pod (and container)

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
This section (if *enabled* is set to **true**) will enable the Kubernetes Horizontal Pod Autoscaler (HPA).

**minReplicas:** this is the minimum number of pods to scale down to (We recommend setting this to the same value as **replicaCount**).

**maxReplicas:** this is the maximum number of pods to scale up to.

**targetCPUUtilizationPercentage:** This is the CPU at which the HPA will scale-out the number of Wekan pods.

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

**replicas:** This is the number of MongoDB instances to include in the set. You can set this to 1 for a single server - this will still allow you to scale-up later with a helm upgrade.
