const handlebars = require('handlebars');
const fs = require('fs');


let template = (filePath) => handlebars.compile(fs.readFileSync(path));
// init
var context = {};
fs.readdirSync('/src/portfolio-items').forEach(
    function(item){
	var demo, blurb, title;
	var _path = 'src/portfolio-items/' + item;
	fs.readdirSync(_path).forEach(
	    function(f){
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
	context[item] = {demo, blurb, title, hasDemo:(demo?true:false)};
	//
    }
);
	
// init template


console.log('built');

