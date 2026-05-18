#!/bin/bash

./download-frankenphp.sh

mv frankenphp ~/Lataukset

cp phpdevserver.sh ~/Lataukset

cd ~/Lataukset

./phpdevserver.sh
