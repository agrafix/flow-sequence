#!/bin/bash

set -eox

rm -rf dist-package
mkdir -p dist-package
yarn transpile-package

cp package.json dist-package/package.json
cp src/index.js dist-package/index.js.flow
