const handlebars = require('handlebars');
const fs = require('fs');

let template = (filePath) => handlebars.compile(fs.readFileSync(filePath, {encoding:'utf8'}));
// init
var  portfolioContext = {};
fs.readdirSync('./src/portfolio-items').forEach(
  function(item){
    console.log(item);
    var demo, blurb, title;
    var _path = './src/portfolio-items/' + item;
    fs.readdirSync(_path).forEach(
      function(f){
	if (/~|#/.exec(f)){
	  return;
	}
	const getFile = ()=>fs.readFileSync(_path + '/' + f);
	if (/demo/i.exec(f)){
	  demo = getFile();
	} else if (/blurb/i.exec(f)){
	  blurb = getFile();
	} else if (/title/i.exec(f)){
	  title = getFile();
	}
      }
    );
    portfolioContext[item] = {
      item, demo, blurb, title, hasDemo:(demo ? true : false)
    };
    //
  }
);
portfolioContext['geojson-to-gml'].glyphicon = 'map-marker';
portfolioContext['wfst-2-examples'].glyphicon = 'globe';
portfolioContext['UDR'].glyphicon = 'refresh';
portfolioContext['about-me'].glyphicon = 'user';
// portfolioContext['pdf-hardlinkr'].glyphicon = 'file';
portfolioContext['maki-choice'].glyphicon = 'info-sign';

portfolioContext = [
  'about-me',
  // 'geojson-to-wfs-t-2'
  'geojson-to-gml',
  'wfst-2-examples',
  'maki-choice',
  'UDR',
  // 'pdf-hardlinkr',
].map((e)=>portfolioContext[e]);
console.log(portfolioContext);

var mainTemplate = template('main.handlebars', {encoding:'utf8'});
console.log(mainTemplate({"portfolio-item":portfolioContext}));

fs.writeFileSync('index.html', mainTemplate({"portfolio-item":portfolioContext}));

console.log('built');
