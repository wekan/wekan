# WeKan on OpenShift
 
Openshift Template for WeKan backed by MongoDB
 
#### Create Template
```sh
oc create -f wekan.yml
```
 
#### Delete Instance Resources
Clean up all resources created. Note label filters assume single instance of template deployed in the current namespace.
 
```sh
oc delete all -l app=wekan
oc delete pods -l app=wekan
oc delete persistentvolumeclaim -l app=wekan
oc delete serviceaccount -l app=wekan
oc delete secret -l app=wekan
```
