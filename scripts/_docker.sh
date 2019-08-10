#! /usr/bin/env bash
. ./scripts/_common.sh
docker run --rm \
  --volume="$GIT_ROOT_DIR:/srv/jekyll" \
  --volume="$GIT_ROOT_DIR/vendor/bundle:/usr/local/bundle" \
  --volume="$GIT_ROOT_DIR/node_modules/:/srv/jekyll/node_modules" \
  -p 4000:4000 \
  -p 35729:35729 \
  --name jekyll \
  -it jekyll/jekyll:$JEKYLL_VERSION \
  "$@"

# explanation:
# docker run: starts the container running a command
# --rm: Automatically remove the container when it exits
# --volume="{{ outside path }}:{{ inside path }}" mounts a volume for the
# respective purposes of:
#  - using the top level of this repo as the jekyll app
#  - caching gems installed by bundler
#  - caching node_modules
# more documentation on mouting at https://docs.docker.com/storage/volumes/
# -p 4000:4000 exposes port 4000 from within the container as port 4000 outside.
# port 35729 is for the livereload.js websocket.
# -it: two flags, -i -> 'interactive' + -t 'TTY' or 'terminal'
# jekyll/jekyll:$JEKYLL_VERSION: the image name to create a container from
# "$@" forwards commands passed to this script.
