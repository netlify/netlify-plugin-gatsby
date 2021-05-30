#!/bin/sh
set -e

for dir in fixtures/*; do
    echo Running tests in "$dir"
    pushd "$dir"
    npm i
    npm run test
    popd
done