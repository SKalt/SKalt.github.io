#!/usr/bin/env bash
docker-compose up -d jekyll
sleep 2
xdg-open http://localhost:4000
