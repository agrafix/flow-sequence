#!/bin/bash

set -eo

tmpdir=`mktemp -d 2>/dev/null || mktemp -d -t 'mytmpdir'`
srcdir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "Making package ..."
./make-package.sh

echo "Setup $tmpdir ..."
cd $tmpdir

cat >package.json <<EOL
{
  "name": "flow-sequence-test",
  "version": "0.1.0",
  "description": "Testing",
  "main": "index.js",
  "scripts": {},
  "author": "Alexander Thiemann <mail@athiemann.net>",
  "license": "MIT",
  "private": false,
  "devDependencies": {},
  "dependencies": {}
}

EOL

cat >index.js <<EOL
const fs = require('flow-sequence');

const op = fs.chain()
  .filter((x) => x > 2)
  .map((x) => x + 1)
  .filter((x) => x > 4)
  .flatMap((x) => [x, x])
  .optimize();

console.log(op.run([1, 2, 3, 4, 5]));
EOL

echo "Install package from $srcdir/dist-package ..."
yarn add "file:/$srcdir/dist-package"

echo "Run and compare ..."
out=$(node index.js)

if [ "$out" = "[ 5, 5, 6, 6 ]" ]; then
  echo "All good"
else
  echo "Bad output: $out"
  exit 1
fi
