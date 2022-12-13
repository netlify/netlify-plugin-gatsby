#!/bin/sh
set -e

for dir in fixtures/v5/*; do
    echo Running tests in "$dir"
    cd "$dir"
    npm i --no-package-lock --legacy-peer-deps
    npm run test
    cd -
done
