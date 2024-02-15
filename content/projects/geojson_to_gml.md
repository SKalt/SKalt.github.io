---
identifier: geojson-to-gml
title: "geojson-to-gml-(3|2)"
repo: skalt/geojson-to-gml-3.2.1
date: 2017-05-15
---

I wrote a lightweight javascript module to translate GeoJSON to GML 3 or 2.
This helps newer web GIS tools talk to older tools that rely on OGC GML,
i.e. [GeoServer](https://geoserver.org/).

<!--more-->

GeoJSON and <abbr title="Geography Markup Language">GML</abbr> are common formats for GIS data.
GeoJSON was standardized between [2007-8](https://en.wikipedia.org/wiki/GeoJSON#History), while the <abbr title="Open Geospatial Consortium">OGC</abbr> has maintained GML [since the '90s][gml].
The two formats generational differences show, and it can be difficult to translate between the two of them.

[OpenLayers](https://openlayers.org/) and [Leaflet-WFST](http://flexberry.github.io/Leaflet-WFST/) can translate GeoJSON to GML.
Both are full-fledged web GIS tools.
This is only a string formatting library to translate GeoJSON to GML so that it should plug-and-play in any context.

<table>
  <tr>
    <td>
      GeoJSON to GML-2
    </td>
    <td>
      <a href="https://github.com/skalt/geojson-to-gml-2.1.2#readme" rel="noreferrer" target="\_blank">Git Repo</a>
    </td>
    <td>
      <a href="https://npmjs.com/package/geojson-to-gml-2" rel="noreferrer" target="\_blank">NPM package</a>
    </td>
  </tr>
  <tr>
    <td>
      GeoJSON to GML-3
    </td>
    <td>
      <a href="https://github.com/skalt/geojson-to-gml-3.2.1#readme" rel="noreferrer" target="\_blank">Git Repo</a>
    </td>
    <td>
      <a href="https://npmjs.com/package/geojson-to-gml-3" rel="noreferrer" target="\_blank">NPM package</a>
    </td>
  </tr>
</table>

[gml]: https://en.wikipedia.org/wiki/Geography_Markup_Language#History
