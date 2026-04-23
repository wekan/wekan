## 1) Matomo

https://github.com/wekan/wekan-snap/wiki/Supported-settings-keys#matomo-web-analytics-integration

## 2) Metrics

- [Original PR](https://github.com/wekan/wekan/pull/4700). Thanks to Emile840.
- [Fix typos and translate comments to English](https://github.com/wekan/wekan/commit/551f57b03bbc1dba37862a0cc3407c8d359e2a9a). Thanks to xet7.
- [Added METRICS_ALLOWED_IP_ADDRESSES settings to Docker/Snap/Source](https://github.com/wekan/wekan/commit/34862810df686abfc0ee9ff1a13690a7b2bacc7e) and missing Matomo settings to Snap help. Thanks to xet7.

### Docker

[docker-compose.yml](https://raw.githubusercontent.com/wekan/wekan/master/docker-compose.yml)
```
- METRICS_ALLOWED_IP_ADDRESSES=192.168.0.100,192.168.0.200
```


