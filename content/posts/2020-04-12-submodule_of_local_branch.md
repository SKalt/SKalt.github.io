---
title: submodule of a local branch
layout: main
categories:
  - posts
---

Ever wanted to check in your build artifacts into a build-specific branch?
I used to do that to deploy my Github pages ([demo in my git history][commit-with-submodule-setup]).
I had a `git submodule` in my website repo that pointed at a specific branch of my website repo.
I'd dump my built css/js/html into the subrepo and push it to deploy.
This workflow let me get my static site online without messing with CI or figuring out Jekyll.
Here's how you can use that workflow too ([though you probably shouldn't](#this-is-a-cool-hack)):

## An experiment

First, the setup: you're in a repo which places its builds into the `./dist` directory.

```sh
set -xe # echo back all commands, exit on any failure

rm -rf temp &&
  mkdir temp &&
  cd ./temp &&
  git init &&
  echo "README.md" > $_ &&
  echo '#!/bin/bash
        cp "$1" "./dist/${1/md/html}"
        ' > ./build.sh &&
  chmod +x ./build.sh &&
  git add . &&
  git commit -m "initial commit";
```

Second, you create an empty branch (such as `gh-pages`) to hold your built files:

```sh
DIST_BRANCH="${DIST_BRANCH:-gh-pages}"

git checkout --orphan "$DIST_BRANCH" &&
  git reset &&
  touch .gitkeep &&
  git add .gitkeep &&
  git commit -m "initial dist commit" &&
  git checkout --force master
```

This [`orphan`ed][orphan-branch-docs] branch holds nothing except an empty `.gitkeep` file, and shares no history with your other branches.

Third, add the current repo as a submodule.

```sh
CURRENT_REPO="${CURRENT_REPO:-./}"

git submodule add   \
  -b "$DIST_BRANCH" \
  -- "$CURRENT_REPO" dist

git commit -am "added a dist submodule

it points at '$DIST_BRANCH'
"
```

Note that you can specify the repo as an absolute path, either of the relative paths `'./'` or `'../'`, or via

```sh
REMOTE="${REMOTE:-origin}";
git remote get-url "$REMOTE"
```

If you look around in your submodule, you'll see the contents you checked into your orphaned branch.

```sh
cd dist
ls -a
# .  ..  .git  .gitkeep
git log
# 41f2001 (HEAD -> gh-pages, origin/gh-pages) initial dist commit
cd -
```

```sh
./build.sh README.md &&
  cd dist &&
  git add . &&
  git commit -am "build 1"
```

If you used a path as your origin, when you push in the submodule, you'll be pushing to the `$DIST_BRANCH` in your **local** repo.

```sh
git push # in the submodule
# Enumerating objects: 4, done.
# Counting objects: 100% (4/4), done.
# Delta compression using up to 4 threads
# Compressing objects: 100% (2/2), done.
# Writing objects: 100% (3/3), 817 bytes | 817.00 KiB/s, done.
# Total 3 (delta 0), reused 0 (delta 0)
# To /path/to/your/repo/temp/
#    b3e7faf..41f2001  gh-pages -> gh-pages
```

You may need to re-push to an actually remote origin.

For this experiment, don't forget to clean up:

```sh
cd ../../ && rm -rf temp
```

## This is a (cool) hack

Like most hacks, using a same-repo submodule might not be the best way to track your build artifacts.
Tracking many large build artifacts can become cumbersome, slowing down `git clone`s.
If you want to track your build artifacts using git syntax, you might look at [`git lfs`][git-lfs-docs], which is designed to manage large non-source-code files.
Alternately, you might prefer reproducing your build artifacts using your source code.

Still, having an isolated copy of the repo opens up some cool possibilities.
What if you used a self-subrepos to:

- run a CI tool on itself
- have a parser parse itself
- push a branch of built frontend assets to the newest free hosting service without having to figure out yet another build process
- For security by specificity, in your CI pipeline you could
  1. dump the passed build artifacts into a special branch in the subrepo
  1. have the CI agent assume a special identity with a CI-specific GPG key
  1. commit and sign the build artifacts

Who knows! Hope you have fun with this.

<!-- references -->

[orphan-branch-docs]: https://git-scm.com/docs/git-checkout#Documentation/git-checkout.txt---orphanltnewbranchgt
[git-lfs-docs]: https://git-lfs.github.com/
[commit-with-submodule-setup]: https://github.com/skalt/skalt.github.io/tree/f0f9eb6026e6b64522d27c4872b2aaa334b481d4

{% include style.html content="@import '_code_highlight.scss';" %}
