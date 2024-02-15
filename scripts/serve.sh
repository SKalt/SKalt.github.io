#!/usr/bin/env bash
set -eu;
rm -rf ./public
hugo --gc --buildDrafts
mkdir -p ./static/
rm -rf ./static/pagefind
pagefind --site ./public --output-path ./static/pagefind --root-selector main
hugo serve --buildDrafts --navigateToChanged

