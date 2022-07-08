#!/bin/bash

# Convert Stylus to CSS.
# npm -g install stylus
#
sed -i "s|@import 'nib'|//@import 'nib'|g" *.styl
ls *.styl | xargs stylus
