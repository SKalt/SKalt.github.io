#!/usr/bin/env bash
prettier --write \
  'content/**/*.{md,html,yml}' \
  '_{data,includes,sass}/*.{html,md,css,scss,yml,json}' \
  './README.md'
