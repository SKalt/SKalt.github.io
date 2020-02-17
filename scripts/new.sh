#!/usr/bin/env bash
here="${BASH_SOURCE[0]%/*}";

function usage() {
  echo "${BASH_SOURCE[0]%*/} [--post|post|--project|project]"
}

path_to_content="$(realpath "$here/../content")"
path_to_posts="$path_to_content/_posts"
path_to_projects="$path_to_content/_projects"

function new-post() {
  local title="$*"
  file_path="$path_to_posts/$(date '+%F')-${title// /_}.md"
  {
    echo "---"
    echo "title: $title"
    echo "categories:"
    echo "  - posts"
    echo "---"
  } > "$file_path"
}

function lookup() {
  local dl="$1";
  local query="$2";
  node -e "console.log(JSON.parse(fs.readFileSync('$dl'))[0]['$query'])"
}

function new-project() {
  local title="$*"
  local identifier
  identifier="$(node -e "console.log('$title'.replace(/[-_ ]+/g, '_'))")"
  local file_path="$path_to_projects/${identifier:-title_me}.md"
  local dl
  dl=$(mktemp)
  node "$here/import_repos_json.js" "$title" > "$dl"
  {
    echo "---"
    echo "identifier: $identifier"
    echo "title: $title"
    # TODO: handle cases where multiple repos are matched
    echo "link: $(lookup "$dl" 'link')" 
    echo "repo: $(lookup "$dl" 'repo')" 
    echo "date: $(lookup "$dl" 'date')"
    echo "---"
  } > "$file_path"
  echo "results: $dl"
  cat "$dl"
  echo "created $file_path"
}

function main() {
  local subcommand="$1"; shift;
  case $subcommand in
    --post|post)       new-post    "$@";;
    --project|project) new-project "$@";;
    *) usage && return 1;;
  esac
}

main "$@"
