#!/usr/bin/env bash
set -eu;
rm -rf ./public
hugo --gc --buildDrafts
mkdir -p ./static/
rm -rf ./static/pagefind
pagefind --site ./public --output-path ./static/pagefind --root-selector main
python3 -c 'import time,webbrowser; time.sleep(2); webbrowser.open("http://localhost:1313/")' &
hugo serve --bind "0.0.0.0" --buildDrafts "$@"

