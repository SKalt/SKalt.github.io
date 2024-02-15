#!/usr/bin/env bash
set -eu;
prettier --check               \
  'content/**/*.{md,html,yml}' \
  'assets/*.css'               \
  'assets/**/*.{js,ts}'        \
  './README.md'

cspell \
  ./README.md              \
  ./**/*.md                \
  ./assets/*.svg           \
  ./assets/critical.css    \
  ./assets/**/*.{ts,js}

lychee --insecure ./content

shellcheck
