#!/usr/bin/env bash
curl 'https://api.github.com/users/SKalt/repos' > ./_data/raw_repos.json;
node -e "
const yaml = require('js-yaml');
console.log(
  yaml.safeDump(
    require('./_data/raw_repos')
      .filter(repo => !repo.fork && !repo.private)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(
        repo => ({
          identifier:  repo.name,
          title:       repo.name,
          description: repo.description,
          link:        repo.homepage,
          repo:        repo.html_url,
          date:        repo.created_at.slice(0, 10),
          updated_at:  repo.updated_at.slice(0, 10),
          archived:    repo.archived
        })
      )
    )
)
" > ./_data/slimmed_repos.yml
