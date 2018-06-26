#!/bin/bash

set -eox

rm -rf dist-package
mkdir -p dist-package
yarn transpile-package

cp package.json dist-package/package.json
cp README.md dist-package/README.md
cp src/index.js dist-package/index.js.flow
