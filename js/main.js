(function () {
'use strict';

/* Convert geojson into gml 2.1.2 simple features.
 GML models from https://docs.oracle.com/cd/E11882_01/appdev.112/e11829/oracle/spatial/util/GML.html
 */
/**
 * returns a string with the first letter capitalized.
 * @function 
 * @private 
 * @param {string} str
 * @returns {string} a string with the first letter capitalized.
 */
function capitalizeFirstLetter(str){
  return str.replace(/^./, (letter) => letter.toUpperCase());
}
/**
 * returns a string with the first letter lowered.
 * @function 
 * @private 
 * @param {string} str
 * @returns {string} a string with the first letter lowered.
 */
function lowerFirstLetter(str){
  return str.replace(/^./, (letter)=>letter.toLowerCase());
}
/** 
 * converts a geojson geometry Point to gml
 * @function 
 * @param {number[]} coords the coordinates member of the geometry
 * @param {string|undefined} srsName a string specifying SRS
 * @returns {string} a string of gml describing the input geometry
 */
function Point(coords, srsName){
  return `<gml:Point${(srsName ? ` srsName="${srsName}"` : '')}>` +
    '<gml:coordinates cs="," ts=" " decimal=".">' +
    coords.join() +
    '</gml:coordinates>' +
    '</gml:Point>';
}
/**
 * converts a geojson geometry LineString to gml
 * @function 
 * @param {number[][]} coords the coordinates member of the geometry
 * @param {string|undefined} srsName a string specifying SRS
 * @returns {string} a string of gml describing the input geometry
 */
function LineString(coords, srsName){
  return `<gml:LineString${(srsName ? ` srsName="${srsName}"`:'')}>` +
    '<gml:coordinates cs="," ts=" " decimal=".">' +
    coords.join(' ') +
    '</gml:coordinates>' +
    '</gml:LineString>';
}
/**
 * converts a geojson geometry ring in a polygon to gml
 * @function 
 * @param {number[][]} coords the coordinates member of the geometry
 * @param {string|undefined} srsName a string specifying SRS
 * @returns {string} a string of gml describing the input geometry
 */
function LinearRing(coords, srsName){
  return `<gml:LinearRing${(srsName ? ` srsName="${srsName}"`:'')}>` +
    '<gml:coordinates cs="," ts=" " decimal=".">' +
    coords.join(' ') + 
    '</gml:coordinates>' +
    '</gml:LinearRing>';
}
/**
 * converts a geojson geometry Polygon to gml
 * @function 
 * @param {number[][][]} coords the coordinates member of the geometry
 * @param {string|undefined} srsName a string specifying SRS
 * @returns {string} a string of gml describing the input geometry
 */
function Polygon(coords, srsName){
  // geom.coordinates are arrays of LinearRings
  let polygon = `<gml:Polygon${(srsName ? ` srsName="${srsName}"`:'')}>` +
	'<gml:outerBoundaryIs>' +
	LinearRing(coords[0]) +
	'</gml:outerBoundaryIs>';
  if (coords.length >= 2){
    for (let linearRing of coords.slice(1)){
      polygon += '<gml:innerBoundaryIs>' +
	LinearRing(linearRing) + 
	'</gml:innerBoundaryIs>';
    }
  }
  polygon += '</gml:Polygon>';
  return polygon;
}
/**
 * Handles multigeometries or geometry collections
 * @function
 * @param {Object} geom a geojson geometry object
 * @param {string} name the name of the multigeometry, e.g. 'MultiPolygon'
 * @param {string|undefined} srsName a string specifying the SRS
 * @param {string} memberPrefix the prefix of a gml member tag
 * @returns {string} a string of gml describing the input multigeometry
 * @throws {Error} will throw an error if a member geometry is supplied without a `type` attribute
 */
function _multi(geom, name, cb, srsName, memberPrefix=''){
  let multi = `<gml:${name}${(srsName ? ` srsName="${srsName}"` : '')}>`;
  for (let member of geom){
    var _memberPrefix = '';
    if (member.type){
      // geometryCollection: memberPrefix should be '',
      memberPrefix = lowerFirstLetter(member.type);
      member = member.coordinates;
    }
    if (!memberPrefix){
      throw 'un-typed member ' + JSON.stringify(member);
    } else {
      _memberPrefix = capitalizeFirstLetter(memberPrefix);
    }
    let inner = (cb[_memberPrefix] || cb)(member, srsName='');
    multi += `<gml:${memberPrefix}Member>${inner}</gml:${memberPrefix}Member>`;
  }
  multi += `</gml:${name}>`;
  return multi;
}
/**
 * converts a geojson geometry MultiPoint to gml
 * @function 
 * @param {number[][]} coords the coordinates member of the geometry
 * @param {string|undefined} srsName a string specifying SRS
 * @returns {string} a string of gml describing the input geometry
 * @see _multi
 * @see Point
 */
function MultiPoint(coords, srsName){
  return _multi(coords, 'MultiPoint', Point, srsName, 'point');
}
/**
 * converts a geojson geometry MultiLineString to gml
 * @function 
 * @param {number[][][]} coords the coordinates member of the geometry
 * @param {string|undefined} srsName a string specifying SRS
 * @returns {string} a string of gml describing the input geometry
 * @see _multi
 * @see LineString
 */
function MultiLineString(coords, srsName){
  return _multi(coords, 'MultiLineString', LineString, srsName, 'lineString');
}
/**
 * converts a geojson geometry MultiPolygon to gml
 * @function 
 * @param {number[][][][]} coords the coordinates member of the geometry
 * @param {string|undefined} srsName a string specifying SRS
 * @returns {string} a string of gml describing the input geometry
 * @see _multi
 * @see Polygon
 */
function MultiPolygon(coords, srsName){
  return _multi(coords, 'MultiPolygon', Polygon, srsName, 'polygon');
}
const converter = {
  Point, LineString, LinearRing, Polygon,
  MultiPoint, MultiLineString, MultiPolygon, GeometryCollection
};

/**
 * converts a geojson geometry GeometryCollection to gml MultiGeometry
 * @function 
 * @param {Object[]} geoms an array of geojson geometry objects
 * @param {string|undefined} srsName a string specifying SRS
 * @returns {string} a string of gml describing the input GeometryCollection
 * @see _multi
 */
function GeometryCollection(geoms, srsName){
  return _multi(geoms, 'MultiGeometry', converter, srsName, 'geometry');
}

/**
 * Translate geojson to gml 2.1.2 for any geojson geometry type
 * @function 
 * @param {Object} geom a geojson geometry object
 * @param {string|undefined} srsName a string specifying SRS
 * @returns {string} a string of gml describing the input geometry
 */
function geomToGml(geom, srsName='EPSG:4326'){
  return converter[geom.type](geom.coordinates || geom.geometries, srsName);
}

/* 
 Note this can only convert what geojson can store: simple feature types, not
 coverage, topology, etc.
 */
/** @private*/
function attrs(attrMappings){
  let results = '';
  for (let attrName in attrMappings){
    let value = attrMappings[attrName];
    results += (value ? ` ${attrName}="${value}"` : '');
  }
  return results;
}

/**
 * checks outer scope for gmlId argument/variable
 * @function 
 */
const enforceGmlId = (gmlId) =>{
  if (!gmlId){
    console.warn('No gmlId supplied');
  }
};

/**
 * A handler to compile geometries to multigeometries
 * @function
 * @param {string} name the name of the target multigeometry
 * @param {string} memberName the gml:tag of each multigeometry member.
 * @param {Object[]|Array} geom an array of geojson geometries
 * @param {string|number} gmlId the gml:id of the multigeometry
 * @param {Object} params optional parameters. Omit gmlIds at your own risk, however.
 * @param {string|undefined} params.srsName as string specifying SRS
 * @param {number[]|string[]} params.gmlIds an array of number/string gml:ids of the member geometries.
 * @param {number|string|undefined} params.srsDimension the dimensionality of each coordinate, i.e. 2 or 3.
 * @returns {string} a string containing gml describing the input multigeometry
 * @throws {Error} if a member geometry cannot be converted to gml
 */
function multi(name, memberName, membercb, geom, gmlId, params={}){
  enforceGmlId(gmlId);
  var {srsName, gmlIds} = params;
  let multi = `<gml:${name}${attrs({srsName, 'gml:id':gmlId})}>`;
  geom.forEach(function(member, i){
    multi += `<gml:${memberName}>`;
    let _gmlId = member.id || (gmlIds || [])[i] || '';
    if (name == 'MultiGeometry'){
      let memberType = member.type;
      member = member.coordinates;
      multi += membercb[memberType](member, _gmlId, params);
    } else {
      multi += membercb(member, _gmlId, params);
    }
    multi += `</gml:${memberName}>`;
  });
  return multi + `</gml:${name}>`;
}
/**
 * Converts an input geojson Point geometry to gml
 * @function 
 * @param {number[]} coords the coordinates member of the geojson geometry
 * @param {string|number} gmlId the gml:id
 * @param {Object} params optional parameters
 * @param {string|undefined} params.srsName as string specifying SRS
 * @param {number|string|undefined} params.srsDimension the dimensionality of each coordinate, i.e. 2 or 3.
 * @returns {string} a string containing gml representing the input geometry
 */
function Point$1(coords, gmlId, params={}){
  enforceGmlId(gmlId);
  var {srsName:srsName, srsDimension:srsDimension} = params;
  return `<gml:Point${attrs({srsName:srsName, 'gml:id': gmlId})}>` +
    `<gml:pos${attrs({srsDimension})}>` +
    coords.reverse().join(' ') +
    '</gml:pos>' +
    '</gml:Point>';
}
/**
 * Converts an input geojson LineString geometry to gml
 * @function 
 * @param {number[][]} coords the coordinates member of the geojson geometry
 * @param {string|number} gmlId the gml:id
 * @param {Object} params optional parameters
 * @param {string|undefined} params.srsName as string specifying SRS
 * @param {number|string|undefined} params.srsDimension the dimensionality of each coordinate, i.e. 2 or 3.
 * @returns {string} a string containing gml representing the input geometry
 */
function LineString$1(coords, gmlId, params={}){
  enforceGmlId(gmlId);
  var {srsName:srsName, srsDimension:srsDimension} = params;
  return `<gml:LineString${attrs({srsName, 'gml:id':gmlId})}>` +
    `<gml:posList${attrs({srsDimension})}>` +
    coords.map((e)=>e.reverse().join(' ')).join(' ') + 
    '</gml:posList>' +
    '</gml:LineString>';
}
/**
 * Converts an input geojson LinearRing member of a polygon geometry to gml
 * @function 
 * @param {number[][]} coords the coordinates member of the geojson geometry
 * @param {string|number} gmlId the gml:id
 * @param {Object} params optional parameters
 * @param {string|undefined} params.srsName as string specifying SRS
 * @param {number|string|undefined} params.srsDimension the dimensionality of each coordinate, i.e. 2 or 3.
 * @returns {string} a string containing gml representing the input geometry
 */
function LinearRing$1(coords, gmlId, params={}){
  enforceGmlId(gmlId);
  var {srsName:srsName, srsDimension:srsDimension} = params;
  return `<gml:LinearRing${attrs({'gml:id':gmlId, srsName})}>` +
    `<gml:posList${attrs({srsDimension})}>` +
    coords.map((e)=>e.reverse().join(' ')).join(' ') + 
    '</gml:posList>' + 
    '</gml:LinearRing>';
}
/**
 * Converts an input geojson Polygon geometry to gml
 * @function 
 * @param {number[][][]} coords the coordinates member of the geojson geometry
 * @param {string|number} gmlId the gml:id
 * @param {Object} params optional parameters
 * @param {string|undefined} params.srsName as string specifying SRS
 * @param {number|string|undefined} params.srsDimension the dimensionality of each coordinate, i.e. 2 or 3.
 * @returns {string} a string containing gml representing the input geometry
 */
function Polygon$1(coords, gmlId, params={}){
  enforceGmlId(gmlId);
  // geom.coordinates are arrays of LinearRings
  var {srsName} = params;
  let polygon = `<gml:Polygon${attrs({srsName, 'gml:id':gmlId})}>` +
        '<gml:exterior>' +
        LinearRing$1(coords[0]) +
        '</gml:exterior>';
  if (coords.length >= 2){
    for (let linearRing of coords.slice(1)){
      polygon += '<gml:interior>' +
        LinearRing$1(linearRing) + 
        '</gml:interior>';
    }
  }
  polygon += '</gml:Polygon>';
  return polygon;
}
/**
 * Converts an input geojson MultiPoint geometry to gml
 * @function
 * @param {number[][]} coords the coordinates member of the geojson geometry
 * @param {string|number} gmlId the gml:id
 * @param {Object} params optional parameters
 * @param {string|undefined} params.srsName as string specifying SRS
 * @param {number|string|undefined} params.srsDimension the dimensionality of each coordinate, i.e. 2 or 3.
 * @returns {string} a string containing gml representing the input geometry
 */
function MultiPoint$1(coords, gmlId, params={}){
  enforceGmlId(gmlId);
  return multi('MultiPoint', 'pointMember', Point$1, coords, gmlId, params);
}

/**
 * Converts an input geojson MultiLineString geometry to gml
 * @function 
 * @param {number[][][]} coords the coordinates member of the geojson geometry
 * @param {string|number} gmlId the gml:id
 * @param {Object} params optional parameters
 * @param {string|undefined} params.srsName as string specifying SRS
 * @param {number|string|undefined} params.srsDimension the dimensionality of each coordinate, i.e. 2 or 3.
 * @returns {string} a string containing gml representing the input geometry
 */
function MultiLineString$1(coords, gmlId, params={}){
  return multi('MultiCurve', 'curveMember', LineString$1, coords, gmlId, params);
}
/**
 * Converts an input geojson MultiPolygon geometry to gml
 * @function 
 * @param {number[][][][]} coords the coordinates member of the geojson geometry
 * @param {string|number} gmlId the gml:id
 * @param {Object} params optional parameters
 * @param {string|undefined} params.srsName as string specifying SRS
 * @param {number|string|undefined} params.srsDimension the dimensionality of each coordinate, i.e. 2 or 3.
 * @returns {string} a string containing gml representing the input geometry
 */
function MultiPolygon$1(coords, gmlId, params={}){
  return multi('MultiSurface', 'surfaceMember', Polygon$1, coords, gmlId, params);
}
/** @const 
 * @desc a namespace to switch between geojson-handling functions by geojson.type
 */
const converter$1 = {
  Point: Point$1, LineString: LineString$1, LinearRing: LinearRing$1, Polygon: Polygon$1, MultiPoint: MultiPoint$1, MultiLineString: MultiLineString$1,
  MultiPolygon: MultiPolygon$1, GeometryCollection: GeometryCollection$1
};
/**
 * Converts an input geojson GeometryCollection geometry to gml
 * @function 
 * @param {Object[]} coords the coordinates member of the geojson geometry
 * @param {string|number} gmlId the gml:id
 * @param {Object} params optional parameters
 * @param {string|undefined} params.srsName as string specifying SRS
 * @param {number|string|undefined} params.srsDimension the dimensionality of each coordinate, i.e. 2 or 3.
 * @returns {string} a string containing gml representing the input geometry
 */
function GeometryCollection$1(geoms, gmlId, params={}){
  return multi('MultiGeometry', 'geometryMember', converter$1,
               geoms, gmlId, params);
}

/**
 * Translates any geojson geometry into GML 3.2.1
 * @public 
 * @function 
 * @param {Object} geom a geojson geometry object
 * @param {Array|undefined} geom.coordinates the nested array of coordinates forming the geometry
 * @param {Object[]|undefined} geom.geometries for a GeometryCollection only, the array of member geometry objects
 * @param {string|number} gmlId the gml:id of the geometry
 * @param {object} params optional parameters
 * @param {string|undefined} params.srsName a string specifying the SRS
 * @param {string|undefined} params.srsDimension the dimensionality of each coordinate, i.e. 2 or 3.
 * @param {number[]|string[]|undefined} gmlIds  an array of number/string gml:ids of the member geometries of a multigeometry.
 * @returns {string} a valid gml string describing the input geojson geometry
 */
function geomToGml$1(geom, gmlId, params){
  return converter$1[geom.type](
    geom.coordinates || geom.geometries,
    gmlId,
    params
  );
}

/** @const {Object} xml */
const xml = {
  /**
   * Turns an object into a string of xml attribute key-value pairs.
   * @memberOf xml.
   * @function
   * @param {Object} attrs an object mapping attribute names to attribute values
   * @returns {string} a string of xml attribute key-value pairs
   */
  'attrs': function(attrs){
    return Object.keys(attrs)
      .map((a) => attrs[a] ? ` ${a}="${attrs[a]}"` : '')
      .join('');
  },
  /**
   * Creates a string xml tag.
   * @function 
   * @memberOf xml.
   * @param {string} ns the tag's xml namespace abbreviation.
   * @param {string} tagName the tag name.
   * @param {Object} attrs @see xml.attrs.
   * @param {string} inner inner xml.
   * @returns {string} an xml string.
   */
  'tag': function(ns, tagName, attrs, inner){ // TODO: self-closing
    let tag = (ns ? `${ns}:` : '') + tagName;
    if (tagName){
      return `<${tag}${this.attrs(attrs)}>${inner}</${tag}>`;   
    } else {
      throw new Error('no tag supplied ' + JSON.stringify(arguments));
    }
  }
};
/**
 * Shorthand for creating a wfs xml tag.
 * @param {string} tagName a valid wfs tag name.
 * @param {Object} attrs @see xml.attrs.
 * @param {string} inner @see xml.tag.
 */
const wfs = (tagName, attrs, inner) => xml.tag('wfs', tagName, attrs, inner);
/**
 * Ensures the result is an array.
 * @param {Array|Object} maybe a GeoJSON Feature or FeatureCollection object or an array thereof.
 */
const ensureArray = (...maybe)=> (maybe[0].features || [].concat(...maybe))
	.filter((f) => f);
/**
 * Ensures a layer.id format of an input id.
 * @param {string} lyr layer name
 * @param {string} id id, possibly already in correct layer.id format.
 * @returns {string} a correctly-formatted gml:id
 */
const ensureId = (lyr, id) => /\./.exec(id || '') ? id :`${lyr}.${id}`;
/**
 * returns a correctly-formatted typeName
 * @param {string} ns namespace
 * @param {string} layer layer name
 * @param {string} typeName typeName to check
 * @returns {string} a correctly-formatted typeName
 * @throws {Error} if typeName it cannot form a typeName from ns and layer
 */
const ensureTypeName = (ns, layer, typeName) =>{
  if (!typeName && !(ns && layer)){
    throw new Error(`no typename possible: ${JSON.stringify({typeName, ns, layer})}`);
  }
  return typeName || `${ns}:${layer}Type`;
};

/**
 * Stands in for other functions in swich statements, etc. Does nothing.
 * @function 
 */
const pass = () => '';

/**
 * Iterates over the key-value pairs, filtering by a whitelist if available.
 * @param {Array<string>} whitelist a whitelist of property names
 * @param {Object} properties an object mapping property names to values
 * @param {Function} cb a function to call on each (whitelisted key, value) pair
 */
const useWhitelistIfAvailable = (whitelist, properties, cb) =>{
  for (let prop of whitelist || Object.keys(properties)){
    properties[prop] ? cb(prop, properties[prop]) : pass();
  }
};
/**
 * Creates a fes:ResourceId filter from a layername and id
 * @param {string} lyr layer name of the filtered feature
 * @param {string} id feature id
 */
const idFilter = (lyr, id) => `<fes:ResourceId rid="${ensureId(lyr, id)}"/>`;

const unpack = (()=>{
  let featureMembers = new Set(['properties', 'geometry', 'id', 'layer']);
  /**
   * Resolves attributes from feature, then params unless they are normally
   * found in the feature
   * @param {Object} feature a geojson feature
   * @param {Object} params an object of backup / override parameters
   * @param {Array<string>} args parameter names to resolve from feature or params
   * @returns {Object} an object mapping each named parameter to its resolved value
   */
  return (feature, params, ...args) => {
    let results = {};
    for (let arg of args){
      if (arg === 'layer'){
	results[arg] = (params.layer || {}).id || params.layer
	  || (feature.layer||{}).id || feature.layer || '';
      } else if (!featureMembers.has(arg)){
        results[arg] = feature[arg] || params[arg] || '';
      } else {
        results[arg] = params[arg] || feature[arg]  || '';
      }
    }
    return results;
  };
})();

/**
 * Builds a filter from feature ids if one is not already input.
 * @function 
 * @param {string|undefined} filter a possible string filter
 * @param {Array<Object>} features an array of geojson feature objects
 * @param {Object} params an object of backup / override parameters
 * @returns {string} A filter, or the input filter if it was a string.
 */
function ensureFilter(filter, features, params){
  if (!filter){
    filter = '';
    for (let feature of features){
      let layer = unpack(feature, params);
      filter += idFilter(layer, feature.id);
    }
    return `<fes:Filter>${filter}</fes:Filter>`;
  } else {
    return filter;
  }
}
/**
 * An object containing optional named parameters.
 * @typedef {Object} Params
 * @prop {string|undefined} ns an xml namespace alias.
 * @prop {string|Object|undefined} layer a string layer name or {id}, where id
 * is the layer name
 * @prop {string|undefined} geometry_name the name of the feature geometry field.
 * @prop {Object|undefined} properties an object mapping feature field names to feature properties
 * @prop {string|undefined} id a string feature id.
 * @prop {string[]|undefined} whitelist an array of string field names to 
 * use from @see Params.properties
 * @prop {string|undefined} inputFormat inputFormat, as specified at 
 * [OGC 09-025r2 § 7.6.5.4]{@link http://docs.opengeospatial.org/is/09-025r2/09-025r2.html#65}.
 * @prop {string|undefined} srsName srsName, as specified at 
 * [OGC 09-025r2 § 7.6.5.5]{@link http://docs.opengeospatial.org/is/09-025r2/09-025r2.html#66}.
 * if undefined, the gml3 module will default to 'EPSG:4326'.
 * @prop {string|undefined} handle handle parameter, as specified at
 * [OGC 09-025r2 § 7.6.2.6 ]{@link http://docs.opengeospatial.org/is/09-025r2/09-025r2.html#44}
 * @prop {string|undefined} filter a string fes:Filter.
 * @prop {string|undefined} typeName a string specifying the feature type within
 * its namespace. See [09-025r2 § 7.9.2.4.1]{@link http://docs.opengeospatial.org/is/09-025r2/09-025r2.html#90}.
 * @prop {Object|undefined} schemaLocations an object mapping uri to schemalocation
 * @prop {Object|undefined} nsAssignments an object mapping ns to uri
 */

/**
 * A GeoJSON feature with the following optional foreign members (see 
 * [rfc7965 § 6]{@link https://tools.ietf.org/html/rfc7946#section-6}).
 * or an object with some of the following members.
 * Members of Feature will be used over those in Params except for layer, id,
 * and properties.
 * @typedef {Object} Feature
 * @extends Params
 * @property {Object|undefined} geometry a GeoJSON geometry.
 * @property {string|undefined} type 'Feature'.
 * @example 
 * {'id':'tasmania_roads.1', 'typeName':'topp:tasmania_roadsType'} 
 * // can be passed to Delete
 */

/**
 * a GeoJSON FeatureCollection with optional foreign members as in Feature.
 * @typedef {Object} FeatureCollection
 * @extends Feature
 * @property {string} type 'FeatureCollection'.
 * @property {Feature[]} features an array of GeoJSON Features.
 */

/**
 * Turns an array of geojson features into gml:_feature strings describing them.
 * @function 
 * @param {Feature[]} features an array of features to translate to 
 * gml:_features.
 * @param {Params} params an object of backup / override parameters 
 * @returns {string} a gml:_feature string.
 */
function translateFeatures(features, params={}){
  let inner = '';
  let {srsName} = params;
  for (let feature of features){
    //TODO: add whitelist support
    let {ns, layer, geometry_name, properties, id, whitelist} = unpack(
      feature, params, 'ns', 'layer', 'geometry_name', 'properties', 'id', 'whitelist'
    );
    let fields = '';
    if (geometry_name){
      fields += xml.tag(
	ns, geometry_name, {}, geomToGml$1(feature.geometry, '', {srsName})
      );
    }
    useWhitelistIfAvailable(
      whitelist, properties,
      (prop, val)=>fields += xml.tag(ns, prop, {}, properties[prop])
    );
    inner += xml.tag(ns, layer, {'gml:id': ensureId(layer, id)}, fields);
  }
  return inner;
}

/**
 * Returns a wfs:Insert tag wrapping a translated feature
 * @function 
 * @param {Feature[]|FeatureCollection|Feature} features Feature(s) to pass to @see translateFeatures
 * @param {Params} params to be passed to @see translateFeatures, with optional
 * inputFormat, srsName, handle for the wfs:Insert tag.
 * @returns {string} a wfs:Insert string.
 */
function Insert(features, params={}){
  features = ensureArray(features);
  let {inputFormat, srsName, handle} = params;
  if (!features.length){
    console.warn('no features supplied');
    return '';
  }
  let toInsert = translateFeatures(features, params);
  return xml.tag('wfs', 'Insert', {inputFormat, srsName, handle}, toInsert);
}

/**
 * Updates the input features in bulk with params.properties or by id.
 * @param {Feature[]|FeatureCollection} features features to update.  These may 
 * pass in geometry_name, properties, and layer (overruled by params) and 
 * ns, layer, srsName (overruling params).
 * @param {Params} params with optional properties, ns, layer, geometry_name,
 * filter, typeName, whitelist.
 * @returns {string} a string wfs:Upate action.
 */
function Update(features, params={}){
  features = ensureArray(features);
  /**
   * makes a wfs:Property string containg a wfs:ValueReference, wfs:Value pair.
   * @function 
   * @memberof Update~
   * @param {string} prop the field/property name
   * @param {string} val the field/property value 
   * @param {string} action one of 'insertBefore', 'insertAfter', 'remove',
   * 'replace'. See [OGC 09-025r2 § 15.2.5.2.1]{@link http://docs.opengeospatial.org/is/09-025r2/09-025r2.html#286}.
   * `action` would delete or modify the order of fields within the remote
   * feature. There is currently no way to input `action,` since wfs:Update's
   * default action, 'replace', is sufficient.
   */
  const makeKvp = (prop, val, action) => wfs(
    'Property', {},
    wfs('ValueReference', {action}, prop) +
      (val == undefined ? wfs('Value', {}, val): '')
  );
  if (params.properties){
    let {handle, inputFormat, filter, typeName, whitelist} = params;
    let { srsName, ns, layer, geometry_name } = unpack(
      features[0] || {}, params, 'srsName', 'ns', 'layer', 'geometry_name');
    typeName = ensureTypeName(ns, layer, typeName);
    filter = ensureFilter(filter, features, params);
    if (!filter && !features.length){
      console.warn('neither features nor filter supplied');
      return '';
    }
    let fields = '';
    useWhitelistIfAvailable( // TODO: action attr
      whitelist, params.properties, (k, v) => fields += makeKvp(k,v)
    );
    if (geometry_name){
      fields +=  xml.tag(
	ns, geometry_name, {}, geomToGml$1(params.geometry, '', {srsName})
      );
    }
    return wfs('Update', {inputFormat, srsName, typeName}, fields + filter);
  } else {
    // encapsulate each update in its own Update tag
    return features.map(
      (f) => Update(
        f, Object.assign({}, params, {properties:f.properties})
      )
    ).join('');
  }
}

/**
 * Creates a wfs:Delete action, creating a filter and typeName from feature ids 
 * if none are supplied.
 * @param {Feature[]|FeatureCollection|Feature} features
 * @param {Params} params optional parameter overrides.
 * @param {string} [params.ns] @see Params.ns
 * @param {string|Object} [params.layer] @see Params.layer
 * @param {string} [params.typeName] @see Params.typeName. This will be inferred
 * from feature/params layer and ns if this is left undefined.
 * @param {filter} [params.filter] @see Params.filter.  This will be inferred
 * from feature ids and layer(s) if left undefined (@see ensureFilter).
 * @returns {string} a wfs:Delete string.
 */
function Delete(features, params={}){
  features = ensureArray(features);
  let {filter, typeName} = params; //TODO: recure & encapsulate by typeName
  let {ns, layer} = unpack(features[0] || {}, params, 'layer', 'ns');
  typeName = ensureTypeName(ns, layer, typeName);
  filter = ensureFilter(filter, features, params);
  return wfs('Delete', {typeName}, filter); 
}

/**
 * Wraps the input actions in a wfs:Transaction.
 * @param {Object|string[]|string} actions an object mapping {Insert, Update,
 * Delete} to feature(s) to pass to Insert, Update, Delete, or wfs:action 
 * string(s) to wrap in a transaction.
 * @param {Object} params optional srsName, lockId, releaseAction, handle,
 * inputFormat, version, and required nsAssignments, schemaLocations.
 * @returns {string} A wfs:transaction wrapping the input actions.
 * @throws {Error} if `actions` is not an array of strings, a string, or 
 * {@see Insert, @see Update, @see Delete}, where each action are valid inputs 
 * to the eponymous function.
 */
function Transaction(actions, params={}){
  let {
    srsName, lockId, releaseAction, handle, inputFormat, version, // optional
    nsAssignments, schemaLocations // required
  } = params;
  let converter = {Insert, Update, Delete};
  let {insert:toInsert, update:toUpdate, delete:toDelete} = actions || {};
  let finalActions = ''; // processedActions would be more accurate
  
  if (Array.isArray(actions) && actions.every((v) => typeof(v) == 'string')){
    finalActions += actions.join('');
  } else if (typeof(actions) == 'string') {
    finalActions = actions;
  }
    else if ([toInsert, toUpdate, toDelete].some((e) => e)){
    finalActions += Insert(toInsert, params) +
      Update(toUpdate, params) +
      Delete(toDelete, params);
  } else {
    throw new Error(`unexpected input: ${JSON.stringify(actions)}`);
  }
  // generate schemaLocation, xmlns's
  nsAssignments = nsAssignments || {};
  schemaLocations = schemaLocations || {};
  let attrs = generateNsAssignments(nsAssignments, actions);
  attrs['xsi:schemaLocation'] =  generateSchemaLines(params.schemaLocations);
  attrs['service'] = 'WFS';
  attrs['version'] = /2\.0\.\d+/.exec(version || '') ? version : '2.0.0';
  return wfs('Transaction', attrs, finalActions);
}

/**
 * Generates an object to be passed to @see xml.attrs xmlns:ns="uri" definitions for a wfs:Transaction
 * @param {Object} nsAssignments @see Params.nsAssignments
 * @param {string} xml arbitrary xml.
 * @returns {Object} an object mapping each ns to its URI as 'xmlns:ns' : 'URI'.
 * @throws {Error} if any namespace used within `xml` is missing a URI definition
 */
function generateNsAssignments(nsAssignments, xml){
  let attrs = {};
  const makeNsAssignment = (ns, uri) => attrs[`xmlns:${ns}`] = uri;
  for (let ns in nsAssignments){
    makeNsAssignment(ns, nsAssignments[ns]);
  }
  // check all ns's assigned 
  var re = /(<|typeName=")(\w+):/g;
  var arr;
  var allNamespaces = new Set();
  while ((arr = re.exec(xml)) !== null){
    allNamespaces.add(arr[2]);
  }
  if (allNamespaces.has('fes')){
    makeNsAssignment('fes', 'http://www.opengis.net/fes/2.0');
  }
  makeNsAssignment('xsi', 'http://www.w3.org/2001/XMLSchema-instance');
  makeNsAssignment('gml', 'http://www.opengis.net/gml/3.2');
  makeNsAssignment('wfs', 'http://www.opengis.net/wfs/2.0');

  for (let ns of allNamespaces){
    if (!attrs['xmlns:' + ns]){
      throw new Error(`unassigned namespace ${ns}`);
    }
  }
  return attrs;
}

/**
 * Returns a string alternating uri, whitespace, and the uri's schema's location.
 * @param {Object} schemaLocations an object mapping uri:schemalocation
 * @returns {string} a string that is a valid xsi:schemaLocation value.
 */
function generateSchemaLines(schemaLocations={}){
  //TODO: add ns assignment check
  schemaLocations['http://www.opengis.net/wfs/2.0'] = 
    'http://schemas.opengis.net/wfs/2.0/wfs.xsd';
  var schemaLines = [];
  for (let uri in schemaLocations){
    schemaLines.push(`${uri}\n${schemaLocations[uri]}`);
  }
  return schemaLines.join('\n');
}

/* toggles */
$('.portfolio-toggle').on('click', function () {
    $(this).next('.portfolio-item').slideToggle(300);
    // TODO: ensure the toggled item is in view
});

/* translation function */
function translator(button, from, to, translatorCb) {
    $(button).mouseup(e => {
        try {
            debugger;
            const toTranslate = JSON.parse($(from).text());
            const translated = formatXml(translatorCb(toTranslate));
            try {
                $(to).text(translated);
            } catch (err) {
                $(to).val(translated);
            }
        } catch (err) {
            alert(err);
        }
    });
}

/* Geojson -> GML example */
translator('#translate-geojson-gml-2', '#geojson-sample-gml', '#gml-target', toTranslate => geomToGml(toTranslate));
translator('#translate-geojson-gml-3', '#geojson-sample-gml', '#gml-target', toTranslate => geomToGml$1(toTranslate));
translator('#translate-geojson-wfst', '#geojson-sample-wfs', '#gml-target', toTranslate => Transaction(Insert(toTranslate)));
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
$(document).ready(() => $(window.location.hash || '#about-me').show());

$('a.link-right').on("click", function (e) {
    $($(this).attr('href')).show();
    e.stopPropagation();
});

}());
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsiLi4vbm9kZV9tb2R1bGVzL2dlb2pzb24tdG8tZ21sLTIvZ2VvbVRvR21sLTIuMS4yLWVzNi5qcyIsIi4uL25vZGVfbW9kdWxlcy9nZW9qc29uLXRvLWdtbC0zL2dlb21Ub0dtbC0zLjIuMS1lczYuanMiLCIuLi9ub2RlX21vZHVsZXMvZ2VvanNvbi10by13ZnMtdC0yL2dlb2pzb24tdG8td2ZzdC0yLWVzNi5qcyIsIi4uL3NyYy9zY3JpcHRzL21haW4uanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyogQ29udmVydCBnZW9qc29uIGludG8gZ21sIDIuMS4yIHNpbXBsZSBmZWF0dXJlcy5cbiBHTUwgbW9kZWxzIGZyb20gaHR0cHM6Ly9kb2NzLm9yYWNsZS5jb20vY2QvRTExODgyXzAxL2FwcGRldi4xMTIvZTExODI5L29yYWNsZS9zcGF0aWFsL3V0aWwvR01MLmh0bWxcbiAqL1xuLyoqXG4gKiByZXR1cm5zIGEgc3RyaW5nIHdpdGggdGhlIGZpcnN0IGxldHRlciBjYXBpdGFsaXplZC5cbiAqIEBmdW5jdGlvbiBcbiAqIEBwcml2YXRlIFxuICogQHBhcmFtIHtzdHJpbmd9IHN0clxuICogQHJldHVybnMge3N0cmluZ30gYSBzdHJpbmcgd2l0aCB0aGUgZmlyc3QgbGV0dGVyIGNhcGl0YWxpemVkLlxuICovXG5mdW5jdGlvbiBjYXBpdGFsaXplRmlyc3RMZXR0ZXIoc3RyKXtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC9eLi8sIChsZXR0ZXIpID0+IGxldHRlci50b1VwcGVyQ2FzZSgpKTtcbn1cbi8qKlxuICogcmV0dXJucyBhIHN0cmluZyB3aXRoIHRoZSBmaXJzdCBsZXR0ZXIgbG93ZXJlZC5cbiAqIEBmdW5jdGlvbiBcbiAqIEBwcml2YXRlIFxuICogQHBhcmFtIHtzdHJpbmd9IHN0clxuICogQHJldHVybnMge3N0cmluZ30gYSBzdHJpbmcgd2l0aCB0aGUgZmlyc3QgbGV0dGVyIGxvd2VyZWQuXG4gKi9cbmZ1bmN0aW9uIGxvd2VyRmlyc3RMZXR0ZXIoc3RyKXtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC9eLi8sIChsZXR0ZXIpPT5sZXR0ZXIudG9Mb3dlckNhc2UoKSk7XG59XG4vKiogXG4gKiBjb252ZXJ0cyBhIGdlb2pzb24gZ2VvbWV0cnkgUG9pbnQgdG8gZ21sXG4gKiBAZnVuY3Rpb24gXG4gKiBAcGFyYW0ge251bWJlcltdfSBjb29yZHMgdGhlIGNvb3JkaW5hdGVzIG1lbWJlciBvZiB0aGUgZ2VvbWV0cnlcbiAqIEBwYXJhbSB7c3RyaW5nfHVuZGVmaW5lZH0gc3JzTmFtZSBhIHN0cmluZyBzcGVjaWZ5aW5nIFNSU1xuICogQHJldHVybnMge3N0cmluZ30gYSBzdHJpbmcgb2YgZ21sIGRlc2NyaWJpbmcgdGhlIGlucHV0IGdlb21ldHJ5XG4gKi9cbmZ1bmN0aW9uIFBvaW50KGNvb3Jkcywgc3JzTmFtZSl7XG4gIHJldHVybiBgPGdtbDpQb2ludCR7KHNyc05hbWUgPyBgIHNyc05hbWU9XCIke3Nyc05hbWV9XCJgIDogJycpfT5gICtcbiAgICAnPGdtbDpjb29yZGluYXRlcyBjcz1cIixcIiB0cz1cIiBcIiBkZWNpbWFsPVwiLlwiPicgK1xuICAgIGNvb3Jkcy5qb2luKCkgK1xuICAgICc8L2dtbDpjb29yZGluYXRlcz4nICtcbiAgICAnPC9nbWw6UG9pbnQ+Jztcbn1cbi8qKlxuICogY29udmVydHMgYSBnZW9qc29uIGdlb21ldHJ5IExpbmVTdHJpbmcgdG8gZ21sXG4gKiBAZnVuY3Rpb24gXG4gKiBAcGFyYW0ge251bWJlcltdW119IGNvb3JkcyB0aGUgY29vcmRpbmF0ZXMgbWVtYmVyIG9mIHRoZSBnZW9tZXRyeVxuICogQHBhcmFtIHtzdHJpbmd8dW5kZWZpbmVkfSBzcnNOYW1lIGEgc3RyaW5nIHNwZWNpZnlpbmcgU1JTXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBhIHN0cmluZyBvZiBnbWwgZGVzY3JpYmluZyB0aGUgaW5wdXQgZ2VvbWV0cnlcbiAqL1xuZnVuY3Rpb24gTGluZVN0cmluZyhjb29yZHMsIHNyc05hbWUpe1xuICByZXR1cm4gYDxnbWw6TGluZVN0cmluZyR7KHNyc05hbWUgPyBgIHNyc05hbWU9XCIke3Nyc05hbWV9XCJgOicnKX0+YCArXG4gICAgJzxnbWw6Y29vcmRpbmF0ZXMgY3M9XCIsXCIgdHM9XCIgXCIgZGVjaW1hbD1cIi5cIj4nICtcbiAgICBjb29yZHMuam9pbignICcpICtcbiAgICAnPC9nbWw6Y29vcmRpbmF0ZXM+JyArXG4gICAgJzwvZ21sOkxpbmVTdHJpbmc+Jztcbn1cbi8qKlxuICogY29udmVydHMgYSBnZW9qc29uIGdlb21ldHJ5IHJpbmcgaW4gYSBwb2x5Z29uIHRvIGdtbFxuICogQGZ1bmN0aW9uIFxuICogQHBhcmFtIHtudW1iZXJbXVtdfSBjb29yZHMgdGhlIGNvb3JkaW5hdGVzIG1lbWJlciBvZiB0aGUgZ2VvbWV0cnlcbiAqIEBwYXJhbSB7c3RyaW5nfHVuZGVmaW5lZH0gc3JzTmFtZSBhIHN0cmluZyBzcGVjaWZ5aW5nIFNSU1xuICogQHJldHVybnMge3N0cmluZ30gYSBzdHJpbmcgb2YgZ21sIGRlc2NyaWJpbmcgdGhlIGlucHV0IGdlb21ldHJ5XG4gKi9cbmZ1bmN0aW9uIExpbmVhclJpbmcoY29vcmRzLCBzcnNOYW1lKXtcbiAgcmV0dXJuIGA8Z21sOkxpbmVhclJpbmckeyhzcnNOYW1lID8gYCBzcnNOYW1lPVwiJHtzcnNOYW1lfVwiYDonJyl9PmAgK1xuICAgICc8Z21sOmNvb3JkaW5hdGVzIGNzPVwiLFwiIHRzPVwiIFwiIGRlY2ltYWw9XCIuXCI+JyArXG4gICAgY29vcmRzLmpvaW4oJyAnKSArIFxuICAgICc8L2dtbDpjb29yZGluYXRlcz4nICtcbiAgICAnPC9nbWw6TGluZWFyUmluZz4nO1xufVxuLyoqXG4gKiBjb252ZXJ0cyBhIGdlb2pzb24gZ2VvbWV0cnkgUG9seWdvbiB0byBnbWxcbiAqIEBmdW5jdGlvbiBcbiAqIEBwYXJhbSB7bnVtYmVyW11bXVtdfSBjb29yZHMgdGhlIGNvb3JkaW5hdGVzIG1lbWJlciBvZiB0aGUgZ2VvbWV0cnlcbiAqIEBwYXJhbSB7c3RyaW5nfHVuZGVmaW5lZH0gc3JzTmFtZSBhIHN0cmluZyBzcGVjaWZ5aW5nIFNSU1xuICogQHJldHVybnMge3N0cmluZ30gYSBzdHJpbmcgb2YgZ21sIGRlc2NyaWJpbmcgdGhlIGlucHV0IGdlb21ldHJ5XG4gKi9cbmZ1bmN0aW9uIFBvbHlnb24oY29vcmRzLCBzcnNOYW1lKXtcbiAgLy8gZ2VvbS5jb29yZGluYXRlcyBhcmUgYXJyYXlzIG9mIExpbmVhclJpbmdzXG4gIGxldCBwb2x5Z29uID0gYDxnbWw6UG9seWdvbiR7KHNyc05hbWUgPyBgIHNyc05hbWU9XCIke3Nyc05hbWV9XCJgOicnKX0+YCArXG5cdCc8Z21sOm91dGVyQm91bmRhcnlJcz4nICtcblx0TGluZWFyUmluZyhjb29yZHNbMF0pICtcblx0JzwvZ21sOm91dGVyQm91bmRhcnlJcz4nO1xuICBpZiAoY29vcmRzLmxlbmd0aCA+PSAyKXtcbiAgICBmb3IgKGxldCBsaW5lYXJSaW5nIG9mIGNvb3Jkcy5zbGljZSgxKSl7XG4gICAgICBwb2x5Z29uICs9ICc8Z21sOmlubmVyQm91bmRhcnlJcz4nICtcblx0TGluZWFyUmluZyhsaW5lYXJSaW5nKSArIFxuXHQnPC9nbWw6aW5uZXJCb3VuZGFyeUlzPic7XG4gICAgfVxuICB9XG4gIHBvbHlnb24gKz0gJzwvZ21sOlBvbHlnb24+JztcbiAgcmV0dXJuIHBvbHlnb247XG59XG4vKipcbiAqIEhhbmRsZXMgbXVsdGlnZW9tZXRyaWVzIG9yIGdlb21ldHJ5IGNvbGxlY3Rpb25zXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7T2JqZWN0fSBnZW9tIGEgZ2VvanNvbiBnZW9tZXRyeSBvYmplY3RcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIHRoZSBuYW1lIG9mIHRoZSBtdWx0aWdlb21ldHJ5LCBlLmcuICdNdWx0aVBvbHlnb24nXG4gKiBAcGFyYW0ge3N0cmluZ3x1bmRlZmluZWR9IHNyc05hbWUgYSBzdHJpbmcgc3BlY2lmeWluZyB0aGUgU1JTXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVtYmVyUHJlZml4IHRoZSBwcmVmaXggb2YgYSBnbWwgbWVtYmVyIHRhZ1xuICogQHJldHVybnMge3N0cmluZ30gYSBzdHJpbmcgb2YgZ21sIGRlc2NyaWJpbmcgdGhlIGlucHV0IG11bHRpZ2VvbWV0cnlcbiAqIEB0aHJvd3Mge0Vycm9yfSB3aWxsIHRocm93IGFuIGVycm9yIGlmIGEgbWVtYmVyIGdlb21ldHJ5IGlzIHN1cHBsaWVkIHdpdGhvdXQgYSBgdHlwZWAgYXR0cmlidXRlXG4gKi9cbmZ1bmN0aW9uIF9tdWx0aShnZW9tLCBuYW1lLCBjYiwgc3JzTmFtZSwgbWVtYmVyUHJlZml4PScnKXtcbiAgbGV0IG11bHRpID0gYDxnbWw6JHtuYW1lfSR7KHNyc05hbWUgPyBgIHNyc05hbWU9XCIke3Nyc05hbWV9XCJgIDogJycpfT5gO1xuICBmb3IgKGxldCBtZW1iZXIgb2YgZ2VvbSl7XG4gICAgdmFyIF9tZW1iZXJQcmVmaXggPSAnJztcbiAgICBpZiAobWVtYmVyLnR5cGUpe1xuICAgICAgLy8gZ2VvbWV0cnlDb2xsZWN0aW9uOiBtZW1iZXJQcmVmaXggc2hvdWxkIGJlICcnLFxuICAgICAgbWVtYmVyUHJlZml4ID0gbG93ZXJGaXJzdExldHRlcihtZW1iZXIudHlwZSk7XG4gICAgICBtZW1iZXIgPSBtZW1iZXIuY29vcmRpbmF0ZXM7XG4gICAgfVxuICAgIGlmICghbWVtYmVyUHJlZml4KXtcbiAgICAgIHRocm93ICd1bi10eXBlZCBtZW1iZXIgJyArIEpTT04uc3RyaW5naWZ5KG1lbWJlcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIF9tZW1iZXJQcmVmaXggPSBjYXBpdGFsaXplRmlyc3RMZXR0ZXIobWVtYmVyUHJlZml4KTtcbiAgICB9XG4gICAgbGV0IGlubmVyID0gKGNiW19tZW1iZXJQcmVmaXhdIHx8IGNiKShtZW1iZXIsIHNyc05hbWU9JycpO1xuICAgIG11bHRpICs9IGA8Z21sOiR7bWVtYmVyUHJlZml4fU1lbWJlcj4ke2lubmVyfTwvZ21sOiR7bWVtYmVyUHJlZml4fU1lbWJlcj5gO1xuICB9XG4gIG11bHRpICs9IGA8L2dtbDoke25hbWV9PmA7XG4gIHJldHVybiBtdWx0aTtcbn1cbi8qKlxuICogY29udmVydHMgYSBnZW9qc29uIGdlb21ldHJ5IE11bHRpUG9pbnQgdG8gZ21sXG4gKiBAZnVuY3Rpb24gXG4gKiBAcGFyYW0ge251bWJlcltdW119IGNvb3JkcyB0aGUgY29vcmRpbmF0ZXMgbWVtYmVyIG9mIHRoZSBnZW9tZXRyeVxuICogQHBhcmFtIHtzdHJpbmd8dW5kZWZpbmVkfSBzcnNOYW1lIGEgc3RyaW5nIHNwZWNpZnlpbmcgU1JTXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBhIHN0cmluZyBvZiBnbWwgZGVzY3JpYmluZyB0aGUgaW5wdXQgZ2VvbWV0cnlcbiAqIEBzZWUgX211bHRpXG4gKiBAc2VlIFBvaW50XG4gKi9cbmZ1bmN0aW9uIE11bHRpUG9pbnQoY29vcmRzLCBzcnNOYW1lKXtcbiAgcmV0dXJuIF9tdWx0aShjb29yZHMsICdNdWx0aVBvaW50JywgUG9pbnQsIHNyc05hbWUsICdwb2ludCcpO1xufVxuLyoqXG4gKiBjb252ZXJ0cyBhIGdlb2pzb24gZ2VvbWV0cnkgTXVsdGlMaW5lU3RyaW5nIHRvIGdtbFxuICogQGZ1bmN0aW9uIFxuICogQHBhcmFtIHtudW1iZXJbXVtdW119IGNvb3JkcyB0aGUgY29vcmRpbmF0ZXMgbWVtYmVyIG9mIHRoZSBnZW9tZXRyeVxuICogQHBhcmFtIHtzdHJpbmd8dW5kZWZpbmVkfSBzcnNOYW1lIGEgc3RyaW5nIHNwZWNpZnlpbmcgU1JTXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBhIHN0cmluZyBvZiBnbWwgZGVzY3JpYmluZyB0aGUgaW5wdXQgZ2VvbWV0cnlcbiAqIEBzZWUgX211bHRpXG4gKiBAc2VlIExpbmVTdHJpbmdcbiAqL1xuZnVuY3Rpb24gTXVsdGlMaW5lU3RyaW5nKGNvb3Jkcywgc3JzTmFtZSl7XG4gIHJldHVybiBfbXVsdGkoY29vcmRzLCAnTXVsdGlMaW5lU3RyaW5nJywgTGluZVN0cmluZywgc3JzTmFtZSwgJ2xpbmVTdHJpbmcnKTtcbn1cbi8qKlxuICogY29udmVydHMgYSBnZW9qc29uIGdlb21ldHJ5IE11bHRpUG9seWdvbiB0byBnbWxcbiAqIEBmdW5jdGlvbiBcbiAqIEBwYXJhbSB7bnVtYmVyW11bXVtdW119IGNvb3JkcyB0aGUgY29vcmRpbmF0ZXMgbWVtYmVyIG9mIHRoZSBnZW9tZXRyeVxuICogQHBhcmFtIHtzdHJpbmd8dW5kZWZpbmVkfSBzcnNOYW1lIGEgc3RyaW5nIHNwZWNpZnlpbmcgU1JTXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBhIHN0cmluZyBvZiBnbWwgZGVzY3JpYmluZyB0aGUgaW5wdXQgZ2VvbWV0cnlcbiAqIEBzZWUgX211bHRpXG4gKiBAc2VlIFBvbHlnb25cbiAqL1xuZnVuY3Rpb24gTXVsdGlQb2x5Z29uKGNvb3Jkcywgc3JzTmFtZSl7XG4gIHJldHVybiBfbXVsdGkoY29vcmRzLCAnTXVsdGlQb2x5Z29uJywgUG9seWdvbiwgc3JzTmFtZSwgJ3BvbHlnb24nKTtcbn1cbmNvbnN0IGNvbnZlcnRlciA9IHtcbiAgUG9pbnQsIExpbmVTdHJpbmcsIExpbmVhclJpbmcsIFBvbHlnb24sXG4gIE11bHRpUG9pbnQsIE11bHRpTGluZVN0cmluZywgTXVsdGlQb2x5Z29uLCBHZW9tZXRyeUNvbGxlY3Rpb25cbn07XG5cbi8qKlxuICogY29udmVydHMgYSBnZW9qc29uIGdlb21ldHJ5IEdlb21ldHJ5Q29sbGVjdGlvbiB0byBnbWwgTXVsdGlHZW9tZXRyeVxuICogQGZ1bmN0aW9uIFxuICogQHBhcmFtIHtPYmplY3RbXX0gZ2VvbXMgYW4gYXJyYXkgb2YgZ2VvanNvbiBnZW9tZXRyeSBvYmplY3RzXG4gKiBAcGFyYW0ge3N0cmluZ3x1bmRlZmluZWR9IHNyc05hbWUgYSBzdHJpbmcgc3BlY2lmeWluZyBTUlNcbiAqIEByZXR1cm5zIHtzdHJpbmd9IGEgc3RyaW5nIG9mIGdtbCBkZXNjcmliaW5nIHRoZSBpbnB1dCBHZW9tZXRyeUNvbGxlY3Rpb25cbiAqIEBzZWUgX211bHRpXG4gKi9cbmZ1bmN0aW9uIEdlb21ldHJ5Q29sbGVjdGlvbihnZW9tcywgc3JzTmFtZSl7XG4gIHJldHVybiBfbXVsdGkoZ2VvbXMsICdNdWx0aUdlb21ldHJ5JywgY29udmVydGVyLCBzcnNOYW1lLCAnZ2VvbWV0cnknKTtcbn1cblxuLyoqXG4gKiBUcmFuc2xhdGUgZ2VvanNvbiB0byBnbWwgMi4xLjIgZm9yIGFueSBnZW9qc29uIGdlb21ldHJ5IHR5cGVcbiAqIEBmdW5jdGlvbiBcbiAqIEBwYXJhbSB7T2JqZWN0fSBnZW9tIGEgZ2VvanNvbiBnZW9tZXRyeSBvYmplY3RcbiAqIEBwYXJhbSB7c3RyaW5nfHVuZGVmaW5lZH0gc3JzTmFtZSBhIHN0cmluZyBzcGVjaWZ5aW5nIFNSU1xuICogQHJldHVybnMge3N0cmluZ30gYSBzdHJpbmcgb2YgZ21sIGRlc2NyaWJpbmcgdGhlIGlucHV0IGdlb21ldHJ5XG4gKi9cbmZ1bmN0aW9uIGdlb21Ub0dtbChnZW9tLCBzcnNOYW1lPSdFUFNHOjQzMjYnKXtcbiAgcmV0dXJuIGNvbnZlcnRlcltnZW9tLnR5cGVdKGdlb20uY29vcmRpbmF0ZXMgfHwgZ2VvbS5nZW9tZXRyaWVzLCBzcnNOYW1lKTtcbn1cbi8qKiBleHBvcnRzIGEgZnVuY3Rpb24gdG8gY29udmVydCBnZW9qc29uIGdlb21ldHJpZXMgdG8gZ21sIDIuMS4yICovXG5leHBvcnQge1xuICBnZW9tVG9HbWwsIFBvaW50LCBMaW5lU3RyaW5nLCBMaW5lYXJSaW5nLCBQb2x5Z29uLFxuICBNdWx0aVBvaW50LCBNdWx0aUxpbmVTdHJpbmcsIE11bHRpUG9seWdvbiwgR2VvbWV0cnlDb2xsZWN0aW9uXG59O1xuIiwiLyogXG4gTm90ZSB0aGlzIGNhbiBvbmx5IGNvbnZlcnQgd2hhdCBnZW9qc29uIGNhbiBzdG9yZTogc2ltcGxlIGZlYXR1cmUgdHlwZXMsIG5vdFxuIGNvdmVyYWdlLCB0b3BvbG9neSwgZXRjLlxuICovXG4vKiogQHByaXZhdGUqL1xuZnVuY3Rpb24gYXR0cnMoYXR0ck1hcHBpbmdzKXtcbiAgbGV0IHJlc3VsdHMgPSAnJztcbiAgZm9yIChsZXQgYXR0ck5hbWUgaW4gYXR0ck1hcHBpbmdzKXtcbiAgICBsZXQgdmFsdWUgPSBhdHRyTWFwcGluZ3NbYXR0ck5hbWVdO1xuICAgIHJlc3VsdHMgKz0gKHZhbHVlID8gYCAke2F0dHJOYW1lfT1cIiR7dmFsdWV9XCJgIDogJycpO1xuICB9XG4gIHJldHVybiByZXN1bHRzO1xufVxuXG4vKipcbiAqIGNoZWNrcyBvdXRlciBzY29wZSBmb3IgZ21sSWQgYXJndW1lbnQvdmFyaWFibGVcbiAqIEBmdW5jdGlvbiBcbiAqL1xuY29uc3QgZW5mb3JjZUdtbElkID0gKGdtbElkKSA9PntcbiAgaWYgKCFnbWxJZCl7XG4gICAgY29uc29sZS53YXJuKCdObyBnbWxJZCBzdXBwbGllZCcpO1xuICB9XG59O1xuXG4vKipcbiAqIEEgaGFuZGxlciB0byBjb21waWxlIGdlb21ldHJpZXMgdG8gbXVsdGlnZW9tZXRyaWVzXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIHRoZSBuYW1lIG9mIHRoZSB0YXJnZXQgbXVsdGlnZW9tZXRyeVxuICogQHBhcmFtIHtzdHJpbmd9IG1lbWJlck5hbWUgdGhlIGdtbDp0YWcgb2YgZWFjaCBtdWx0aWdlb21ldHJ5IG1lbWJlci5cbiAqIEBwYXJhbSB7T2JqZWN0W118QXJyYXl9IGdlb20gYW4gYXJyYXkgb2YgZ2VvanNvbiBnZW9tZXRyaWVzXG4gKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ9IGdtbElkIHRoZSBnbWw6aWQgb2YgdGhlIG11bHRpZ2VvbWV0cnlcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbXMgb3B0aW9uYWwgcGFyYW1ldGVycy4gT21pdCBnbWxJZHMgYXQgeW91ciBvd24gcmlzaywgaG93ZXZlci5cbiAqIEBwYXJhbSB7c3RyaW5nfHVuZGVmaW5lZH0gcGFyYW1zLnNyc05hbWUgYXMgc3RyaW5nIHNwZWNpZnlpbmcgU1JTXG4gKiBAcGFyYW0ge251bWJlcltdfHN0cmluZ1tdfSBwYXJhbXMuZ21sSWRzIGFuIGFycmF5IG9mIG51bWJlci9zdHJpbmcgZ21sOmlkcyBvZiB0aGUgbWVtYmVyIGdlb21ldHJpZXMuXG4gKiBAcGFyYW0ge251bWJlcnxzdHJpbmd8dW5kZWZpbmVkfSBwYXJhbXMuc3JzRGltZW5zaW9uIHRoZSBkaW1lbnNpb25hbGl0eSBvZiBlYWNoIGNvb3JkaW5hdGUsIGkuZS4gMiBvciAzLlxuICogQHJldHVybnMge3N0cmluZ30gYSBzdHJpbmcgY29udGFpbmluZyBnbWwgZGVzY3JpYmluZyB0aGUgaW5wdXQgbXVsdGlnZW9tZXRyeVxuICogQHRocm93cyB7RXJyb3J9IGlmIGEgbWVtYmVyIGdlb21ldHJ5IGNhbm5vdCBiZSBjb252ZXJ0ZWQgdG8gZ21sXG4gKi9cbmZ1bmN0aW9uIG11bHRpKG5hbWUsIG1lbWJlck5hbWUsIG1lbWJlcmNiLCBnZW9tLCBnbWxJZCwgcGFyYW1zPXt9KXtcbiAgZW5mb3JjZUdtbElkKGdtbElkKTtcbiAgdmFyIHtzcnNOYW1lLCBnbWxJZHN9ID0gcGFyYW1zO1xuICBsZXQgbXVsdGkgPSBgPGdtbDoke25hbWV9JHthdHRycyh7c3JzTmFtZSwgJ2dtbDppZCc6Z21sSWR9KX0+YDtcbiAgZ2VvbS5mb3JFYWNoKGZ1bmN0aW9uKG1lbWJlciwgaSl7XG4gICAgbXVsdGkgKz0gYDxnbWw6JHttZW1iZXJOYW1lfT5gO1xuICAgIGxldCBfZ21sSWQgPSBtZW1iZXIuaWQgfHwgKGdtbElkcyB8fCBbXSlbaV0gfHwgJyc7XG4gICAgaWYgKG5hbWUgPT0gJ011bHRpR2VvbWV0cnknKXtcbiAgICAgIGxldCBtZW1iZXJUeXBlID0gbWVtYmVyLnR5cGU7XG4gICAgICBtZW1iZXIgPSBtZW1iZXIuY29vcmRpbmF0ZXM7XG4gICAgICBtdWx0aSArPSBtZW1iZXJjYlttZW1iZXJUeXBlXShtZW1iZXIsIF9nbWxJZCwgcGFyYW1zKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbXVsdGkgKz0gbWVtYmVyY2IobWVtYmVyLCBfZ21sSWQsIHBhcmFtcyk7XG4gICAgfVxuICAgIG11bHRpICs9IGA8L2dtbDoke21lbWJlck5hbWV9PmA7XG4gIH0pO1xuICByZXR1cm4gbXVsdGkgKyBgPC9nbWw6JHtuYW1lfT5gO1xufVxuLyoqXG4gKiBDb252ZXJ0cyBhbiBpbnB1dCBnZW9qc29uIFBvaW50IGdlb21ldHJ5IHRvIGdtbFxuICogQGZ1bmN0aW9uIFxuICogQHBhcmFtIHtudW1iZXJbXX0gY29vcmRzIHRoZSBjb29yZGluYXRlcyBtZW1iZXIgb2YgdGhlIGdlb2pzb24gZ2VvbWV0cnlcbiAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcn0gZ21sSWQgdGhlIGdtbDppZFxuICogQHBhcmFtIHtPYmplY3R9IHBhcmFtcyBvcHRpb25hbCBwYXJhbWV0ZXJzXG4gKiBAcGFyYW0ge3N0cmluZ3x1bmRlZmluZWR9IHBhcmFtcy5zcnNOYW1lIGFzIHN0cmluZyBzcGVjaWZ5aW5nIFNSU1xuICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfHVuZGVmaW5lZH0gcGFyYW1zLnNyc0RpbWVuc2lvbiB0aGUgZGltZW5zaW9uYWxpdHkgb2YgZWFjaCBjb29yZGluYXRlLCBpLmUuIDIgb3IgMy5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IGEgc3RyaW5nIGNvbnRhaW5pbmcgZ21sIHJlcHJlc2VudGluZyB0aGUgaW5wdXQgZ2VvbWV0cnlcbiAqL1xuZnVuY3Rpb24gUG9pbnQoY29vcmRzLCBnbWxJZCwgcGFyYW1zPXt9KXtcbiAgZW5mb3JjZUdtbElkKGdtbElkKTtcbiAgdmFyIHtzcnNOYW1lOnNyc05hbWUsIHNyc0RpbWVuc2lvbjpzcnNEaW1lbnNpb259ID0gcGFyYW1zO1xuICByZXR1cm4gYDxnbWw6UG9pbnQke2F0dHJzKHtzcnNOYW1lOnNyc05hbWUsICdnbWw6aWQnOiBnbWxJZH0pfT5gICtcbiAgICBgPGdtbDpwb3Mke2F0dHJzKHtzcnNEaW1lbnNpb259KX0+YCArXG4gICAgY29vcmRzLnJldmVyc2UoKS5qb2luKCcgJykgK1xuICAgICc8L2dtbDpwb3M+JyArXG4gICAgJzwvZ21sOlBvaW50Pic7XG59XG4vKipcbiAqIENvbnZlcnRzIGFuIGlucHV0IGdlb2pzb24gTGluZVN0cmluZyBnZW9tZXRyeSB0byBnbWxcbiAqIEBmdW5jdGlvbiBcbiAqIEBwYXJhbSB7bnVtYmVyW11bXX0gY29vcmRzIHRoZSBjb29yZGluYXRlcyBtZW1iZXIgb2YgdGhlIGdlb2pzb24gZ2VvbWV0cnlcbiAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcn0gZ21sSWQgdGhlIGdtbDppZFxuICogQHBhcmFtIHtPYmplY3R9IHBhcmFtcyBvcHRpb25hbCBwYXJhbWV0ZXJzXG4gKiBAcGFyYW0ge3N0cmluZ3x1bmRlZmluZWR9IHBhcmFtcy5zcnNOYW1lIGFzIHN0cmluZyBzcGVjaWZ5aW5nIFNSU1xuICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfHVuZGVmaW5lZH0gcGFyYW1zLnNyc0RpbWVuc2lvbiB0aGUgZGltZW5zaW9uYWxpdHkgb2YgZWFjaCBjb29yZGluYXRlLCBpLmUuIDIgb3IgMy5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IGEgc3RyaW5nIGNvbnRhaW5pbmcgZ21sIHJlcHJlc2VudGluZyB0aGUgaW5wdXQgZ2VvbWV0cnlcbiAqL1xuZnVuY3Rpb24gTGluZVN0cmluZyhjb29yZHMsIGdtbElkLCBwYXJhbXM9e30pe1xuICBlbmZvcmNlR21sSWQoZ21sSWQpO1xuICB2YXIge3Nyc05hbWU6c3JzTmFtZSwgc3JzRGltZW5zaW9uOnNyc0RpbWVuc2lvbn0gPSBwYXJhbXM7XG4gIHJldHVybiBgPGdtbDpMaW5lU3RyaW5nJHthdHRycyh7c3JzTmFtZSwgJ2dtbDppZCc6Z21sSWR9KX0+YCArXG4gICAgYDxnbWw6cG9zTGlzdCR7YXR0cnMoe3Nyc0RpbWVuc2lvbn0pfT5gICtcbiAgICBjb29yZHMubWFwKChlKT0+ZS5yZXZlcnNlKCkuam9pbignICcpKS5qb2luKCcgJykgKyBcbiAgICAnPC9nbWw6cG9zTGlzdD4nICtcbiAgICAnPC9nbWw6TGluZVN0cmluZz4nO1xufVxuLyoqXG4gKiBDb252ZXJ0cyBhbiBpbnB1dCBnZW9qc29uIExpbmVhclJpbmcgbWVtYmVyIG9mIGEgcG9seWdvbiBnZW9tZXRyeSB0byBnbWxcbiAqIEBmdW5jdGlvbiBcbiAqIEBwYXJhbSB7bnVtYmVyW11bXX0gY29vcmRzIHRoZSBjb29yZGluYXRlcyBtZW1iZXIgb2YgdGhlIGdlb2pzb24gZ2VvbWV0cnlcbiAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcn0gZ21sSWQgdGhlIGdtbDppZFxuICogQHBhcmFtIHtPYmplY3R9IHBhcmFtcyBvcHRpb25hbCBwYXJhbWV0ZXJzXG4gKiBAcGFyYW0ge3N0cmluZ3x1bmRlZmluZWR9IHBhcmFtcy5zcnNOYW1lIGFzIHN0cmluZyBzcGVjaWZ5aW5nIFNSU1xuICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfHVuZGVmaW5lZH0gcGFyYW1zLnNyc0RpbWVuc2lvbiB0aGUgZGltZW5zaW9uYWxpdHkgb2YgZWFjaCBjb29yZGluYXRlLCBpLmUuIDIgb3IgMy5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IGEgc3RyaW5nIGNvbnRhaW5pbmcgZ21sIHJlcHJlc2VudGluZyB0aGUgaW5wdXQgZ2VvbWV0cnlcbiAqL1xuZnVuY3Rpb24gTGluZWFyUmluZyhjb29yZHMsIGdtbElkLCBwYXJhbXM9e30pe1xuICBlbmZvcmNlR21sSWQoZ21sSWQpO1xuICB2YXIge3Nyc05hbWU6c3JzTmFtZSwgc3JzRGltZW5zaW9uOnNyc0RpbWVuc2lvbn0gPSBwYXJhbXM7XG4gIHJldHVybiBgPGdtbDpMaW5lYXJSaW5nJHthdHRycyh7J2dtbDppZCc6Z21sSWQsIHNyc05hbWV9KX0+YCArXG4gICAgYDxnbWw6cG9zTGlzdCR7YXR0cnMoe3Nyc0RpbWVuc2lvbn0pfT5gICtcbiAgICBjb29yZHMubWFwKChlKT0+ZS5yZXZlcnNlKCkuam9pbignICcpKS5qb2luKCcgJykgKyBcbiAgICAnPC9nbWw6cG9zTGlzdD4nICsgXG4gICAgJzwvZ21sOkxpbmVhclJpbmc+Jztcbn1cbi8qKlxuICogQ29udmVydHMgYW4gaW5wdXQgZ2VvanNvbiBQb2x5Z29uIGdlb21ldHJ5IHRvIGdtbFxuICogQGZ1bmN0aW9uIFxuICogQHBhcmFtIHtudW1iZXJbXVtdW119IGNvb3JkcyB0aGUgY29vcmRpbmF0ZXMgbWVtYmVyIG9mIHRoZSBnZW9qc29uIGdlb21ldHJ5XG4gKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ9IGdtbElkIHRoZSBnbWw6aWRcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbXMgb3B0aW9uYWwgcGFyYW1ldGVyc1xuICogQHBhcmFtIHtzdHJpbmd8dW5kZWZpbmVkfSBwYXJhbXMuc3JzTmFtZSBhcyBzdHJpbmcgc3BlY2lmeWluZyBTUlNcbiAqIEBwYXJhbSB7bnVtYmVyfHN0cmluZ3x1bmRlZmluZWR9IHBhcmFtcy5zcnNEaW1lbnNpb24gdGhlIGRpbWVuc2lvbmFsaXR5IG9mIGVhY2ggY29vcmRpbmF0ZSwgaS5lLiAyIG9yIDMuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBhIHN0cmluZyBjb250YWluaW5nIGdtbCByZXByZXNlbnRpbmcgdGhlIGlucHV0IGdlb21ldHJ5XG4gKi9cbmZ1bmN0aW9uIFBvbHlnb24oY29vcmRzLCBnbWxJZCwgcGFyYW1zPXt9KXtcbiAgZW5mb3JjZUdtbElkKGdtbElkKTtcbiAgLy8gZ2VvbS5jb29yZGluYXRlcyBhcmUgYXJyYXlzIG9mIExpbmVhclJpbmdzXG4gIHZhciB7c3JzTmFtZX0gPSBwYXJhbXM7XG4gIGxldCBwb2x5Z29uID0gYDxnbWw6UG9seWdvbiR7YXR0cnMoe3Nyc05hbWUsICdnbWw6aWQnOmdtbElkfSl9PmAgK1xuICAgICAgICAnPGdtbDpleHRlcmlvcj4nICtcbiAgICAgICAgTGluZWFyUmluZyhjb29yZHNbMF0pICtcbiAgICAgICAgJzwvZ21sOmV4dGVyaW9yPic7XG4gIGlmIChjb29yZHMubGVuZ3RoID49IDIpe1xuICAgIGZvciAobGV0IGxpbmVhclJpbmcgb2YgY29vcmRzLnNsaWNlKDEpKXtcbiAgICAgIHBvbHlnb24gKz0gJzxnbWw6aW50ZXJpb3I+JyArXG4gICAgICAgIExpbmVhclJpbmcobGluZWFyUmluZykgKyBcbiAgICAgICAgJzwvZ21sOmludGVyaW9yPic7XG4gICAgfVxuICB9XG4gIHBvbHlnb24gKz0gJzwvZ21sOlBvbHlnb24+JztcbiAgcmV0dXJuIHBvbHlnb247XG59XG4vKipcbiAqIENvbnZlcnRzIGFuIGlucHV0IGdlb2pzb24gTXVsdGlQb2ludCBnZW9tZXRyeSB0byBnbWxcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtudW1iZXJbXVtdfSBjb29yZHMgdGhlIGNvb3JkaW5hdGVzIG1lbWJlciBvZiB0aGUgZ2VvanNvbiBnZW9tZXRyeVxuICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfSBnbWxJZCB0aGUgZ21sOmlkXG4gKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIG9wdGlvbmFsIHBhcmFtZXRlcnNcbiAqIEBwYXJhbSB7c3RyaW5nfHVuZGVmaW5lZH0gcGFyYW1zLnNyc05hbWUgYXMgc3RyaW5nIHNwZWNpZnlpbmcgU1JTXG4gKiBAcGFyYW0ge251bWJlcnxzdHJpbmd8dW5kZWZpbmVkfSBwYXJhbXMuc3JzRGltZW5zaW9uIHRoZSBkaW1lbnNpb25hbGl0eSBvZiBlYWNoIGNvb3JkaW5hdGUsIGkuZS4gMiBvciAzLlxuICogQHJldHVybnMge3N0cmluZ30gYSBzdHJpbmcgY29udGFpbmluZyBnbWwgcmVwcmVzZW50aW5nIHRoZSBpbnB1dCBnZW9tZXRyeVxuICovXG5mdW5jdGlvbiBNdWx0aVBvaW50KGNvb3JkcywgZ21sSWQsIHBhcmFtcz17fSl7XG4gIGVuZm9yY2VHbWxJZChnbWxJZCk7XG4gIHJldHVybiBtdWx0aSgnTXVsdGlQb2ludCcsICdwb2ludE1lbWJlcicsIFBvaW50LCBjb29yZHMsIGdtbElkLCBwYXJhbXMpO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIGFuIGlucHV0IGdlb2pzb24gTXVsdGlMaW5lU3RyaW5nIGdlb21ldHJ5IHRvIGdtbFxuICogQGZ1bmN0aW9uIFxuICogQHBhcmFtIHtudW1iZXJbXVtdW119IGNvb3JkcyB0aGUgY29vcmRpbmF0ZXMgbWVtYmVyIG9mIHRoZSBnZW9qc29uIGdlb21ldHJ5XG4gKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ9IGdtbElkIHRoZSBnbWw6aWRcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbXMgb3B0aW9uYWwgcGFyYW1ldGVyc1xuICogQHBhcmFtIHtzdHJpbmd8dW5kZWZpbmVkfSBwYXJhbXMuc3JzTmFtZSBhcyBzdHJpbmcgc3BlY2lmeWluZyBTUlNcbiAqIEBwYXJhbSB7bnVtYmVyfHN0cmluZ3x1bmRlZmluZWR9IHBhcmFtcy5zcnNEaW1lbnNpb24gdGhlIGRpbWVuc2lvbmFsaXR5IG9mIGVhY2ggY29vcmRpbmF0ZSwgaS5lLiAyIG9yIDMuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBhIHN0cmluZyBjb250YWluaW5nIGdtbCByZXByZXNlbnRpbmcgdGhlIGlucHV0IGdlb21ldHJ5XG4gKi9cbmZ1bmN0aW9uIE11bHRpTGluZVN0cmluZyhjb29yZHMsIGdtbElkLCBwYXJhbXM9e30pe1xuICByZXR1cm4gbXVsdGkoJ011bHRpQ3VydmUnLCAnY3VydmVNZW1iZXInLCBMaW5lU3RyaW5nLCBjb29yZHMsIGdtbElkLCBwYXJhbXMpO1xufVxuLyoqXG4gKiBDb252ZXJ0cyBhbiBpbnB1dCBnZW9qc29uIE11bHRpUG9seWdvbiBnZW9tZXRyeSB0byBnbWxcbiAqIEBmdW5jdGlvbiBcbiAqIEBwYXJhbSB7bnVtYmVyW11bXVtdW119IGNvb3JkcyB0aGUgY29vcmRpbmF0ZXMgbWVtYmVyIG9mIHRoZSBnZW9qc29uIGdlb21ldHJ5XG4gKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ9IGdtbElkIHRoZSBnbWw6aWRcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbXMgb3B0aW9uYWwgcGFyYW1ldGVyc1xuICogQHBhcmFtIHtzdHJpbmd8dW5kZWZpbmVkfSBwYXJhbXMuc3JzTmFtZSBhcyBzdHJpbmcgc3BlY2lmeWluZyBTUlNcbiAqIEBwYXJhbSB7bnVtYmVyfHN0cmluZ3x1bmRlZmluZWR9IHBhcmFtcy5zcnNEaW1lbnNpb24gdGhlIGRpbWVuc2lvbmFsaXR5IG9mIGVhY2ggY29vcmRpbmF0ZSwgaS5lLiAyIG9yIDMuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBhIHN0cmluZyBjb250YWluaW5nIGdtbCByZXByZXNlbnRpbmcgdGhlIGlucHV0IGdlb21ldHJ5XG4gKi9cbmZ1bmN0aW9uIE11bHRpUG9seWdvbihjb29yZHMsIGdtbElkLCBwYXJhbXM9e30pe1xuICByZXR1cm4gbXVsdGkoJ011bHRpU3VyZmFjZScsICdzdXJmYWNlTWVtYmVyJywgUG9seWdvbiwgY29vcmRzLCBnbWxJZCwgcGFyYW1zKTtcbn1cbi8qKiBAY29uc3QgXG4gKiBAZGVzYyBhIG5hbWVzcGFjZSB0byBzd2l0Y2ggYmV0d2VlbiBnZW9qc29uLWhhbmRsaW5nIGZ1bmN0aW9ucyBieSBnZW9qc29uLnR5cGVcbiAqL1xuY29uc3QgY29udmVydGVyID0ge1xuICBQb2ludCwgTGluZVN0cmluZywgTGluZWFyUmluZywgUG9seWdvbiwgTXVsdGlQb2ludCwgTXVsdGlMaW5lU3RyaW5nLFxuICBNdWx0aVBvbHlnb24sIEdlb21ldHJ5Q29sbGVjdGlvblxufTtcbi8qKlxuICogQ29udmVydHMgYW4gaW5wdXQgZ2VvanNvbiBHZW9tZXRyeUNvbGxlY3Rpb24gZ2VvbWV0cnkgdG8gZ21sXG4gKiBAZnVuY3Rpb24gXG4gKiBAcGFyYW0ge09iamVjdFtdfSBjb29yZHMgdGhlIGNvb3JkaW5hdGVzIG1lbWJlciBvZiB0aGUgZ2VvanNvbiBnZW9tZXRyeVxuICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfSBnbWxJZCB0aGUgZ21sOmlkXG4gKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIG9wdGlvbmFsIHBhcmFtZXRlcnNcbiAqIEBwYXJhbSB7c3RyaW5nfHVuZGVmaW5lZH0gcGFyYW1zLnNyc05hbWUgYXMgc3RyaW5nIHNwZWNpZnlpbmcgU1JTXG4gKiBAcGFyYW0ge251bWJlcnxzdHJpbmd8dW5kZWZpbmVkfSBwYXJhbXMuc3JzRGltZW5zaW9uIHRoZSBkaW1lbnNpb25hbGl0eSBvZiBlYWNoIGNvb3JkaW5hdGUsIGkuZS4gMiBvciAzLlxuICogQHJldHVybnMge3N0cmluZ30gYSBzdHJpbmcgY29udGFpbmluZyBnbWwgcmVwcmVzZW50aW5nIHRoZSBpbnB1dCBnZW9tZXRyeVxuICovXG5mdW5jdGlvbiBHZW9tZXRyeUNvbGxlY3Rpb24oZ2VvbXMsIGdtbElkLCBwYXJhbXM9e30pe1xuICByZXR1cm4gbXVsdGkoJ011bHRpR2VvbWV0cnknLCAnZ2VvbWV0cnlNZW1iZXInLCBjb252ZXJ0ZXIsXG4gICAgICAgICAgICAgICBnZW9tcywgZ21sSWQsIHBhcmFtcyk7XG59XG5cbi8qKlxuICogVHJhbnNsYXRlcyBhbnkgZ2VvanNvbiBnZW9tZXRyeSBpbnRvIEdNTCAzLjIuMVxuICogQHB1YmxpYyBcbiAqIEBmdW5jdGlvbiBcbiAqIEBwYXJhbSB7T2JqZWN0fSBnZW9tIGEgZ2VvanNvbiBnZW9tZXRyeSBvYmplY3RcbiAqIEBwYXJhbSB7QXJyYXl8dW5kZWZpbmVkfSBnZW9tLmNvb3JkaW5hdGVzIHRoZSBuZXN0ZWQgYXJyYXkgb2YgY29vcmRpbmF0ZXMgZm9ybWluZyB0aGUgZ2VvbWV0cnlcbiAqIEBwYXJhbSB7T2JqZWN0W118dW5kZWZpbmVkfSBnZW9tLmdlb21ldHJpZXMgZm9yIGEgR2VvbWV0cnlDb2xsZWN0aW9uIG9ubHksIHRoZSBhcnJheSBvZiBtZW1iZXIgZ2VvbWV0cnkgb2JqZWN0c1xuICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfSBnbWxJZCB0aGUgZ21sOmlkIG9mIHRoZSBnZW9tZXRyeVxuICogQHBhcmFtIHtvYmplY3R9IHBhcmFtcyBvcHRpb25hbCBwYXJhbWV0ZXJzXG4gKiBAcGFyYW0ge3N0cmluZ3x1bmRlZmluZWR9IHBhcmFtcy5zcnNOYW1lIGEgc3RyaW5nIHNwZWNpZnlpbmcgdGhlIFNSU1xuICogQHBhcmFtIHtzdHJpbmd8dW5kZWZpbmVkfSBwYXJhbXMuc3JzRGltZW5zaW9uIHRoZSBkaW1lbnNpb25hbGl0eSBvZiBlYWNoIGNvb3JkaW5hdGUsIGkuZS4gMiBvciAzLlxuICogQHBhcmFtIHtudW1iZXJbXXxzdHJpbmdbXXx1bmRlZmluZWR9IGdtbElkcyAgYW4gYXJyYXkgb2YgbnVtYmVyL3N0cmluZyBnbWw6aWRzIG9mIHRoZSBtZW1iZXIgZ2VvbWV0cmllcyBvZiBhIG11bHRpZ2VvbWV0cnkuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBhIHZhbGlkIGdtbCBzdHJpbmcgZGVzY3JpYmluZyB0aGUgaW5wdXQgZ2VvanNvbiBnZW9tZXRyeVxuICovXG5mdW5jdGlvbiBnZW9tVG9HbWwoZ2VvbSwgZ21sSWQsIHBhcmFtcyl7XG4gIHJldHVybiBjb252ZXJ0ZXJbZ2VvbS50eXBlXShcbiAgICBnZW9tLmNvb3JkaW5hdGVzIHx8IGdlb20uZ2VvbWV0cmllcyxcbiAgICBnbWxJZCxcbiAgICBwYXJhbXNcbiAgKTtcbn1cbmV4cG9ydCB7XG4gIGdlb21Ub0dtbCwgY29udmVydGVyLCBQb2ludCwgTGluZVN0cmluZywgTGluZWFyUmluZyxcbiAgUG9seWdvbiwgTXVsdGlQb2ludCwgTXVsdGlMaW5lU3RyaW5nLCBNdWx0aVBvbHlnb25cbn07XG4iLCJpbXBvcnQge2dlb21Ub0dtbCBhcyBnbWwzfSBmcm9tICdnZW9qc29uLXRvLWdtbC0zJztcblxuLyoqIEBjb25zdCB7T2JqZWN0fSB4bWwgKi9cbmNvbnN0IHhtbCA9IHtcbiAgLyoqXG4gICAqIFR1cm5zIGFuIG9iamVjdCBpbnRvIGEgc3RyaW5nIG9mIHhtbCBhdHRyaWJ1dGUga2V5LXZhbHVlIHBhaXJzLlxuICAgKiBAbWVtYmVyT2YgeG1sLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtIHtPYmplY3R9IGF0dHJzIGFuIG9iamVjdCBtYXBwaW5nIGF0dHJpYnV0ZSBuYW1lcyB0byBhdHRyaWJ1dGUgdmFsdWVzXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9IGEgc3RyaW5nIG9mIHhtbCBhdHRyaWJ1dGUga2V5LXZhbHVlIHBhaXJzXG4gICAqL1xuICAnYXR0cnMnOiBmdW5jdGlvbihhdHRycyl7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKGF0dHJzKVxuICAgICAgLm1hcCgoYSkgPT4gYXR0cnNbYV0gPyBgICR7YX09XCIke2F0dHJzW2FdfVwiYCA6ICcnKVxuICAgICAgLmpvaW4oJycpO1xuICB9LFxuICAvKipcbiAgICogQ3JlYXRlcyBhIHN0cmluZyB4bWwgdGFnLlxuICAgKiBAZnVuY3Rpb24gXG4gICAqIEBtZW1iZXJPZiB4bWwuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBucyB0aGUgdGFnJ3MgeG1sIG5hbWVzcGFjZSBhYmJyZXZpYXRpb24uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0YWdOYW1lIHRoZSB0YWcgbmFtZS5cbiAgICogQHBhcmFtIHtPYmplY3R9IGF0dHJzIEBzZWUgeG1sLmF0dHJzLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gaW5uZXIgaW5uZXIgeG1sLlxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSBhbiB4bWwgc3RyaW5nLlxuICAgKi9cbiAgJ3RhZyc6IGZ1bmN0aW9uKG5zLCB0YWdOYW1lLCBhdHRycywgaW5uZXIpeyAvLyBUT0RPOiBzZWxmLWNsb3NpbmdcbiAgICBsZXQgdGFnID0gKG5zID8gYCR7bnN9OmAgOiAnJykgKyB0YWdOYW1lO1xuICAgIGlmICh0YWdOYW1lKXtcbiAgICAgIHJldHVybiBgPCR7dGFnfSR7dGhpcy5hdHRycyhhdHRycyl9PiR7aW5uZXJ9PC8ke3RhZ30+YDsgICBcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdubyB0YWcgc3VwcGxpZWQgJyArIEpTT04uc3RyaW5naWZ5KGFyZ3VtZW50cykpO1xuICAgIH1cbiAgfVxufTtcbi8qKlxuICogU2hvcnRoYW5kIGZvciBjcmVhdGluZyBhIHdmcyB4bWwgdGFnLlxuICogQHBhcmFtIHtzdHJpbmd9IHRhZ05hbWUgYSB2YWxpZCB3ZnMgdGFnIG5hbWUuXG4gKiBAcGFyYW0ge09iamVjdH0gYXR0cnMgQHNlZSB4bWwuYXR0cnMuXG4gKiBAcGFyYW0ge3N0cmluZ30gaW5uZXIgQHNlZSB4bWwudGFnLlxuICovXG5jb25zdCB3ZnMgPSAodGFnTmFtZSwgYXR0cnMsIGlubmVyKSA9PiB4bWwudGFnKCd3ZnMnLCB0YWdOYW1lLCBhdHRycywgaW5uZXIpO1xuLyoqXG4gKiBFbnN1cmVzIHRoZSByZXN1bHQgaXMgYW4gYXJyYXkuXG4gKiBAcGFyYW0ge0FycmF5fE9iamVjdH0gbWF5YmUgYSBHZW9KU09OIEZlYXR1cmUgb3IgRmVhdHVyZUNvbGxlY3Rpb24gb2JqZWN0IG9yIGFuIGFycmF5IHRoZXJlb2YuXG4gKi9cbmNvbnN0IGVuc3VyZUFycmF5ID0gKC4uLm1heWJlKT0+IChtYXliZVswXS5mZWF0dXJlcyB8fCBbXS5jb25jYXQoLi4ubWF5YmUpKVxuXHQuZmlsdGVyKChmKSA9PiBmKTtcbi8qKlxuICogRW5zdXJlcyBhIGxheWVyLmlkIGZvcm1hdCBvZiBhbiBpbnB1dCBpZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBseXIgbGF5ZXIgbmFtZVxuICogQHBhcmFtIHtzdHJpbmd9IGlkIGlkLCBwb3NzaWJseSBhbHJlYWR5IGluIGNvcnJlY3QgbGF5ZXIuaWQgZm9ybWF0LlxuICogQHJldHVybnMge3N0cmluZ30gYSBjb3JyZWN0bHktZm9ybWF0dGVkIGdtbDppZFxuICovXG5jb25zdCBlbnN1cmVJZCA9IChseXIsIGlkKSA9PiAvXFwuLy5leGVjKGlkIHx8ICcnKSA/IGlkIDpgJHtseXJ9LiR7aWR9YDtcbi8qKlxuICogcmV0dXJucyBhIGNvcnJlY3RseS1mb3JtYXR0ZWQgdHlwZU5hbWVcbiAqIEBwYXJhbSB7c3RyaW5nfSBucyBuYW1lc3BhY2VcbiAqIEBwYXJhbSB7c3RyaW5nfSBsYXllciBsYXllciBuYW1lXG4gKiBAcGFyYW0ge3N0cmluZ30gdHlwZU5hbWUgdHlwZU5hbWUgdG8gY2hlY2tcbiAqIEByZXR1cm5zIHtzdHJpbmd9IGEgY29ycmVjdGx5LWZvcm1hdHRlZCB0eXBlTmFtZVxuICogQHRocm93cyB7RXJyb3J9IGlmIHR5cGVOYW1lIGl0IGNhbm5vdCBmb3JtIGEgdHlwZU5hbWUgZnJvbSBucyBhbmQgbGF5ZXJcbiAqL1xuY29uc3QgZW5zdXJlVHlwZU5hbWUgPSAobnMsIGxheWVyLCB0eXBlTmFtZSkgPT57XG4gIGlmICghdHlwZU5hbWUgJiYgIShucyAmJiBsYXllcikpe1xuICAgIHRocm93IG5ldyBFcnJvcihgbm8gdHlwZW5hbWUgcG9zc2libGU6ICR7SlNPTi5zdHJpbmdpZnkoe3R5cGVOYW1lLCBucywgbGF5ZXJ9KX1gKTtcbiAgfVxuICByZXR1cm4gdHlwZU5hbWUgfHwgYCR7bnN9OiR7bGF5ZXJ9VHlwZWA7XG59O1xuXG4vKipcbiAqIFN0YW5kcyBpbiBmb3Igb3RoZXIgZnVuY3Rpb25zIGluIHN3aWNoIHN0YXRlbWVudHMsIGV0Yy4gRG9lcyBub3RoaW5nLlxuICogQGZ1bmN0aW9uIFxuICovXG5jb25zdCBwYXNzID0gKCkgPT4gJyc7XG5cbi8qKlxuICogSXRlcmF0ZXMgb3ZlciB0aGUga2V5LXZhbHVlIHBhaXJzLCBmaWx0ZXJpbmcgYnkgYSB3aGl0ZWxpc3QgaWYgYXZhaWxhYmxlLlxuICogQHBhcmFtIHtBcnJheTxzdHJpbmc+fSB3aGl0ZWxpc3QgYSB3aGl0ZWxpc3Qgb2YgcHJvcGVydHkgbmFtZXNcbiAqIEBwYXJhbSB7T2JqZWN0fSBwcm9wZXJ0aWVzIGFuIG9iamVjdCBtYXBwaW5nIHByb3BlcnR5IG5hbWVzIHRvIHZhbHVlc1xuICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgYSBmdW5jdGlvbiB0byBjYWxsIG9uIGVhY2ggKHdoaXRlbGlzdGVkIGtleSwgdmFsdWUpIHBhaXJcbiAqL1xuY29uc3QgdXNlV2hpdGVsaXN0SWZBdmFpbGFibGUgPSAod2hpdGVsaXN0LCBwcm9wZXJ0aWVzLCBjYikgPT57XG4gIGZvciAobGV0IHByb3Agb2Ygd2hpdGVsaXN0IHx8IE9iamVjdC5rZXlzKHByb3BlcnRpZXMpKXtcbiAgICBwcm9wZXJ0aWVzW3Byb3BdID8gY2IocHJvcCwgcHJvcGVydGllc1twcm9wXSkgOiBwYXNzKCk7XG4gIH1cbn07XG4vKipcbiAqIENyZWF0ZXMgYSBmZXM6UmVzb3VyY2VJZCBmaWx0ZXIgZnJvbSBhIGxheWVybmFtZSBhbmQgaWRcbiAqIEBwYXJhbSB7c3RyaW5nfSBseXIgbGF5ZXIgbmFtZSBvZiB0aGUgZmlsdGVyZWQgZmVhdHVyZVxuICogQHBhcmFtIHtzdHJpbmd9IGlkIGZlYXR1cmUgaWRcbiAqL1xuY29uc3QgaWRGaWx0ZXIgPSAobHlyLCBpZCkgPT4gYDxmZXM6UmVzb3VyY2VJZCByaWQ9XCIke2Vuc3VyZUlkKGx5ciwgaWQpfVwiLz5gO1xuXG5jb25zdCB1bnBhY2sgPSAoKCk9PntcbiAgbGV0IGZlYXR1cmVNZW1iZXJzID0gbmV3IFNldChbJ3Byb3BlcnRpZXMnLCAnZ2VvbWV0cnknLCAnaWQnLCAnbGF5ZXInXSk7XG4gIC8qKlxuICAgKiBSZXNvbHZlcyBhdHRyaWJ1dGVzIGZyb20gZmVhdHVyZSwgdGhlbiBwYXJhbXMgdW5sZXNzIHRoZXkgYXJlIG5vcm1hbGx5XG4gICAqIGZvdW5kIGluIHRoZSBmZWF0dXJlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBmZWF0dXJlIGEgZ2VvanNvbiBmZWF0dXJlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbXMgYW4gb2JqZWN0IG9mIGJhY2t1cCAvIG92ZXJyaWRlIHBhcmFtZXRlcnNcbiAgICogQHBhcmFtIHtBcnJheTxzdHJpbmc+fSBhcmdzIHBhcmFtZXRlciBuYW1lcyB0byByZXNvbHZlIGZyb20gZmVhdHVyZSBvciBwYXJhbXNcbiAgICogQHJldHVybnMge09iamVjdH0gYW4gb2JqZWN0IG1hcHBpbmcgZWFjaCBuYW1lZCBwYXJhbWV0ZXIgdG8gaXRzIHJlc29sdmVkIHZhbHVlXG4gICAqL1xuICByZXR1cm4gKGZlYXR1cmUsIHBhcmFtcywgLi4uYXJncykgPT4ge1xuICAgIGxldCByZXN1bHRzID0ge307XG4gICAgZm9yIChsZXQgYXJnIG9mIGFyZ3Mpe1xuICAgICAgaWYgKGFyZyA9PT0gJ2xheWVyJyl7XG5cdHJlc3VsdHNbYXJnXSA9IChwYXJhbXMubGF5ZXIgfHwge30pLmlkIHx8IHBhcmFtcy5sYXllclxuXHQgIHx8IChmZWF0dXJlLmxheWVyfHx7fSkuaWQgfHwgZmVhdHVyZS5sYXllciB8fCAnJztcbiAgICAgIH0gZWxzZSBpZiAoIWZlYXR1cmVNZW1iZXJzLmhhcyhhcmcpKXtcbiAgICAgICAgcmVzdWx0c1thcmddID0gZmVhdHVyZVthcmddIHx8IHBhcmFtc1thcmddIHx8ICcnO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0c1thcmddID0gcGFyYW1zW2FyZ10gfHwgZmVhdHVyZVthcmddICB8fCAnJztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG59KSgpO1xuXG4vKipcbiAqIEJ1aWxkcyBhIGZpbHRlciBmcm9tIGZlYXR1cmUgaWRzIGlmIG9uZSBpcyBub3QgYWxyZWFkeSBpbnB1dC5cbiAqIEBmdW5jdGlvbiBcbiAqIEBwYXJhbSB7c3RyaW5nfHVuZGVmaW5lZH0gZmlsdGVyIGEgcG9zc2libGUgc3RyaW5nIGZpbHRlclxuICogQHBhcmFtIHtBcnJheTxPYmplY3Q+fSBmZWF0dXJlcyBhbiBhcnJheSBvZiBnZW9qc29uIGZlYXR1cmUgb2JqZWN0c1xuICogQHBhcmFtIHtPYmplY3R9IHBhcmFtcyBhbiBvYmplY3Qgb2YgYmFja3VwIC8gb3ZlcnJpZGUgcGFyYW1ldGVyc1xuICogQHJldHVybnMge3N0cmluZ30gQSBmaWx0ZXIsIG9yIHRoZSBpbnB1dCBmaWx0ZXIgaWYgaXQgd2FzIGEgc3RyaW5nLlxuICovXG5mdW5jdGlvbiBlbnN1cmVGaWx0ZXIoZmlsdGVyLCBmZWF0dXJlcywgcGFyYW1zKXtcbiAgaWYgKCFmaWx0ZXIpe1xuICAgIGZpbHRlciA9ICcnO1xuICAgIGZvciAobGV0IGZlYXR1cmUgb2YgZmVhdHVyZXMpe1xuICAgICAgbGV0IGxheWVyID0gdW5wYWNrKGZlYXR1cmUsIHBhcmFtcyk7XG4gICAgICBmaWx0ZXIgKz0gaWRGaWx0ZXIobGF5ZXIsIGZlYXR1cmUuaWQpO1xuICAgIH1cbiAgICByZXR1cm4gYDxmZXM6RmlsdGVyPiR7ZmlsdGVyfTwvZmVzOkZpbHRlcj5gO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBmaWx0ZXI7XG4gIH1cbn07XG4vL2h0dHA6Ly9kb2NzLm9wZW5nZW9zcGF0aWFsLm9yZy9pcy8wOS0wMjVyMi8wOS0wMjVyMi5odG1sIzI4NlxuLyoqXG4gKiBDaGVja3MgdGhlIHR5cGUgb2YgdGhlIGlucHV0IGFjdGlvblxuICogQGZ1bmN0aW9uIFxuICogQHBhcmFtIHtzdHJpbmcgfCB1bmRlZmluZWR9IGFjdGlvbiBcbiAqIEByZXR1cm5zIHtCb29sZWFufSB3aGV0aGVyIHRoZSBhY3Rpb24gaXMgYWxsb3dlZFxuKi9cbmNvbnN0IGVuc3VyZUFjdGlvbiA9ICgoKT0+e1xuICBjb25zdCBhbGxvd2VkID0gbmV3IFNldChbJ3JlcGxhY2UnLCAnaW5zZXJ0QmVmb3JlJywgJ2luc2VydEFmdGVyJywgJ3JlbW92ZSddKTtcbiAgcmV0dXJuIChhY3Rpb24pID0+IGFsbG93ZWQuaGFzKGFjdGlvbik7XG59KSgpO1xuXG4vKipcbiAqIEFuIG9iamVjdCBjb250YWluaW5nIG9wdGlvbmFsIG5hbWVkIHBhcmFtZXRlcnMuXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBQYXJhbXNcbiAqIEBwcm9wIHtzdHJpbmd8dW5kZWZpbmVkfSBucyBhbiB4bWwgbmFtZXNwYWNlIGFsaWFzLlxuICogQHByb3Age3N0cmluZ3xPYmplY3R8dW5kZWZpbmVkfSBsYXllciBhIHN0cmluZyBsYXllciBuYW1lIG9yIHtpZH0sIHdoZXJlIGlkXG4gKiBpcyB0aGUgbGF5ZXIgbmFtZVxuICogQHByb3Age3N0cmluZ3x1bmRlZmluZWR9IGdlb21ldHJ5X25hbWUgdGhlIG5hbWUgb2YgdGhlIGZlYXR1cmUgZ2VvbWV0cnkgZmllbGQuXG4gKiBAcHJvcCB7T2JqZWN0fHVuZGVmaW5lZH0gcHJvcGVydGllcyBhbiBvYmplY3QgbWFwcGluZyBmZWF0dXJlIGZpZWxkIG5hbWVzIHRvIGZlYXR1cmUgcHJvcGVydGllc1xuICogQHByb3Age3N0cmluZ3x1bmRlZmluZWR9IGlkIGEgc3RyaW5nIGZlYXR1cmUgaWQuXG4gKiBAcHJvcCB7c3RyaW5nW118dW5kZWZpbmVkfSB3aGl0ZWxpc3QgYW4gYXJyYXkgb2Ygc3RyaW5nIGZpZWxkIG5hbWVzIHRvIFxuICogdXNlIGZyb20gQHNlZSBQYXJhbXMucHJvcGVydGllc1xuICogQHByb3Age3N0cmluZ3x1bmRlZmluZWR9IGlucHV0Rm9ybWF0IGlucHV0Rm9ybWF0LCBhcyBzcGVjaWZpZWQgYXQgXG4gKiBbT0dDIDA5LTAyNXIyIMKnIDcuNi41LjRde0BsaW5rIGh0dHA6Ly9kb2NzLm9wZW5nZW9zcGF0aWFsLm9yZy9pcy8wOS0wMjVyMi8wOS0wMjVyMi5odG1sIzY1fS5cbiAqIEBwcm9wIHtzdHJpbmd8dW5kZWZpbmVkfSBzcnNOYW1lIHNyc05hbWUsIGFzIHNwZWNpZmllZCBhdCBcbiAqIFtPR0MgMDktMDI1cjIgwqcgNy42LjUuNV17QGxpbmsgaHR0cDovL2RvY3Mub3Blbmdlb3NwYXRpYWwub3JnL2lzLzA5LTAyNXIyLzA5LTAyNXIyLmh0bWwjNjZ9LlxuICogaWYgdW5kZWZpbmVkLCB0aGUgZ21sMyBtb2R1bGUgd2lsbCBkZWZhdWx0IHRvICdFUFNHOjQzMjYnLlxuICogQHByb3Age3N0cmluZ3x1bmRlZmluZWR9IGhhbmRsZSBoYW5kbGUgcGFyYW1ldGVyLCBhcyBzcGVjaWZpZWQgYXRcbiAqIFtPR0MgMDktMDI1cjIgwqcgNy42LjIuNiBde0BsaW5rIGh0dHA6Ly9kb2NzLm9wZW5nZW9zcGF0aWFsLm9yZy9pcy8wOS0wMjVyMi8wOS0wMjVyMi5odG1sIzQ0fVxuICogQHByb3Age3N0cmluZ3x1bmRlZmluZWR9IGZpbHRlciBhIHN0cmluZyBmZXM6RmlsdGVyLlxuICogQHByb3Age3N0cmluZ3x1bmRlZmluZWR9IHR5cGVOYW1lIGEgc3RyaW5nIHNwZWNpZnlpbmcgdGhlIGZlYXR1cmUgdHlwZSB3aXRoaW5cbiAqIGl0cyBuYW1lc3BhY2UuIFNlZSBbMDktMDI1cjIgwqcgNy45LjIuNC4xXXtAbGluayBodHRwOi8vZG9jcy5vcGVuZ2Vvc3BhdGlhbC5vcmcvaXMvMDktMDI1cjIvMDktMDI1cjIuaHRtbCM5MH0uXG4gKiBAcHJvcCB7T2JqZWN0fHVuZGVmaW5lZH0gc2NoZW1hTG9jYXRpb25zIGFuIG9iamVjdCBtYXBwaW5nIHVyaSB0byBzY2hlbWFsb2NhdGlvblxuICogQHByb3Age09iamVjdHx1bmRlZmluZWR9IG5zQXNzaWdubWVudHMgYW4gb2JqZWN0IG1hcHBpbmcgbnMgdG8gdXJpXG4gKi9cblxuLyoqXG4gKiBBIEdlb0pTT04gZmVhdHVyZSB3aXRoIHRoZSBmb2xsb3dpbmcgb3B0aW9uYWwgZm9yZWlnbiBtZW1iZXJzIChzZWUgXG4gKiBbcmZjNzk2NSDCpyA2XXtAbGluayBodHRwczovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjNzk0NiNzZWN0aW9uLTZ9KS5cbiAqIG9yIGFuIG9iamVjdCB3aXRoIHNvbWUgb2YgdGhlIGZvbGxvd2luZyBtZW1iZXJzLlxuICogTWVtYmVycyBvZiBGZWF0dXJlIHdpbGwgYmUgdXNlZCBvdmVyIHRob3NlIGluIFBhcmFtcyBleGNlcHQgZm9yIGxheWVyLCBpZCxcbiAqIGFuZCBwcm9wZXJ0aWVzLlxuICogQHR5cGVkZWYge09iamVjdH0gRmVhdHVyZVxuICogQGV4dGVuZHMgUGFyYW1zXG4gKiBAcHJvcGVydHkge09iamVjdHx1bmRlZmluZWR9IGdlb21ldHJ5IGEgR2VvSlNPTiBnZW9tZXRyeS5cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfHVuZGVmaW5lZH0gdHlwZSAnRmVhdHVyZScuXG4gKiBAZXhhbXBsZSBcbiAqIHsnaWQnOid0YXNtYW5pYV9yb2Fkcy4xJywgJ3R5cGVOYW1lJzondG9wcDp0YXNtYW5pYV9yb2Fkc1R5cGUnfSBcbiAqIC8vIGNhbiBiZSBwYXNzZWQgdG8gRGVsZXRlXG4gKi9cblxuLyoqXG4gKiBhIEdlb0pTT04gRmVhdHVyZUNvbGxlY3Rpb24gd2l0aCBvcHRpb25hbCBmb3JlaWduIG1lbWJlcnMgYXMgaW4gRmVhdHVyZS5cbiAqIEB0eXBlZGVmIHtPYmplY3R9IEZlYXR1cmVDb2xsZWN0aW9uXG4gKiBAZXh0ZW5kcyBGZWF0dXJlXG4gKiBAcHJvcGVydHkge3N0cmluZ30gdHlwZSAnRmVhdHVyZUNvbGxlY3Rpb24nLlxuICogQHByb3BlcnR5IHtGZWF0dXJlW119IGZlYXR1cmVzIGFuIGFycmF5IG9mIEdlb0pTT04gRmVhdHVyZXMuXG4gKi9cblxuLyoqXG4gKiBUdXJucyBhbiBhcnJheSBvZiBnZW9qc29uIGZlYXR1cmVzIGludG8gZ21sOl9mZWF0dXJlIHN0cmluZ3MgZGVzY3JpYmluZyB0aGVtLlxuICogQGZ1bmN0aW9uIFxuICogQHBhcmFtIHtGZWF0dXJlW119IGZlYXR1cmVzIGFuIGFycmF5IG9mIGZlYXR1cmVzIHRvIHRyYW5zbGF0ZSB0byBcbiAqIGdtbDpfZmVhdHVyZXMuXG4gKiBAcGFyYW0ge1BhcmFtc30gcGFyYW1zIGFuIG9iamVjdCBvZiBiYWNrdXAgLyBvdmVycmlkZSBwYXJhbWV0ZXJzIFxuICogQHJldHVybnMge3N0cmluZ30gYSBnbWw6X2ZlYXR1cmUgc3RyaW5nLlxuICovXG5mdW5jdGlvbiB0cmFuc2xhdGVGZWF0dXJlcyhmZWF0dXJlcywgcGFyYW1zPXt9KXtcbiAgbGV0IGlubmVyID0gJyc7XG4gIGxldCB7c3JzTmFtZX0gPSBwYXJhbXM7XG4gIGZvciAobGV0IGZlYXR1cmUgb2YgZmVhdHVyZXMpe1xuICAgIC8vVE9ETzogYWRkIHdoaXRlbGlzdCBzdXBwb3J0XG4gICAgbGV0IHtucywgbGF5ZXIsIGdlb21ldHJ5X25hbWUsIHByb3BlcnRpZXMsIGlkLCB3aGl0ZWxpc3R9ID0gdW5wYWNrKFxuICAgICAgZmVhdHVyZSwgcGFyYW1zLCAnbnMnLCAnbGF5ZXInLCAnZ2VvbWV0cnlfbmFtZScsICdwcm9wZXJ0aWVzJywgJ2lkJywgJ3doaXRlbGlzdCdcbiAgICApO1xuICAgIGxldCBmaWVsZHMgPSAnJztcbiAgICBpZiAoZ2VvbWV0cnlfbmFtZSl7XG4gICAgICBmaWVsZHMgKz0geG1sLnRhZyhcblx0bnMsIGdlb21ldHJ5X25hbWUsIHt9LCBnbWwzKGZlYXR1cmUuZ2VvbWV0cnksICcnLCB7c3JzTmFtZX0pXG4gICAgICApO1xuICAgIH1cbiAgICB1c2VXaGl0ZWxpc3RJZkF2YWlsYWJsZShcbiAgICAgIHdoaXRlbGlzdCwgcHJvcGVydGllcyxcbiAgICAgIChwcm9wLCB2YWwpPT5maWVsZHMgKz0geG1sLnRhZyhucywgcHJvcCwge30sIHByb3BlcnRpZXNbcHJvcF0pXG4gICAgKTtcbiAgICBpbm5lciArPSB4bWwudGFnKG5zLCBsYXllciwgeydnbWw6aWQnOiBlbnN1cmVJZChsYXllciwgaWQpfSwgZmllbGRzKTtcbiAgfVxuICByZXR1cm4gaW5uZXI7XG59XG5cbi8qKlxuICogUmV0dXJucyBhIHdmczpJbnNlcnQgdGFnIHdyYXBwaW5nIGEgdHJhbnNsYXRlZCBmZWF0dXJlXG4gKiBAZnVuY3Rpb24gXG4gKiBAcGFyYW0ge0ZlYXR1cmVbXXxGZWF0dXJlQ29sbGVjdGlvbnxGZWF0dXJlfSBmZWF0dXJlcyBGZWF0dXJlKHMpIHRvIHBhc3MgdG8gQHNlZSB0cmFuc2xhdGVGZWF0dXJlc1xuICogQHBhcmFtIHtQYXJhbXN9IHBhcmFtcyB0byBiZSBwYXNzZWQgdG8gQHNlZSB0cmFuc2xhdGVGZWF0dXJlcywgd2l0aCBvcHRpb25hbFxuICogaW5wdXRGb3JtYXQsIHNyc05hbWUsIGhhbmRsZSBmb3IgdGhlIHdmczpJbnNlcnQgdGFnLlxuICogQHJldHVybnMge3N0cmluZ30gYSB3ZnM6SW5zZXJ0IHN0cmluZy5cbiAqL1xuZnVuY3Rpb24gSW5zZXJ0KGZlYXR1cmVzLCBwYXJhbXM9e30pe1xuICBmZWF0dXJlcyA9IGVuc3VyZUFycmF5KGZlYXR1cmVzKTtcbiAgbGV0IHtpbnB1dEZvcm1hdCwgc3JzTmFtZSwgaGFuZGxlfSA9IHBhcmFtcztcbiAgaWYgKCFmZWF0dXJlcy5sZW5ndGgpe1xuICAgIGNvbnNvbGUud2Fybignbm8gZmVhdHVyZXMgc3VwcGxpZWQnKTtcbiAgICByZXR1cm4gJyc7XG4gIH1cbiAgbGV0IHRvSW5zZXJ0ID0gdHJhbnNsYXRlRmVhdHVyZXMoZmVhdHVyZXMsIHBhcmFtcyk7XG4gIHJldHVybiB4bWwudGFnKCd3ZnMnLCAnSW5zZXJ0Jywge2lucHV0Rm9ybWF0LCBzcnNOYW1lLCBoYW5kbGV9LCB0b0luc2VydCk7XG59XG5cbi8qKlxuICogVXBkYXRlcyB0aGUgaW5wdXQgZmVhdHVyZXMgaW4gYnVsayB3aXRoIHBhcmFtcy5wcm9wZXJ0aWVzIG9yIGJ5IGlkLlxuICogQHBhcmFtIHtGZWF0dXJlW118RmVhdHVyZUNvbGxlY3Rpb259IGZlYXR1cmVzIGZlYXR1cmVzIHRvIHVwZGF0ZS4gIFRoZXNlIG1heSBcbiAqIHBhc3MgaW4gZ2VvbWV0cnlfbmFtZSwgcHJvcGVydGllcywgYW5kIGxheWVyIChvdmVycnVsZWQgYnkgcGFyYW1zKSBhbmQgXG4gKiBucywgbGF5ZXIsIHNyc05hbWUgKG92ZXJydWxpbmcgcGFyYW1zKS5cbiAqIEBwYXJhbSB7UGFyYW1zfSBwYXJhbXMgd2l0aCBvcHRpb25hbCBwcm9wZXJ0aWVzLCBucywgbGF5ZXIsIGdlb21ldHJ5X25hbWUsXG4gKiBmaWx0ZXIsIHR5cGVOYW1lLCB3aGl0ZWxpc3QuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBhIHN0cmluZyB3ZnM6VXBhdGUgYWN0aW9uLlxuICovXG5mdW5jdGlvbiBVcGRhdGUoZmVhdHVyZXMsIHBhcmFtcz17fSl7XG4gIGZlYXR1cmVzID0gZW5zdXJlQXJyYXkoZmVhdHVyZXMpO1xuICAvKipcbiAgICogbWFrZXMgYSB3ZnM6UHJvcGVydHkgc3RyaW5nIGNvbnRhaW5nIGEgd2ZzOlZhbHVlUmVmZXJlbmNlLCB3ZnM6VmFsdWUgcGFpci5cbiAgICogQGZ1bmN0aW9uIFxuICAgKiBAbWVtYmVyb2YgVXBkYXRlflxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHJvcCB0aGUgZmllbGQvcHJvcGVydHkgbmFtZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsIHRoZSBmaWVsZC9wcm9wZXJ0eSB2YWx1ZSBcbiAgICogQHBhcmFtIHtzdHJpbmd9IGFjdGlvbiBvbmUgb2YgJ2luc2VydEJlZm9yZScsICdpbnNlcnRBZnRlcicsICdyZW1vdmUnLFxuICAgKiAncmVwbGFjZScuIFNlZSBbT0dDIDA5LTAyNXIyIMKnIDE1LjIuNS4yLjFde0BsaW5rIGh0dHA6Ly9kb2NzLm9wZW5nZW9zcGF0aWFsLm9yZy9pcy8wOS0wMjVyMi8wOS0wMjVyMi5odG1sIzI4Nn0uXG4gICAqIGBhY3Rpb25gIHdvdWxkIGRlbGV0ZSBvciBtb2RpZnkgdGhlIG9yZGVyIG9mIGZpZWxkcyB3aXRoaW4gdGhlIHJlbW90ZVxuICAgKiBmZWF0dXJlLiBUaGVyZSBpcyBjdXJyZW50bHkgbm8gd2F5IHRvIGlucHV0IGBhY3Rpb24sYCBzaW5jZSB3ZnM6VXBkYXRlJ3NcbiAgICogZGVmYXVsdCBhY3Rpb24sICdyZXBsYWNlJywgaXMgc3VmZmljaWVudC5cbiAgICovXG4gIGNvbnN0IG1ha2VLdnAgPSAocHJvcCwgdmFsLCBhY3Rpb24pID0+IHdmcyhcbiAgICAnUHJvcGVydHknLCB7fSxcbiAgICB3ZnMoJ1ZhbHVlUmVmZXJlbmNlJywge2FjdGlvbn0sIHByb3ApICtcbiAgICAgICh2YWwgPT0gdW5kZWZpbmVkID8gd2ZzKCdWYWx1ZScsIHt9LCB2YWwpOiAnJylcbiAgKTtcbiAgaWYgKHBhcmFtcy5wcm9wZXJ0aWVzKXtcbiAgICBsZXQge2hhbmRsZSwgaW5wdXRGb3JtYXQsIGZpbHRlciwgdHlwZU5hbWUsIHdoaXRlbGlzdH0gPSBwYXJhbXM7XG4gICAgbGV0IHsgc3JzTmFtZSwgbnMsIGxheWVyLCBnZW9tZXRyeV9uYW1lIH0gPSB1bnBhY2soXG4gICAgICBmZWF0dXJlc1swXSB8fCB7fSwgcGFyYW1zLCAnc3JzTmFtZScsICducycsICdsYXllcicsICdnZW9tZXRyeV9uYW1lJyk7XG4gICAgdHlwZU5hbWUgPSBlbnN1cmVUeXBlTmFtZShucywgbGF5ZXIsIHR5cGVOYW1lKTtcbiAgICBmaWx0ZXIgPSBlbnN1cmVGaWx0ZXIoZmlsdGVyLCBmZWF0dXJlcywgcGFyYW1zKTtcbiAgICBpZiAoIWZpbHRlciAmJiAhZmVhdHVyZXMubGVuZ3RoKXtcbiAgICAgIGNvbnNvbGUud2FybignbmVpdGhlciBmZWF0dXJlcyBub3IgZmlsdGVyIHN1cHBsaWVkJyk7XG4gICAgICByZXR1cm4gJyc7XG4gICAgfVxuICAgIGxldCBmaWVsZHMgPSAnJztcbiAgICB1c2VXaGl0ZWxpc3RJZkF2YWlsYWJsZSggLy8gVE9ETzogYWN0aW9uIGF0dHJcbiAgICAgIHdoaXRlbGlzdCwgcGFyYW1zLnByb3BlcnRpZXMsIChrLCB2KSA9PiBmaWVsZHMgKz0gbWFrZUt2cChrLHYpXG4gICAgKTtcbiAgICBpZiAoZ2VvbWV0cnlfbmFtZSl7XG4gICAgICBmaWVsZHMgKz0gIHhtbC50YWcoXG5cdG5zLCBnZW9tZXRyeV9uYW1lLCB7fSwgZ21sMyhwYXJhbXMuZ2VvbWV0cnksICcnLCB7c3JzTmFtZX0pXG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gd2ZzKCdVcGRhdGUnLCB7aW5wdXRGb3JtYXQsIHNyc05hbWUsIHR5cGVOYW1lfSwgZmllbGRzICsgZmlsdGVyKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBlbmNhcHN1bGF0ZSBlYWNoIHVwZGF0ZSBpbiBpdHMgb3duIFVwZGF0ZSB0YWdcbiAgICByZXR1cm4gZmVhdHVyZXMubWFwKFxuICAgICAgKGYpID0+IFVwZGF0ZShcbiAgICAgICAgZiwgT2JqZWN0LmFzc2lnbih7fSwgcGFyYW1zLCB7cHJvcGVydGllczpmLnByb3BlcnRpZXN9KVxuICAgICAgKVxuICAgICkuam9pbignJyk7XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgd2ZzOkRlbGV0ZSBhY3Rpb24sIGNyZWF0aW5nIGEgZmlsdGVyIGFuZCB0eXBlTmFtZSBmcm9tIGZlYXR1cmUgaWRzIFxuICogaWYgbm9uZSBhcmUgc3VwcGxpZWQuXG4gKiBAcGFyYW0ge0ZlYXR1cmVbXXxGZWF0dXJlQ29sbGVjdGlvbnxGZWF0dXJlfSBmZWF0dXJlc1xuICogQHBhcmFtIHtQYXJhbXN9IHBhcmFtcyBvcHRpb25hbCBwYXJhbWV0ZXIgb3ZlcnJpZGVzLlxuICogQHBhcmFtIHtzdHJpbmd9IFtwYXJhbXMubnNdIEBzZWUgUGFyYW1zLm5zXG4gKiBAcGFyYW0ge3N0cmluZ3xPYmplY3R9IFtwYXJhbXMubGF5ZXJdIEBzZWUgUGFyYW1zLmxheWVyXG4gKiBAcGFyYW0ge3N0cmluZ30gW3BhcmFtcy50eXBlTmFtZV0gQHNlZSBQYXJhbXMudHlwZU5hbWUuIFRoaXMgd2lsbCBiZSBpbmZlcnJlZFxuICogZnJvbSBmZWF0dXJlL3BhcmFtcyBsYXllciBhbmQgbnMgaWYgdGhpcyBpcyBsZWZ0IHVuZGVmaW5lZC5cbiAqIEBwYXJhbSB7ZmlsdGVyfSBbcGFyYW1zLmZpbHRlcl0gQHNlZSBQYXJhbXMuZmlsdGVyLiAgVGhpcyB3aWxsIGJlIGluZmVycmVkXG4gKiBmcm9tIGZlYXR1cmUgaWRzIGFuZCBsYXllcihzKSBpZiBsZWZ0IHVuZGVmaW5lZCAoQHNlZSBlbnN1cmVGaWx0ZXIpLlxuICogQHJldHVybnMge3N0cmluZ30gYSB3ZnM6RGVsZXRlIHN0cmluZy5cbiAqL1xuZnVuY3Rpb24gRGVsZXRlKGZlYXR1cmVzLCBwYXJhbXM9e30pe1xuICBmZWF0dXJlcyA9IGVuc3VyZUFycmF5KGZlYXR1cmVzKTtcbiAgbGV0IHtmaWx0ZXIsIHR5cGVOYW1lfSA9IHBhcmFtczsgLy9UT0RPOiByZWN1cmUgJiBlbmNhcHN1bGF0ZSBieSB0eXBlTmFtZVxuICBsZXQge25zLCBsYXllcn0gPSB1bnBhY2soZmVhdHVyZXNbMF0gfHwge30sIHBhcmFtcywgJ2xheWVyJywgJ25zJyk7XG4gIHR5cGVOYW1lID0gZW5zdXJlVHlwZU5hbWUobnMsIGxheWVyLCB0eXBlTmFtZSk7XG4gIGZpbHRlciA9IGVuc3VyZUZpbHRlcihmaWx0ZXIsIGZlYXR1cmVzLCBwYXJhbXMpO1xuICByZXR1cm4gd2ZzKCdEZWxldGUnLCB7dHlwZU5hbWV9LCBmaWx0ZXIpOyBcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgc3RyaW5nIHdmczpSZXBsYWNlIGFjdGlvbi5cbiAqIEBwYXJhbSB7RmVhdHVyZVtdfEZlYXR1cmVDb2xsZWN0aW9ufEZlYXR1cmV9IGZlYXR1cmVzIGZlYXR1cmUocykgdG8gcmVwbGFjZVxuICogQHBhcmFtIHtQYXJhbXN9IHBhcmFtcyB3aXRoIG9wdGlvbmFsIGZpbHRlciwgaW5wdXRGb3JtYXQsIHNyc05hbWVcbiAqIEByZXR1cm5zIHtzdHJpbmd9IGEgc3RyaW5nIHdmczpSZXBsYWNlIGFjdGlvbi5cbiAqL1xuZnVuY3Rpb24gUmVwbGFjZShmZWF0dXJlcywgcGFyYW1zPXt9KXtcbiAgZmVhdHVyZXMgPSBlbnN1cmVBcnJheShmZWF0dXJlcyk7XG4gIGxldCB7ZmlsdGVyLCBpbnB1dEZvcm1hdCwgc3JzTmFtZX0gPSB1bnBhY2sgKFxuICAgIGZlYXR1cmVzWzBdIHx8IHt9LCBwYXJhbXMgfHwge30sICdmaWx0ZXInLCAnaW5wdXRGb3JtYXQnLCAnc3JzTmFtZSdcbiAgKTtcbiAgbGV0IHJlcGxhY2VtZW50cyA9IHRyYW5zbGF0ZUZlYXR1cmVzKFxuICAgIFtmZWF0dXJlc1swXV0uZmlsdGVyKChmKT0+ZiksXG4gICAgcGFyYW1zIHx8IHtzcnNOYW1lfVxuICApO1xuICBmaWx0ZXIgPSBlbnN1cmVGaWx0ZXIoZmlsdGVyLCBmZWF0dXJlcywgcGFyYW1zKTtcbiAgcmV0dXJuIHdmcygnUmVwbGFjZScsIHtpbnB1dEZvcm1hdCwgc3JzTmFtZX0sIHJlcGxhY2VtZW50cyArIGZpbHRlcik7XG59XG5cbi8qKlxuICogV3JhcHMgdGhlIGlucHV0IGFjdGlvbnMgaW4gYSB3ZnM6VHJhbnNhY3Rpb24uXG4gKiBAcGFyYW0ge09iamVjdHxzdHJpbmdbXXxzdHJpbmd9IGFjdGlvbnMgYW4gb2JqZWN0IG1hcHBpbmcge0luc2VydCwgVXBkYXRlLFxuICogRGVsZXRlfSB0byBmZWF0dXJlKHMpIHRvIHBhc3MgdG8gSW5zZXJ0LCBVcGRhdGUsIERlbGV0ZSwgb3Igd2ZzOmFjdGlvbiBcbiAqIHN0cmluZyhzKSB0byB3cmFwIGluIGEgdHJhbnNhY3Rpb24uXG4gKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIG9wdGlvbmFsIHNyc05hbWUsIGxvY2tJZCwgcmVsZWFzZUFjdGlvbiwgaGFuZGxlLFxuICogaW5wdXRGb3JtYXQsIHZlcnNpb24sIGFuZCByZXF1aXJlZCBuc0Fzc2lnbm1lbnRzLCBzY2hlbWFMb2NhdGlvbnMuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBBIHdmczp0cmFuc2FjdGlvbiB3cmFwcGluZyB0aGUgaW5wdXQgYWN0aW9ucy5cbiAqIEB0aHJvd3Mge0Vycm9yfSBpZiBgYWN0aW9uc2AgaXMgbm90IGFuIGFycmF5IG9mIHN0cmluZ3MsIGEgc3RyaW5nLCBvciBcbiAqIHtAc2VlIEluc2VydCwgQHNlZSBVcGRhdGUsIEBzZWUgRGVsZXRlfSwgd2hlcmUgZWFjaCBhY3Rpb24gYXJlIHZhbGlkIGlucHV0cyBcbiAqIHRvIHRoZSBlcG9ueW1vdXMgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIFRyYW5zYWN0aW9uKGFjdGlvbnMsIHBhcmFtcz17fSl7XG4gIGxldCB7XG4gICAgc3JzTmFtZSwgbG9ja0lkLCByZWxlYXNlQWN0aW9uLCBoYW5kbGUsIGlucHV0Rm9ybWF0LCB2ZXJzaW9uLCAvLyBvcHRpb25hbFxuICAgIG5zQXNzaWdubWVudHMsIHNjaGVtYUxvY2F0aW9ucyAvLyByZXF1aXJlZFxuICB9ID0gcGFyYW1zO1xuICBsZXQgY29udmVydGVyID0ge0luc2VydCwgVXBkYXRlLCBEZWxldGV9O1xuICBsZXQge2luc2VydDp0b0luc2VydCwgdXBkYXRlOnRvVXBkYXRlLCBkZWxldGU6dG9EZWxldGV9ID0gYWN0aW9ucyB8fCB7fTtcbiAgbGV0IGZpbmFsQWN0aW9ucyA9ICcnOyAvLyBwcm9jZXNzZWRBY3Rpb25zIHdvdWxkIGJlIG1vcmUgYWNjdXJhdGVcbiAgXG4gIGlmIChBcnJheS5pc0FycmF5KGFjdGlvbnMpICYmIGFjdGlvbnMuZXZlcnkoKHYpID0+IHR5cGVvZih2KSA9PSAnc3RyaW5nJykpe1xuICAgIGZpbmFsQWN0aW9ucyArPSBhY3Rpb25zLmpvaW4oJycpO1xuICB9IGVsc2UgaWYgKHR5cGVvZihhY3Rpb25zKSA9PSAnc3RyaW5nJykge1xuICAgIGZpbmFsQWN0aW9ucyA9IGFjdGlvbnM7XG4gIH1cbiAgICBlbHNlIGlmIChbdG9JbnNlcnQsIHRvVXBkYXRlLCB0b0RlbGV0ZV0uc29tZSgoZSkgPT4gZSkpe1xuICAgIGZpbmFsQWN0aW9ucyArPSBJbnNlcnQodG9JbnNlcnQsIHBhcmFtcykgK1xuICAgICAgVXBkYXRlKHRvVXBkYXRlLCBwYXJhbXMpICtcbiAgICAgIERlbGV0ZSh0b0RlbGV0ZSwgcGFyYW1zKTtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYHVuZXhwZWN0ZWQgaW5wdXQ6ICR7SlNPTi5zdHJpbmdpZnkoYWN0aW9ucyl9YCk7XG4gIH1cbiAgLy8gZ2VuZXJhdGUgc2NoZW1hTG9jYXRpb24sIHhtbG5zJ3NcbiAgbnNBc3NpZ25tZW50cyA9IG5zQXNzaWdubWVudHMgfHwge307XG4gIHNjaGVtYUxvY2F0aW9ucyA9IHNjaGVtYUxvY2F0aW9ucyB8fCB7fTtcbiAgbGV0IGF0dHJzID0gZ2VuZXJhdGVOc0Fzc2lnbm1lbnRzKG5zQXNzaWdubWVudHMsIGFjdGlvbnMpO1xuICBhdHRyc1sneHNpOnNjaGVtYUxvY2F0aW9uJ10gPSAgZ2VuZXJhdGVTY2hlbWFMaW5lcyhwYXJhbXMuc2NoZW1hTG9jYXRpb25zKTtcbiAgYXR0cnNbJ3NlcnZpY2UnXSA9ICdXRlMnO1xuICBhdHRyc1sndmVyc2lvbiddID0gLzJcXC4wXFwuXFxkKy8uZXhlYyh2ZXJzaW9uIHx8ICcnKSA/IHZlcnNpb24gOiAnMi4wLjAnO1xuICByZXR1cm4gd2ZzKCdUcmFuc2FjdGlvbicsIGF0dHJzLCBmaW5hbEFjdGlvbnMpO1xufVxuXG4vKipcbiAqIEdlbmVyYXRlcyBhbiBvYmplY3QgdG8gYmUgcGFzc2VkIHRvIEBzZWUgeG1sLmF0dHJzIHhtbG5zOm5zPVwidXJpXCIgZGVmaW5pdGlvbnMgZm9yIGEgd2ZzOlRyYW5zYWN0aW9uXG4gKiBAcGFyYW0ge09iamVjdH0gbnNBc3NpZ25tZW50cyBAc2VlIFBhcmFtcy5uc0Fzc2lnbm1lbnRzXG4gKiBAcGFyYW0ge3N0cmluZ30geG1sIGFyYml0cmFyeSB4bWwuXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBhbiBvYmplY3QgbWFwcGluZyBlYWNoIG5zIHRvIGl0cyBVUkkgYXMgJ3htbG5zOm5zJyA6ICdVUkknLlxuICogQHRocm93cyB7RXJyb3J9IGlmIGFueSBuYW1lc3BhY2UgdXNlZCB3aXRoaW4gYHhtbGAgaXMgbWlzc2luZyBhIFVSSSBkZWZpbml0aW9uXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlTnNBc3NpZ25tZW50cyhuc0Fzc2lnbm1lbnRzLCB4bWwpe1xuICBsZXQgYXR0cnMgPSB7fTtcbiAgY29uc3QgbWFrZU5zQXNzaWdubWVudCA9IChucywgdXJpKSA9PiBhdHRyc1tgeG1sbnM6JHtuc31gXSA9IHVyaTtcbiAgZm9yIChsZXQgbnMgaW4gbnNBc3NpZ25tZW50cyl7XG4gICAgbWFrZU5zQXNzaWdubWVudChucywgbnNBc3NpZ25tZW50c1tuc10pO1xuICB9XG4gIC8vIGNoZWNrIGFsbCBucydzIGFzc2lnbmVkIFxuICB2YXIgcmUgPSAvKDx8dHlwZU5hbWU9XCIpKFxcdyspOi9nO1xuICB2YXIgYXJyO1xuICB2YXIgYWxsTmFtZXNwYWNlcyA9IG5ldyBTZXQoKTtcbiAgd2hpbGUgKChhcnIgPSByZS5leGVjKHhtbCkpICE9PSBudWxsKXtcbiAgICBhbGxOYW1lc3BhY2VzLmFkZChhcnJbMl0pO1xuICB9XG4gIGlmIChhbGxOYW1lc3BhY2VzLmhhcygnZmVzJykpe1xuICAgIG1ha2VOc0Fzc2lnbm1lbnQoJ2ZlcycsICdodHRwOi8vd3d3Lm9wZW5naXMubmV0L2Zlcy8yLjAnKTtcbiAgfTtcbiAgbWFrZU5zQXNzaWdubWVudCgneHNpJywgJ2h0dHA6Ly93d3cudzMub3JnLzIwMDEvWE1MU2NoZW1hLWluc3RhbmNlJyk7XG4gIG1ha2VOc0Fzc2lnbm1lbnQoJ2dtbCcsICdodHRwOi8vd3d3Lm9wZW5naXMubmV0L2dtbC8zLjInKTtcbiAgbWFrZU5zQXNzaWdubWVudCgnd2ZzJywgJ2h0dHA6Ly93d3cub3Blbmdpcy5uZXQvd2ZzLzIuMCcpO1xuXG4gIGZvciAobGV0IG5zIG9mIGFsbE5hbWVzcGFjZXMpe1xuICAgIGlmICghYXR0cnNbJ3htbG5zOicgKyBuc10pe1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGB1bmFzc2lnbmVkIG5hbWVzcGFjZSAke25zfWApO1xuICAgIH1cbiAgfVxuICByZXR1cm4gYXR0cnM7XG59XG5cbi8qKlxuICogUmV0dXJucyBhIHN0cmluZyBhbHRlcm5hdGluZyB1cmksIHdoaXRlc3BhY2UsIGFuZCB0aGUgdXJpJ3Mgc2NoZW1hJ3MgbG9jYXRpb24uXG4gKiBAcGFyYW0ge09iamVjdH0gc2NoZW1hTG9jYXRpb25zIGFuIG9iamVjdCBtYXBwaW5nIHVyaTpzY2hlbWFsb2NhdGlvblxuICogQHJldHVybnMge3N0cmluZ30gYSBzdHJpbmcgdGhhdCBpcyBhIHZhbGlkIHhzaTpzY2hlbWFMb2NhdGlvbiB2YWx1ZS5cbiAqL1xuZnVuY3Rpb24gZ2VuZXJhdGVTY2hlbWFMaW5lcyhzY2hlbWFMb2NhdGlvbnM9e30pe1xuICAvL1RPRE86IGFkZCBucyBhc3NpZ25tZW50IGNoZWNrXG4gIHNjaGVtYUxvY2F0aW9uc1snaHR0cDovL3d3dy5vcGVuZ2lzLm5ldC93ZnMvMi4wJ10gPSBcbiAgICAnaHR0cDovL3NjaGVtYXMub3Blbmdpcy5uZXQvd2ZzLzIuMC93ZnMueHNkJztcbiAgdmFyIHNjaGVtYUxpbmVzID0gW107XG4gIGZvciAobGV0IHVyaSBpbiBzY2hlbWFMb2NhdGlvbnMpe1xuICAgIHNjaGVtYUxpbmVzLnB1c2goYCR7dXJpfVxcbiR7c2NoZW1hTG9jYXRpb25zW3VyaV19YCk7XG4gIH1cbiAgcmV0dXJuIHNjaGVtYUxpbmVzLmpvaW4oJ1xcbicpO1xufVxuXG5leHBvcnQge0luc2VydCwgVXBkYXRlLCBSZXBsYWNlLCBEZWxldGUsIFRyYW5zYWN0aW9ufTtcbiIsImltcG9ydCB7IGdlb21Ub0dtbCBhcyBnbWwyIH0gZnJvbSAnZ2VvanNvbi10by1nbWwtMic7XG5pbXBvcnQgeyBnZW9tVG9HbWwgYXMgZ21sMyB9IGZyb20gJ2dlb2pzb24tdG8tZ21sLTMnO1xuaW1wb3J0IHtUcmFuc2FjdGlvbiwgSW5zZXJ0fSBmcm9tICdnZW9qc29uLXRvLXdmcy10LTInOyAvLyBNb3JlIGxhdGVyLCBJIGd1ZXNzXG4vKiB0b2dnbGVzICovXG4kKCcucG9ydGZvbGlvLXRvZ2dsZScpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICAkKHRoaXMpLm5leHQoJy5wb3J0Zm9saW8taXRlbScpLnNsaWRlVG9nZ2xlKDMwMCk7XG4gICAgLy8gVE9ETzogZW5zdXJlIHRoZSB0b2dnbGVkIGl0ZW0gaXMgaW4gdmlld1xufSk7XG5cbi8qIHRyYW5zbGF0aW9uIGZ1bmN0aW9uICovXG5mdW5jdGlvbiB0cmFuc2xhdG9yKGJ1dHRvbiwgZnJvbSwgdG8sIHRyYW5zbGF0b3JDYil7XG4gICQoYnV0dG9uKS5tb3VzZXVwKChlKT0+e1xuICAgIHRyeSB7XG4gICAgICBkZWJ1Z2dlcjtcbiAgICAgIGNvbnN0IHRvVHJhbnNsYXRlID0gSlNPTi5wYXJzZSgkKGZyb20pLnRleHQoKSk7XG4gICAgICBjb25zdCB0cmFuc2xhdGVkID0gZm9ybWF0WG1sKHRyYW5zbGF0b3JDYih0b1RyYW5zbGF0ZSkpO1xuICAgICAgdHJ5IHtcblx0JCh0bykudGV4dCh0cmFuc2xhdGVkKTtcbiAgICAgIH0gY2F0Y2ggKGVycil7XG5cdCQodG8pLnZhbCh0cmFuc2xhdGVkKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnIpe1xuICAgICAgYWxlcnQoZXJyKTtcbiAgICB9XG4gIH0pO1xufVxuXG4vKiBHZW9qc29uIC0+IEdNTCBleGFtcGxlICovXG50cmFuc2xhdG9yKFxuICAnI3RyYW5zbGF0ZS1nZW9qc29uLWdtbC0yJywgJyNnZW9qc29uLXNhbXBsZS1nbWwnLCAnI2dtbC10YXJnZXQnLFxuICAodG9UcmFuc2xhdGUpID0+IGdtbDIodG9UcmFuc2xhdGUpXG4pO1xudHJhbnNsYXRvcihcbiAgJyN0cmFuc2xhdGUtZ2VvanNvbi1nbWwtMycsICcjZ2VvanNvbi1zYW1wbGUtZ21sJywgJyNnbWwtdGFyZ2V0JyxcbiAgKHRvVHJhbnNsYXRlKSA9PiBnbWwzKHRvVHJhbnNsYXRlKVxuKTtcbnRyYW5zbGF0b3IoXG4gICcjdHJhbnNsYXRlLWdlb2pzb24td2ZzdCcsICcjZ2VvanNvbi1zYW1wbGUtd2ZzJywgJyNnbWwtdGFyZ2V0JyxcbiAgKHRvVHJhbnNsYXRlKT0+VHJhbnNhY3Rpb24oSW5zZXJ0KHRvVHJhbnNsYXRlKSlcbik7XG5mdW5jdGlvbiBmb3JtYXRYbWwoeG1sKSB7XG4gICAgdmFyIGZvcm1hdHRlZCA9ICcnO1xuICAgIHZhciByZWcgPSAvKD4pKDwpKFxcLyopL2c7XG4gICAgeG1sID0geG1sLnJlcGxhY2UocmVnLCAnJDFcXHJcXG4kMiQzJyk7XG4gICAgdmFyIHBhZCA9IDA7XG4gICAgeG1sLnNwbGl0KCdcXHJcXG4nKS5mb3JFYWNoKGZ1bmN0aW9uIChub2RlLCBpbmRleCkge1xuICAgICAgICB2YXIgaW5kZW50ID0gMDtcbiAgICAgICAgaWYgKG5vZGUubWF0Y2goLy4rPFxcL1xcd1tePl0qPiQvKSkge1xuICAgICAgICAgICAgaW5kZW50ID0gMDtcbiAgICAgICAgfSBlbHNlIGlmIChub2RlLm1hdGNoKC9ePFxcL1xcdy8pKSB7XG4gICAgICAgICAgICBpZiAocGFkICE9IDApIHtcbiAgICAgICAgICAgICAgICBwYWQgLT0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChub2RlLm1hdGNoKC9ePFxcdyhbXj5dKlteXFwvXSk/Pi4qJC8pKSB7XG4gICAgICAgICAgICBpbmRlbnQgPSAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaW5kZW50ID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBwYWRkaW5nID0gJyc7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGFkOyBpKyspIHtcbiAgICAgICAgICAgIHBhZGRpbmcgKz0gJyAgJztcbiAgICAgICAgfVxuXG4gICAgICAgIGZvcm1hdHRlZCArPSBwYWRkaW5nICsgbm9kZSArICdcXHJcXG4nO1xuICAgICAgICBwYWQgKz0gaW5kZW50O1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGZvcm1hdHRlZDtcbn1cblxuLy9UT0RPOiBHZW9KU09OIC0+IFdGUy1UXG5cbi8qIHJlZGlyZWN0IG9uIGxhbmRpbmcgKi9cbiQoZG9jdW1lbnQpLnJlYWR5KCgpPT4kKHdpbmRvdy5sb2NhdGlvbi5oYXNoIHx8ICcjYWJvdXQtbWUnKS5zaG93KCkpO1xuXG4kKCdhLmxpbmstcmlnaHQnKS5vbihcbiAgICBcImNsaWNrXCIsXG4gICAgZnVuY3Rpb24oZSl7XG5cdCQoJCh0aGlzKS5hdHRyKCdocmVmJykpLnNob3coKTtcblx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9XG4pO1xuIl0sIm5hbWVzIjpbIlBvaW50IiwiTGluZVN0cmluZyIsIkxpbmVhclJpbmciLCJQb2x5Z29uIiwiTXVsdGlQb2ludCIsIk11bHRpTGluZVN0cmluZyIsIk11bHRpUG9seWdvbiIsImNvbnZlcnRlciIsIkdlb21ldHJ5Q29sbGVjdGlvbiIsImdlb21Ub0dtbCIsImdtbDMiLCIkIiwib24iLCJuZXh0Iiwic2xpZGVUb2dnbGUiLCJ0cmFuc2xhdG9yIiwiYnV0dG9uIiwiZnJvbSIsInRvIiwidHJhbnNsYXRvckNiIiwibW91c2V1cCIsImUiLCJ0b1RyYW5zbGF0ZSIsIkpTT04iLCJwYXJzZSIsInRleHQiLCJ0cmFuc2xhdGVkIiwiZm9ybWF0WG1sIiwiZXJyIiwidmFsIiwiZ21sMiIsIlRyYW5zYWN0aW9uIiwiSW5zZXJ0IiwieG1sIiwiZm9ybWF0dGVkIiwicmVnIiwicmVwbGFjZSIsInBhZCIsInNwbGl0IiwiZm9yRWFjaCIsIm5vZGUiLCJpbmRleCIsImluZGVudCIsIm1hdGNoIiwicGFkZGluZyIsImkiLCJkb2N1bWVudCIsInJlYWR5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
