---
identifier: store-mvt
title: Slicing geojson into <code>.mvt</code>
repo: &repo https://github.com/SKalt/store-mvt
link: *repo
date: 2017-12-09
---

I wrote [a tool]({{ page.link }}) that transforms geojson to filesystem pyramids of mapbox vector tiles (`.mvt`). This involves tranforming geojson → sliced JSON tiles → protobuf (.pbf) → serialized pbf (now .mvt) arranged as directory/x/y/z. The benefit to using this over other tools is that it doesn't require leaving node.js. In the future, I'd like to allow it to produce complete `.mbtiles` entirely within the browser.
