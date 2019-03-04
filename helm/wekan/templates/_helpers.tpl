{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "wekan.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "wekan.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Create a default fully qualified name for the wekan data app.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
*/}}
{{- define "wekan.localdata.fullname" -}}
{{- if .Values.localdata.fullnameOverride -}}
{{- .Values.localdata.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- printf "%s-localdata" .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s-localdata" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}
{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "wekan.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create the name of the service account to use for the api component
*/}}
{{- define "wekan.serviceAccountName" -}}
{{- if .Values.serviceAccounts.create -}}
    {{ default (include "wekan.fullname" .) .Values.serviceAccounts.name }}
{{- else -}}
    {{ default "default" .Values.serviceAccounts.name }}
{{- end -}}
{{- end -}}

{{/*
Create a default fully qualified mongodb-replicaset name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
*/}}
{{- define "wekan.mongodb-replicaset.fullname" -}}
{{- $name := default "mongodb-replicaset" (index .Values "mongodb-replicaset" "nameOverride") -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create the MongoDB URL. If MongoDB is installed as part of this chart, use k8s service discovery,
else use user-provided URL.
*/}}
{{- define "mongodb-replicaset.url" -}}
{{- if (index .Values "mongodb-replicaset" "enabled") -}}
{{- $count := (int (index .Values "mongodb-replicaset" "replicas")) -}}
{{- $release := .Release.Name -}}
mongodb://{{- range $v := until $count }}{{ $release }}-mongodb-replicaset-{{ $v }}.{{ $release }}-mongodb-replicaset:27017{{ if ne $v (sub $count 1) }},{{- end -}}{{- end -}}?replicaSet={{ index .Values "mongodb-replicaset" "replicaSetName" }}
{{- else -}}
{{- index .Values "mongodb-replicaset" "url" -}}
{{- end -}}
{{- end -}}
