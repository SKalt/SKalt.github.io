import { geomToGml } from 'geojson-to-gml-3';
/* toggles */
$('.portfolio-toggle').on('click', function () {
    $(this).next('.portfolio-item').slideToggle(300);
    // TODO: ensure the toggled item is in view
});

/* Geojson -> GML example */

$('#translate-geojson').on('click', function () {
    console.log('clicked');

    console.log('clicked');
    var geojson = JSON.parse($('#geojson-sample').text());
    $('#gml-target').text(formatXml(geomToGml(geojson).replace('\n', ' ')));
});

function formatXml(xml) {
    var formatted = '';
    var reg = /(>)(<)(\/*)/g;
    xml = xml.replace(reg, '$1\r\n$2$3');
    var pad = 0;
    xml.split('\r\n').forEach(function (node, index) {
        var indent = 0;
        if (node.match(/.+<\/\w[^>]*>$/)) {
            indent = 0;
        } else if (node.match(/^<\/\w/)) {
            if (pad != 0) {
                pad -= 1;
            }
        } else if (node.match(/^<\w([^>]*[^\/])?>.*$/)) {
            indent = 1;
        } else {
            indent = 0;
        }

        var padding = '';
        for (var i = 0; i < pad; i++) {
            padding += '  ';
        }

        formatted += padding + node + '\r\n';
        pad += indent;
    });

    return formatted;
}
//TODO: GeoJSON -> WFS-T



/* redirect on landing */
$(document).ready(()=>$(window.location.hash).show());

$('a.link-right').on(
    "click",
    function(e){
	$($(this).attr('href')).show();
	e.stopPropagation();
    }
);
