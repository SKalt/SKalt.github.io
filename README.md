# Personal blog

## conventions

<details open><summary>File naming</summary>

- this is a `snake_case` repo to conform with ruby conventions.
- `_prefixed.file` indicates that a file is intended to be included in something else, rather than being intended to be consumed publicly.

</details>

<details><summary>Directory layout</summary>



</details>

<details open><summary>Structure of this repo</summary>

```diff
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

```

</details>

- I've used a custom collections directory, `/content`, to gather my writing.

</details>

