nor-web-proxy
=============

Reverse proxy which passes to local ports based on request host

```
mkdir -p tmp/run tmp/log
NOR_WEB_PROXY_CONFIG=./config.sample.json HOST=0.0.0.0 HOSTNAME=localhost PORT=3001 VARDIR=tmp/ node app.js
```
