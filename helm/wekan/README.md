# Helm Chart for Wekan

## Features

 o Uses a MongoDB replica set by default - this allows fault-tolerant and scalable MongoDB deployment (or just set the replicas to 1 for a single server install)

 o Optional Horizontal Pod Autoscaler (HPA), so that your Wekan pods will scale automatically with increased CPU load.

