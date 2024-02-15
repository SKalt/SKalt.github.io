---
identifier: geojson-to-gml
title: 'geojson-to-gml-(3|2)'
link: https://github.com/SKalt/geojson-to-gml-3.2.1
date: 2017-05-15
---

GeoJSON works: it succinctly describes geometric features in a way both
humans and machines can understand. As a consequence, GeoJSON has become
one of the leading data formats in GIS, and since it is a species of
JSON, it naturally rules online GIS visualization. However, the
<abbr title="Open Geospatial Consortium">OGC</abbr> has maintained
another standard, <abbr title="Geography Markup Language">GML</abbr>
since the '90s [[citation](https://en.wikipedia.org/wiki/Geography_Markup_Language#History)].
I wrote a javascript module to translate GeoJSON to GML to allow web
GIS technologies to better talk to older tools that rely on OGC GML,
i.e. [GeoServer](https://geoserver.org/).

[OpenLayers](https://openlayers.org/) and [Leaflet-WFST](http://flexberry.github.io/Leaflet-WFST/) can translate GeoJSON to GML.
Both are full-fledged web GIS tools.
This is only a string formatting library to translate GeoJSON to GML so that it should plug-and-play in any context.

<table>
  <tr>
    <td>
      GeoJSON to GML-2
    </td>
    <td>
      <a href="https://github.com/SKalt/geojson-to-gml-2.1.2#readme" rel="noreferrer" target="\_blank">Git Repo</a>
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
      <a href="https://github.com/SKalt/geojson-to-gml-3.2.1#readme" rel="noreferrer" target="\_blank">Git Repo</a>
    </td>
    <td>
      <a href="https://npmjs.com/package/geojson-to-gml-3" rel="noreferrer" target="\_blank">NPM package</a>
    </td>
  </tr>
</table>
