---
identifier: store-mvt
title: "Slicing geojson into `.mvt`"
repo: &repo https://github.com/SKalt/store-mvt
link: https://www.npmjs.com/package/store-mvt
date: 2017-12-09
---

A tool that transforms geojson to filesystem pyramids of mapbox vector tiles (`.mvt`) using `node.js`.

<!--more-->

---

This involves transforming geojson → sliced JSON tiles → protobuf (.pbf) → serialized pbf (now .mvt) arranged as `directory/x/y/z`.
The benefit to using this over other tools is that it doesn't require leaving node.js.
In the future, I'd like to allow it to produce complete `.mbtiles` entirely within the browser.
