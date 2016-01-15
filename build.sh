#!/bin/bash

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR

OUTPUT_DIR="public/javascripts/pages"
rm -rf $OUTPUT_DIR/*.js
for page in `ls pages`; do
./node_modules/.bin/browserify "pages/${page}" -o "$OUTPUT_DIR/${page}"
done