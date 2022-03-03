#!/usr/bin/env bash
post_template='---
title: %s
layout: main
categories:
  - posts
---
';

make_new_post(){
  local title="$*";
  if test -z "$title"; then
    printf "Title: "
    read -r title
  fi
  local slug="${title/ /_}";
  local target_file; target_file="./content/_posts/$(date '+%Y-%m-%d')-$slug.md";
  # shellcheck disable=SC2059
  printf -- "$post_template" "$title" > "$target_file";
  local editor="${EDITOR:-code}";
  if (echo "$editor" | grep -qe "^code"); then editor=code; fi
  $editor "$target_file";
};


if [ "${BASH_SOURCE[0]}" = "$0" ]; then make_new_post "$@"; fi

