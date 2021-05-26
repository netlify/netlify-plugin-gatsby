#!/bin/sh

for dir in fixtures/*; do
    echo Running tests in "$dir"
    cd "$dir"
    npm run test
done