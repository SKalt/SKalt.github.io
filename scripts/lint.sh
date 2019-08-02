#!/usr/bin/env bash
prettier prettier --write \
  'content/**/*.{md,html,yml}' \
  '_*/*.{html,md,css,scss,yml,json}'
