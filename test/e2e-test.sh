#!/bin/sh
set -e

for dir in fixtures/*; do
    echo Running tests in "$dir"
    cd "$dir"
    npm i
    npm run test
    cd -
done