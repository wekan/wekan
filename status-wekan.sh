#!/bin/sh

echo -e "\nWekan node.js:"
ps aux | grep "node main.js" | grep -v grep
echo -e "\nWekan mongodb:"
ps aux | grep mongo | grep -v grep
echo -e "\nWekan logs are at $PWD/wekan.log\n"
