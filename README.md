# Personal blog

## conventions

<details open><summary>File naming</summary>

- this is a `snake_case` repo to conform with ruby conventions.
- `_prefixed.file` indicates that a file is intended to be included in something else, rather than being intended to be consumed publicly.

</details>

<details><summary>Directory layout</summary>

[[jekyll docs]](https://jekyllrb.com/docs/structure/)

This blog follows a _mostly_ standard jekyll layout.

<details open><summary>What the jekyll docs suggest</summary>

```
.
├── _config.yml
├── _includes/*
├── _layouts/*
├── _sass/_*.s?css
├── styles/*.s?css
├── _data/*.(yml|csv)
├── _drafts
├── _posts/YYYY-MM-DD-title.md
├── _site
└── index.html
```

</details>

<details open><summary>Structure of this repo</summary>

```
  .
+ ├── README.md  # <- you are here
  |
  ├── _config.yml
  ├── _data/*.(yml|csv)
+ ├── _images/*.(png|jpg|webp|svg)
  ├── _includes/*
  ├── _layouts/*
+ ├── _sass/_*.scss
+ ├── styles/*.scss
  ├── pages/*.(html|md)
+ ├── content
+ │   ├── _drafts/*.md
+ │   ├── _posts/YYYY-MM-DD-title.md
+ │   └── _*/* # other collections
  ├── _site/* # the built site
  |
  |   # automation
+ ├── Dockerfile
+ ├── scripts
+ │   ├── _*.sh # partials to be included in other scripts
+ │   └── *.sh  # a command automating a common task
  |
  |   # dependency management
  ├── Gemfile          # \
  ├── Gemfile.lock     #  } ruby artefacts
+ ├── vendor/bundle/** # /
  |
+ ├── src/**/*      # JS-managed files
+ ├── package.json     # \
+ ├── node_modules/**  #  } javascript artefacts
+ └── yarn.lock        # /
```

</details>

Of note:

- I'm using a `Dockerfile` as a thin wrapper around the [`jekyll/jekyll:latest` docker image](https://hub.docker.com/r/jekyll/jekyll/tags). The image pins the jekyll version and stabilizes my ruby and node environments.
- all automation tasks are to be run on the CLI through `yarn run $script_name`, which is a call through `bash scripts/_docker.sh <...command>`.
- I've used a custom collections directory, `/content`, to gather my writing.

</details>

<!--
<details open><summary></summary>
</details>
-->
