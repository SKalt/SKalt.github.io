import { geomToGml } from 'geojson-to-gml-3';
import {Transaction, Insert} from 'geojson-to-wfs-t-2'; // More later, I guess
/* toggles */
$('.portfolio-toggle').on('click', function () {
    $(this).next('.portfolio-item').slideToggle(300);
    // TODO: ensure the toggled item is in view
});

/* translation function */
function translator(button, from, to, translatorCb){
  $(button).click(()=>{
    const toTranslate = JSON.parse($(from).text() || $(from).val());
    try {
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
  '#translate-geojson', '#geojson-sample', '#gml-target',
  geomToGml
);
translator(
  '#translate-geojson', '#geojson-sample', '#gml-target',
  (x)=>Transaction(Insert(x))
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
