#!/bin/bash

readonly CONF=/build/env.config

source ${CONF}

cd /build
echo "starting the wekan service..."
node main.js
