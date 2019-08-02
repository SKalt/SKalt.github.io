---
id: &id store-mvt
title: Slicing geojson into <code>.mbt</code>
repo: &repo https://github.com/SKalt/store-mvt
link: *repo
is_code: true
date: 2019-01-01
---
I wrote <a rel="\_noreferrer" target="\_blank" href="{{ link }}">a tool</a>
that transforms geojson to filesystem pyramids of mapbox
vector tiles (`.mbt`). This involves tranforming
geojson → sliced JSON tiles → protobuf (.pbf) → serialized pbf (now .mvt) arranged as directory/x/y/z.
The benefit to using this over other tools is that it doesn't require
leaving node.js.  In the future, I'd like to allow it to produce complete
`.mbtiles` entirely within the browser.
