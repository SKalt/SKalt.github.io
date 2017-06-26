import { geomToGml as gml2 } from 'geojson-to-gml-2';
import { geomToGml as gml3 } from 'geojson-to-gml-3';
import {Transaction, Insert} from 'geojson-to-wfs-t-2'; // More later, I guess
/* toggles */
$('.portfolio-toggle').on('click', function () {
    $(this).next('.portfolio-item').slideToggle(300);
    // TODO: ensure the toggled item is in view
});

/* translation function */
function translator(button, from, to, translatorCb){
  $(button).mouseup((e)=>{
    try {
      debugger;
      const toTranslate = JSON.parse($(from).text());
      const translated = formatXml(translatorCb(toTranslate));
      try {
	$(to).text(translated);
      } catch (err){
	$(to).val(translated);
      }
    } catch (err){
      alert(err);
    }
  });
}

/* Geojson -> GML example */
translator(
  '#translate-geojson-gml-2', '#geojson-sample-gml', '#gml-target',
  (toTranslate) => gml2(toTranslate)
);
translator(
  '#translate-geojson-gml-3', '#geojson-sample-gml', '#gml-target',
  (toTranslate) => gml3(toTranslate)
);
translator(
  '#translate-geojson-wfst', '#geojson-sample-wfs', '#gml-target',
  (toTranslate)=>Transaction(Insert(toTranslate))
);
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
