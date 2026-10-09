#!/bin/bash

## 1. Copy files

npm run build

npm run prepublish

npm run copy

## 2. Commit

git add --all

git commit -m "$1"

## 3. Add tags

git tag -a $1 -m "$1"

git push origin $1

git push

## 4. Publish npm package

npm publish --access public
