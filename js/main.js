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
$(document).ready(() => $(window.location.hash).show());

$('a.link-right').on("click", function (e) {
    $($(this).attr('href')).show();
    e.stopPropagation();
});

}());
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5taW4uanMiLCJzb3VyY2VzIjpbIi4uL25vZGVfbW9kdWxlcy9nZW9qc29uLXRvLWdtbC0yL2dlb21Ub0dtbC0yLjEuMi1lczYuanMiLCIuLi9ub2RlX21vZHVsZXMvZ2VvanNvbi10by1nbWwtMy9nZW9tVG9HbWwtMy4yLjEtZXM2LmpzIiwiLi4vbm9kZV9tb2R1bGVzL2dlb2pzb24tdG8td2ZzLXQtMi9nZW9qc29uLXRvLXdmc3QtMi1lczYuanMiLCIuLi9zcmMvc2NyaXB0cy9tYWluLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qIENvbnZlcnQgZ2VvanNvbiBpbnRvIGdtbCAyLjEuMiBzaW1wbGUgZmVhdHVyZXMuXG4gR01MIG1vZGVscyBmcm9tIGh0dHBzOi8vZG9jcy5vcmFjbGUuY29tL2NkL0UxMTg4Ml8wMS9hcHBkZXYuMTEyL2UxMTgyOS9vcmFjbGUvc3BhdGlhbC91dGlsL0dNTC5odG1sXG4gKi9cbi8qKlxuICogcmV0dXJucyBhIHN0cmluZyB3aXRoIHRoZSBmaXJzdCBsZXR0ZXIgY2FwaXRhbGl6ZWQuXG4gKiBAZnVuY3Rpb24gXG4gKiBAcHJpdmF0ZSBcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJcbiAqIEByZXR1cm5zIHtzdHJpbmd9IGEgc3RyaW5nIHdpdGggdGhlIGZpcnN0IGxldHRlciBjYXBpdGFsaXplZC5cbiAqL1xuZnVuY3Rpb24gY2FwaXRhbGl6ZUZpcnN0TGV0dGVyKHN0cil7XG4gIHJldHVybiBzdHIucmVwbGFjZSgvXi4vLCAobGV0dGVyKSA9PiBsZXR0ZXIudG9VcHBlckNhc2UoKSk7XG59XG4vKipcbiAqIHJldHVybnMgYSBzdHJpbmcgd2l0aCB0aGUgZmlyc3QgbGV0dGVyIGxvd2VyZWQuXG4gKiBAZnVuY3Rpb24gXG4gKiBAcHJpdmF0ZSBcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJcbiAqIEByZXR1cm5zIHtzdHJpbmd9IGEgc3RyaW5nIHdpdGggdGhlIGZpcnN0IGxldHRlciBsb3dlcmVkLlxuICovXG5mdW5jdGlvbiBsb3dlckZpcnN0TGV0dGVyKHN0cil7XG4gIHJldHVybiBzdHIucmVwbGFjZSgvXi4vLCAobGV0dGVyKT0+bGV0dGVyLnRvTG93ZXJDYXNlKCkpO1xufVxuLyoqIFxuICogY29udmVydHMgYSBnZW9qc29uIGdlb21ldHJ5IFBvaW50IHRvIGdtbFxuICogQGZ1bmN0aW9uIFxuICogQHBhcmFtIHtudW1iZXJbXX0gY29vcmRzIHRoZSBjb29yZGluYXRlcyBtZW1iZXIgb2YgdGhlIGdlb21ldHJ5XG4gKiBAcGFyYW0ge3N0cmluZ3x1bmRlZmluZWR9IHNyc05hbWUgYSBzdHJpbmcgc3BlY2lmeWluZyBTUlNcbiAqIEByZXR1cm5zIHtzdHJpbmd9IGEgc3RyaW5nIG9mIGdtbCBkZXNjcmliaW5nIHRoZSBpbnB1dCBnZW9tZXRyeVxuICovXG5mdW5jdGlvbiBQb2ludChjb29yZHMsIHNyc05hbWUpe1xuICByZXR1cm4gYDxnbWw6UG9pbnQkeyhzcnNOYW1lID8gYCBzcnNOYW1lPVwiJHtzcnNOYW1lfVwiYCA6ICcnKX0+YCArXG4gICAgJzxnbWw6Y29vcmRpbmF0ZXMgY3M9XCIsXCIgdHM9XCIgXCIgZGVjaW1hbD1cIi5cIj4nICtcbiAgICBjb29yZHMuam9pbigpICtcbiAgICAnPC9nbWw6Y29vcmRpbmF0ZXM+JyArXG4gICAgJzwvZ21sOlBvaW50Pic7XG59XG4vKipcbiAqIGNvbnZlcnRzIGEgZ2VvanNvbiBnZW9tZXRyeSBMaW5lU3RyaW5nIHRvIGdtbFxuICogQGZ1bmN0aW9uIFxuICogQHBhcmFtIHtudW1iZXJbXVtdfSBjb29yZHMgdGhlIGNvb3JkaW5hdGVzIG1lbWJlciBvZiB0aGUgZ2VvbWV0cnlcbiAqIEBwYXJhbSB7c3RyaW5nfHVuZGVmaW5lZH0gc3JzTmFtZSBhIHN0cmluZyBzcGVjaWZ5aW5nIFNSU1xuICogQHJldHVybnMge3N0cmluZ30gYSBzdHJpbmcgb2YgZ21sIGRlc2NyaWJpbmcgdGhlIGlucHV0IGdlb21ldHJ5XG4gKi9cbmZ1bmN0aW9uIExpbmVTdHJpbmcoY29vcmRzLCBzcnNOYW1lKXtcbiAgcmV0dXJuIGA8Z21sOkxpbmVTdHJpbmckeyhzcnNOYW1lID8gYCBzcnNOYW1lPVwiJHtzcnNOYW1lfVwiYDonJyl9PmAgK1xuICAgICc8Z21sOmNvb3JkaW5hdGVzIGNzPVwiLFwiIHRzPVwiIFwiIGRlY2ltYWw9XCIuXCI+JyArXG4gICAgY29vcmRzLmpvaW4oJyAnKSArXG4gICAgJzwvZ21sOmNvb3JkaW5hdGVzPicgK1xuICAgICc8L2dtbDpMaW5lU3RyaW5nPic7XG59XG4vKipcbiAqIGNvbnZlcnRzIGEgZ2VvanNvbiBnZW9tZXRyeSByaW5nIGluIGEgcG9seWdvbiB0byBnbWxcbiAqIEBmdW5jdGlvbiBcbiAqIEBwYXJhbSB7bnVtYmVyW11bXX0gY29vcmRzIHRoZSBjb29yZGluYXRlcyBtZW1iZXIgb2YgdGhlIGdlb21ldHJ5XG4gKiBAcGFyYW0ge3N0cmluZ3x1bmRlZmluZWR9IHNyc05hbWUgYSBzdHJpbmcgc3BlY2lmeWluZyBTUlNcbiAqIEByZXR1cm5zIHtzdHJpbmd9IGEgc3RyaW5nIG9mIGdtbCBkZXNjcmliaW5nIHRoZSBpbnB1dCBnZW9tZXRyeVxuICovXG5mdW5jdGlvbiBMaW5lYXJSaW5nKGNvb3Jkcywgc3JzTmFtZSl7XG4gIHJldHVybiBgPGdtbDpMaW5lYXJSaW5nJHsoc3JzTmFtZSA/IGAgc3JzTmFtZT1cIiR7c3JzTmFtZX1cImA6JycpfT5gICtcbiAgICAnPGdtbDpjb29yZGluYXRlcyBjcz1cIixcIiB0cz1cIiBcIiBkZWNpbWFsPVwiLlwiPicgK1xuICAgIGNvb3Jkcy5qb2luKCcgJykgKyBcbiAgICAnPC9nbWw6Y29vcmRpbmF0ZXM+JyArXG4gICAgJzwvZ21sOkxpbmVhclJpbmc+Jztcbn1cbi8qKlxuICogY29udmVydHMgYSBnZW9qc29uIGdlb21ldHJ5IFBvbHlnb24gdG8gZ21sXG4gKiBAZnVuY3Rpb24gXG4gKiBAcGFyYW0ge251bWJlcltdW11bXX0gY29vcmRzIHRoZSBjb29yZGluYXRlcyBtZW1iZXIgb2YgdGhlIGdlb21ldHJ5XG4gKiBAcGFyYW0ge3N0cmluZ3x1bmRlZmluZWR9IHNyc05hbWUgYSBzdHJpbmcgc3BlY2lmeWluZyBTUlNcbiAqIEByZXR1cm5zIHtzdHJpbmd9IGEgc3RyaW5nIG9mIGdtbCBkZXNjcmliaW5nIHRoZSBpbnB1dCBnZW9tZXRyeVxuICovXG5mdW5jdGlvbiBQb2x5Z29uKGNvb3Jkcywgc3JzTmFtZSl7XG4gIC8vIGdlb20uY29vcmRpbmF0ZXMgYXJlIGFycmF5cyBvZiBMaW5lYXJSaW5nc1xuICBsZXQgcG9seWdvbiA9IGA8Z21sOlBvbHlnb24keyhzcnNOYW1lID8gYCBzcnNOYW1lPVwiJHtzcnNOYW1lfVwiYDonJyl9PmAgK1xuXHQnPGdtbDpvdXRlckJvdW5kYXJ5SXM+JyArXG5cdExpbmVhclJpbmcoY29vcmRzWzBdKSArXG5cdCc8L2dtbDpvdXRlckJvdW5kYXJ5SXM+JztcbiAgaWYgKGNvb3Jkcy5sZW5ndGggPj0gMil7XG4gICAgZm9yIChsZXQgbGluZWFyUmluZyBvZiBjb29yZHMuc2xpY2UoMSkpe1xuICAgICAgcG9seWdvbiArPSAnPGdtbDppbm5lckJvdW5kYXJ5SXM+JyArXG5cdExpbmVhclJpbmcobGluZWFyUmluZykgKyBcblx0JzwvZ21sOmlubmVyQm91bmRhcnlJcz4nO1xuICAgIH1cbiAgfVxuICBwb2x5Z29uICs9ICc8L2dtbDpQb2x5Z29uPic7XG4gIHJldHVybiBwb2x5Z29uO1xufVxuLyoqXG4gKiBIYW5kbGVzIG11bHRpZ2VvbWV0cmllcyBvciBnZW9tZXRyeSBjb2xsZWN0aW9uc1xuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge09iamVjdH0gZ2VvbSBhIGdlb2pzb24gZ2VvbWV0cnkgb2JqZWN0XG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSB0aGUgbmFtZSBvZiB0aGUgbXVsdGlnZW9tZXRyeSwgZS5nLiAnTXVsdGlQb2x5Z29uJ1xuICogQHBhcmFtIHtzdHJpbmd8dW5kZWZpbmVkfSBzcnNOYW1lIGEgc3RyaW5nIHNwZWNpZnlpbmcgdGhlIFNSU1xuICogQHBhcmFtIHtzdHJpbmd9IG1lbWJlclByZWZpeCB0aGUgcHJlZml4IG9mIGEgZ21sIG1lbWJlciB0YWdcbiAqIEByZXR1cm5zIHtzdHJpbmd9IGEgc3RyaW5nIG9mIGdtbCBkZXNjcmliaW5nIHRoZSBpbnB1dCBtdWx0aWdlb21ldHJ5XG4gKiBAdGhyb3dzIHtFcnJvcn0gd2lsbCB0aHJvdyBhbiBlcnJvciBpZiBhIG1lbWJlciBnZW9tZXRyeSBpcyBzdXBwbGllZCB3aXRob3V0IGEgYHR5cGVgIGF0dHJpYnV0ZVxuICovXG5mdW5jdGlvbiBfbXVsdGkoZ2VvbSwgbmFtZSwgY2IsIHNyc05hbWUsIG1lbWJlclByZWZpeD0nJyl7XG4gIGxldCBtdWx0aSA9IGA8Z21sOiR7bmFtZX0keyhzcnNOYW1lID8gYCBzcnNOYW1lPVwiJHtzcnNOYW1lfVwiYCA6ICcnKX0+YDtcbiAgZm9yIChsZXQgbWVtYmVyIG9mIGdlb20pe1xuICAgIHZhciBfbWVtYmVyUHJlZml4ID0gJyc7XG4gICAgaWYgKG1lbWJlci50eXBlKXtcbiAgICAgIC8vIGdlb21ldHJ5Q29sbGVjdGlvbjogbWVtYmVyUHJlZml4IHNob3VsZCBiZSAnJyxcbiAgICAgIG1lbWJlclByZWZpeCA9IGxvd2VyRmlyc3RMZXR0ZXIobWVtYmVyLnR5cGUpO1xuICAgICAgbWVtYmVyID0gbWVtYmVyLmNvb3JkaW5hdGVzO1xuICAgIH1cbiAgICBpZiAoIW1lbWJlclByZWZpeCl7XG4gICAgICB0aHJvdyAndW4tdHlwZWQgbWVtYmVyICcgKyBKU09OLnN0cmluZ2lmeShtZW1iZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBfbWVtYmVyUHJlZml4ID0gY2FwaXRhbGl6ZUZpcnN0TGV0dGVyKG1lbWJlclByZWZpeCk7XG4gICAgfVxuICAgIGxldCBpbm5lciA9IChjYltfbWVtYmVyUHJlZml4XSB8fCBjYikobWVtYmVyLCBzcnNOYW1lPScnKTtcbiAgICBtdWx0aSArPSBgPGdtbDoke21lbWJlclByZWZpeH1NZW1iZXI+JHtpbm5lcn08L2dtbDoke21lbWJlclByZWZpeH1NZW1iZXI+YDtcbiAgfVxuICBtdWx0aSArPSBgPC9nbWw6JHtuYW1lfT5gO1xuICByZXR1cm4gbXVsdGk7XG59XG4vKipcbiAqIGNvbnZlcnRzIGEgZ2VvanNvbiBnZW9tZXRyeSBNdWx0aVBvaW50IHRvIGdtbFxuICogQGZ1bmN0aW9uIFxuICogQHBhcmFtIHtudW1iZXJbXVtdfSBjb29yZHMgdGhlIGNvb3JkaW5hdGVzIG1lbWJlciBvZiB0aGUgZ2VvbWV0cnlcbiAqIEBwYXJhbSB7c3RyaW5nfHVuZGVmaW5lZH0gc3JzTmFtZSBhIHN0cmluZyBzcGVjaWZ5aW5nIFNSU1xuICogQHJldHVybnMge3N0cmluZ30gYSBzdHJpbmcgb2YgZ21sIGRlc2NyaWJpbmcgdGhlIGlucHV0IGdlb21ldHJ5XG4gKiBAc2VlIF9tdWx0aVxuICogQHNlZSBQb2ludFxuICovXG5mdW5jdGlvbiBNdWx0aVBvaW50KGNvb3Jkcywgc3JzTmFtZSl7XG4gIHJldHVybiBfbXVsdGkoY29vcmRzLCAnTXVsdGlQb2ludCcsIFBvaW50LCBzcnNOYW1lLCAncG9pbnQnKTtcbn1cbi8qKlxuICogY29udmVydHMgYSBnZW9qc29uIGdlb21ldHJ5IE11bHRpTGluZVN0cmluZyB0byBnbWxcbiAqIEBmdW5jdGlvbiBcbiAqIEBwYXJhbSB7bnVtYmVyW11bXVtdfSBjb29yZHMgdGhlIGNvb3JkaW5hdGVzIG1lbWJlciBvZiB0aGUgZ2VvbWV0cnlcbiAqIEBwYXJhbSB7c3RyaW5nfHVuZGVmaW5lZH0gc3JzTmFtZSBhIHN0cmluZyBzcGVjaWZ5aW5nIFNSU1xuICogQHJldHVybnMge3N0cmluZ30gYSBzdHJpbmcgb2YgZ21sIGRlc2NyaWJpbmcgdGhlIGlucHV0IGdlb21ldHJ5XG4gKiBAc2VlIF9tdWx0aVxuICogQHNlZSBMaW5lU3RyaW5nXG4gKi9cbmZ1bmN0aW9uIE11bHRpTGluZVN0cmluZyhjb29yZHMsIHNyc05hbWUpe1xuICByZXR1cm4gX211bHRpKGNvb3JkcywgJ011bHRpTGluZVN0cmluZycsIExpbmVTdHJpbmcsIHNyc05hbWUsICdsaW5lU3RyaW5nJyk7XG59XG4vKipcbiAqIGNvbnZlcnRzIGEgZ2VvanNvbiBnZW9tZXRyeSBNdWx0aVBvbHlnb24gdG8gZ21sXG4gKiBAZnVuY3Rpb24gXG4gKiBAcGFyYW0ge251bWJlcltdW11bXVtdfSBjb29yZHMgdGhlIGNvb3JkaW5hdGVzIG1lbWJlciBvZiB0aGUgZ2VvbWV0cnlcbiAqIEBwYXJhbSB7c3RyaW5nfHVuZGVmaW5lZH0gc3JzTmFtZSBhIHN0cmluZyBzcGVjaWZ5aW5nIFNSU1xuICogQHJldHVybnMge3N0cmluZ30gYSBzdHJpbmcgb2YgZ21sIGRlc2NyaWJpbmcgdGhlIGlucHV0IGdlb21ldHJ5XG4gKiBAc2VlIF9tdWx0aVxuICogQHNlZSBQb2x5Z29uXG4gKi9cbmZ1bmN0aW9uIE11bHRpUG9seWdvbihjb29yZHMsIHNyc05hbWUpe1xuICByZXR1cm4gX211bHRpKGNvb3JkcywgJ011bHRpUG9seWdvbicsIFBvbHlnb24sIHNyc05hbWUsICdwb2x5Z29uJyk7XG59XG5jb25zdCBjb252ZXJ0ZXIgPSB7XG4gIFBvaW50LCBMaW5lU3RyaW5nLCBMaW5lYXJSaW5nLCBQb2x5Z29uLFxuICBNdWx0aVBvaW50LCBNdWx0aUxpbmVTdHJpbmcsIE11bHRpUG9seWdvbiwgR2VvbWV0cnlDb2xsZWN0aW9uXG59O1xuXG4vKipcbiAqIGNvbnZlcnRzIGEgZ2VvanNvbiBnZW9tZXRyeSBHZW9tZXRyeUNvbGxlY3Rpb24gdG8gZ21sIE11bHRpR2VvbWV0cnlcbiAqIEBmdW5jdGlvbiBcbiAqIEBwYXJhbSB7T2JqZWN0W119IGdlb21zIGFuIGFycmF5IG9mIGdlb2pzb24gZ2VvbWV0cnkgb2JqZWN0c1xuICogQHBhcmFtIHtzdHJpbmd8dW5kZWZpbmVkfSBzcnNOYW1lIGEgc3RyaW5nIHNwZWNpZnlpbmcgU1JTXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBhIHN0cmluZyBvZiBnbWwgZGVzY3JpYmluZyB0aGUgaW5wdXQgR2VvbWV0cnlDb2xsZWN0aW9uXG4gKiBAc2VlIF9tdWx0aVxuICovXG5mdW5jdGlvbiBHZW9tZXRyeUNvbGxlY3Rpb24oZ2VvbXMsIHNyc05hbWUpe1xuICByZXR1cm4gX211bHRpKGdlb21zLCAnTXVsdGlHZW9tZXRyeScsIGNvbnZlcnRlciwgc3JzTmFtZSwgJ2dlb21ldHJ5Jyk7XG59XG5cbi8qKlxuICogVHJhbnNsYXRlIGdlb2pzb24gdG8gZ21sIDIuMS4yIGZvciBhbnkgZ2VvanNvbiBnZW9tZXRyeSB0eXBlXG4gKiBAZnVuY3Rpb24gXG4gKiBAcGFyYW0ge09iamVjdH0gZ2VvbSBhIGdlb2pzb24gZ2VvbWV0cnkgb2JqZWN0XG4gKiBAcGFyYW0ge3N0cmluZ3x1bmRlZmluZWR9IHNyc05hbWUgYSBzdHJpbmcgc3BlY2lmeWluZyBTUlNcbiAqIEByZXR1cm5zIHtzdHJpbmd9IGEgc3RyaW5nIG9mIGdtbCBkZXNjcmliaW5nIHRoZSBpbnB1dCBnZW9tZXRyeVxuICovXG5mdW5jdGlvbiBnZW9tVG9HbWwoZ2VvbSwgc3JzTmFtZT0nRVBTRzo0MzI2Jyl7XG4gIHJldHVybiBjb252ZXJ0ZXJbZ2VvbS50eXBlXShnZW9tLmNvb3JkaW5hdGVzIHx8IGdlb20uZ2VvbWV0cmllcywgc3JzTmFtZSk7XG59XG4vKiogZXhwb3J0cyBhIGZ1bmN0aW9uIHRvIGNvbnZlcnQgZ2VvanNvbiBnZW9tZXRyaWVzIHRvIGdtbCAyLjEuMiAqL1xuZXhwb3J0IHtcbiAgZ2VvbVRvR21sLCBQb2ludCwgTGluZVN0cmluZywgTGluZWFyUmluZywgUG9seWdvbixcbiAgTXVsdGlQb2ludCwgTXVsdGlMaW5lU3RyaW5nLCBNdWx0aVBvbHlnb24sIEdlb21ldHJ5Q29sbGVjdGlvblxufTtcbiIsIi8qIFxuIE5vdGUgdGhpcyBjYW4gb25seSBjb252ZXJ0IHdoYXQgZ2VvanNvbiBjYW4gc3RvcmU6IHNpbXBsZSBmZWF0dXJlIHR5cGVzLCBub3RcbiBjb3ZlcmFnZSwgdG9wb2xvZ3ksIGV0Yy5cbiAqL1xuLyoqIEBwcml2YXRlKi9cbmZ1bmN0aW9uIGF0dHJzKGF0dHJNYXBwaW5ncyl7XG4gIGxldCByZXN1bHRzID0gJyc7XG4gIGZvciAobGV0IGF0dHJOYW1lIGluIGF0dHJNYXBwaW5ncyl7XG4gICAgbGV0IHZhbHVlID0gYXR0ck1hcHBpbmdzW2F0dHJOYW1lXTtcbiAgICByZXN1bHRzICs9ICh2YWx1ZSA/IGAgJHthdHRyTmFtZX09XCIke3ZhbHVlfVwiYCA6ICcnKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0cztcbn1cblxuLyoqXG4gKiBjaGVja3Mgb3V0ZXIgc2NvcGUgZm9yIGdtbElkIGFyZ3VtZW50L3ZhcmlhYmxlXG4gKiBAZnVuY3Rpb24gXG4gKi9cbmNvbnN0IGVuZm9yY2VHbWxJZCA9IChnbWxJZCkgPT57XG4gIGlmICghZ21sSWQpe1xuICAgIGNvbnNvbGUud2FybignTm8gZ21sSWQgc3VwcGxpZWQnKTtcbiAgfVxufTtcblxuLyoqXG4gKiBBIGhhbmRsZXIgdG8gY29tcGlsZSBnZW9tZXRyaWVzIHRvIG11bHRpZ2VvbWV0cmllc1xuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSB0aGUgbmFtZSBvZiB0aGUgdGFyZ2V0IG11bHRpZ2VvbWV0cnlcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZW1iZXJOYW1lIHRoZSBnbWw6dGFnIG9mIGVhY2ggbXVsdGlnZW9tZXRyeSBtZW1iZXIuXG4gKiBAcGFyYW0ge09iamVjdFtdfEFycmF5fSBnZW9tIGFuIGFycmF5IG9mIGdlb2pzb24gZ2VvbWV0cmllc1xuICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfSBnbWxJZCB0aGUgZ21sOmlkIG9mIHRoZSBtdWx0aWdlb21ldHJ5XG4gKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIG9wdGlvbmFsIHBhcmFtZXRlcnMuIE9taXQgZ21sSWRzIGF0IHlvdXIgb3duIHJpc2ssIGhvd2V2ZXIuXG4gKiBAcGFyYW0ge3N0cmluZ3x1bmRlZmluZWR9IHBhcmFtcy5zcnNOYW1lIGFzIHN0cmluZyBzcGVjaWZ5aW5nIFNSU1xuICogQHBhcmFtIHtudW1iZXJbXXxzdHJpbmdbXX0gcGFyYW1zLmdtbElkcyBhbiBhcnJheSBvZiBudW1iZXIvc3RyaW5nIGdtbDppZHMgb2YgdGhlIG1lbWJlciBnZW9tZXRyaWVzLlxuICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfHVuZGVmaW5lZH0gcGFyYW1zLnNyc0RpbWVuc2lvbiB0aGUgZGltZW5zaW9uYWxpdHkgb2YgZWFjaCBjb29yZGluYXRlLCBpLmUuIDIgb3IgMy5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IGEgc3RyaW5nIGNvbnRhaW5pbmcgZ21sIGRlc2NyaWJpbmcgdGhlIGlucHV0IG11bHRpZ2VvbWV0cnlcbiAqIEB0aHJvd3Mge0Vycm9yfSBpZiBhIG1lbWJlciBnZW9tZXRyeSBjYW5ub3QgYmUgY29udmVydGVkIHRvIGdtbFxuICovXG5mdW5jdGlvbiBtdWx0aShuYW1lLCBtZW1iZXJOYW1lLCBtZW1iZXJjYiwgZ2VvbSwgZ21sSWQsIHBhcmFtcz17fSl7XG4gIGVuZm9yY2VHbWxJZChnbWxJZCk7XG4gIHZhciB7c3JzTmFtZSwgZ21sSWRzfSA9IHBhcmFtcztcbiAgbGV0IG11bHRpID0gYDxnbWw6JHtuYW1lfSR7YXR0cnMoe3Nyc05hbWUsICdnbWw6aWQnOmdtbElkfSl9PmA7XG4gIGdlb20uZm9yRWFjaChmdW5jdGlvbihtZW1iZXIsIGkpe1xuICAgIG11bHRpICs9IGA8Z21sOiR7bWVtYmVyTmFtZX0+YDtcbiAgICBsZXQgX2dtbElkID0gbWVtYmVyLmlkIHx8IChnbWxJZHMgfHwgW10pW2ldIHx8ICcnO1xuICAgIGlmIChuYW1lID09ICdNdWx0aUdlb21ldHJ5Jyl7XG4gICAgICBsZXQgbWVtYmVyVHlwZSA9IG1lbWJlci50eXBlO1xuICAgICAgbWVtYmVyID0gbWVtYmVyLmNvb3JkaW5hdGVzO1xuICAgICAgbXVsdGkgKz0gbWVtYmVyY2JbbWVtYmVyVHlwZV0obWVtYmVyLCBfZ21sSWQsIHBhcmFtcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG11bHRpICs9IG1lbWJlcmNiKG1lbWJlciwgX2dtbElkLCBwYXJhbXMpO1xuICAgIH1cbiAgICBtdWx0aSArPSBgPC9nbWw6JHttZW1iZXJOYW1lfT5gO1xuICB9KTtcbiAgcmV0dXJuIG11bHRpICsgYDwvZ21sOiR7bmFtZX0+YDtcbn1cbi8qKlxuICogQ29udmVydHMgYW4gaW5wdXQgZ2VvanNvbiBQb2ludCBnZW9tZXRyeSB0byBnbWxcbiAqIEBmdW5jdGlvbiBcbiAqIEBwYXJhbSB7bnVtYmVyW119IGNvb3JkcyB0aGUgY29vcmRpbmF0ZXMgbWVtYmVyIG9mIHRoZSBnZW9qc29uIGdlb21ldHJ5XG4gKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ9IGdtbElkIHRoZSBnbWw6aWRcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbXMgb3B0aW9uYWwgcGFyYW1ldGVyc1xuICogQHBhcmFtIHtzdHJpbmd8dW5kZWZpbmVkfSBwYXJhbXMuc3JzTmFtZSBhcyBzdHJpbmcgc3BlY2lmeWluZyBTUlNcbiAqIEBwYXJhbSB7bnVtYmVyfHN0cmluZ3x1bmRlZmluZWR9IHBhcmFtcy5zcnNEaW1lbnNpb24gdGhlIGRpbWVuc2lvbmFsaXR5IG9mIGVhY2ggY29vcmRpbmF0ZSwgaS5lLiAyIG9yIDMuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBhIHN0cmluZyBjb250YWluaW5nIGdtbCByZXByZXNlbnRpbmcgdGhlIGlucHV0IGdlb21ldHJ5XG4gKi9cbmZ1bmN0aW9uIFBvaW50KGNvb3JkcywgZ21sSWQsIHBhcmFtcz17fSl7XG4gIGVuZm9yY2VHbWxJZChnbWxJZCk7XG4gIHZhciB7c3JzTmFtZTpzcnNOYW1lLCBzcnNEaW1lbnNpb246c3JzRGltZW5zaW9ufSA9IHBhcmFtcztcbiAgcmV0dXJuIGA8Z21sOlBvaW50JHthdHRycyh7c3JzTmFtZTpzcnNOYW1lLCAnZ21sOmlkJzogZ21sSWR9KX0+YCArXG4gICAgYDxnbWw6cG9zJHthdHRycyh7c3JzRGltZW5zaW9ufSl9PmAgK1xuICAgIGNvb3Jkcy5yZXZlcnNlKCkuam9pbignICcpICtcbiAgICAnPC9nbWw6cG9zPicgK1xuICAgICc8L2dtbDpQb2ludD4nO1xufVxuLyoqXG4gKiBDb252ZXJ0cyBhbiBpbnB1dCBnZW9qc29uIExpbmVTdHJpbmcgZ2VvbWV0cnkgdG8gZ21sXG4gKiBAZnVuY3Rpb24gXG4gKiBAcGFyYW0ge251bWJlcltdW119IGNvb3JkcyB0aGUgY29vcmRpbmF0ZXMgbWVtYmVyIG9mIHRoZSBnZW9qc29uIGdlb21ldHJ5XG4gKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ9IGdtbElkIHRoZSBnbWw6aWRcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbXMgb3B0aW9uYWwgcGFyYW1ldGVyc1xuICogQHBhcmFtIHtzdHJpbmd8dW5kZWZpbmVkfSBwYXJhbXMuc3JzTmFtZSBhcyBzdHJpbmcgc3BlY2lmeWluZyBTUlNcbiAqIEBwYXJhbSB7bnVtYmVyfHN0cmluZ3x1bmRlZmluZWR9IHBhcmFtcy5zcnNEaW1lbnNpb24gdGhlIGRpbWVuc2lvbmFsaXR5IG9mIGVhY2ggY29vcmRpbmF0ZSwgaS5lLiAyIG9yIDMuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBhIHN0cmluZyBjb250YWluaW5nIGdtbCByZXByZXNlbnRpbmcgdGhlIGlucHV0IGdlb21ldHJ5XG4gKi9cbmZ1bmN0aW9uIExpbmVTdHJpbmcoY29vcmRzLCBnbWxJZCwgcGFyYW1zPXt9KXtcbiAgZW5mb3JjZUdtbElkKGdtbElkKTtcbiAgdmFyIHtzcnNOYW1lOnNyc05hbWUsIHNyc0RpbWVuc2lvbjpzcnNEaW1lbnNpb259ID0gcGFyYW1zO1xuICByZXR1cm4gYDxnbWw6TGluZVN0cmluZyR7YXR0cnMoe3Nyc05hbWUsICdnbWw6aWQnOmdtbElkfSl9PmAgK1xuICAgIGA8Z21sOnBvc0xpc3Qke2F0dHJzKHtzcnNEaW1lbnNpb259KX0+YCArXG4gICAgY29vcmRzLm1hcCgoZSk9PmUucmV2ZXJzZSgpLmpvaW4oJyAnKSkuam9pbignICcpICsgXG4gICAgJzwvZ21sOnBvc0xpc3Q+JyArXG4gICAgJzwvZ21sOkxpbmVTdHJpbmc+Jztcbn1cbi8qKlxuICogQ29udmVydHMgYW4gaW5wdXQgZ2VvanNvbiBMaW5lYXJSaW5nIG1lbWJlciBvZiBhIHBvbHlnb24gZ2VvbWV0cnkgdG8gZ21sXG4gKiBAZnVuY3Rpb24gXG4gKiBAcGFyYW0ge251bWJlcltdW119IGNvb3JkcyB0aGUgY29vcmRpbmF0ZXMgbWVtYmVyIG9mIHRoZSBnZW9qc29uIGdlb21ldHJ5XG4gKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ9IGdtbElkIHRoZSBnbWw6aWRcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbXMgb3B0aW9uYWwgcGFyYW1ldGVyc1xuICogQHBhcmFtIHtzdHJpbmd8dW5kZWZpbmVkfSBwYXJhbXMuc3JzTmFtZSBhcyBzdHJpbmcgc3BlY2lmeWluZyBTUlNcbiAqIEBwYXJhbSB7bnVtYmVyfHN0cmluZ3x1bmRlZmluZWR9IHBhcmFtcy5zcnNEaW1lbnNpb24gdGhlIGRpbWVuc2lvbmFsaXR5IG9mIGVhY2ggY29vcmRpbmF0ZSwgaS5lLiAyIG9yIDMuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBhIHN0cmluZyBjb250YWluaW5nIGdtbCByZXByZXNlbnRpbmcgdGhlIGlucHV0IGdlb21ldHJ5XG4gKi9cbmZ1bmN0aW9uIExpbmVhclJpbmcoY29vcmRzLCBnbWxJZCwgcGFyYW1zPXt9KXtcbiAgZW5mb3JjZUdtbElkKGdtbElkKTtcbiAgdmFyIHtzcnNOYW1lOnNyc05hbWUsIHNyc0RpbWVuc2lvbjpzcnNEaW1lbnNpb259ID0gcGFyYW1zO1xuICByZXR1cm4gYDxnbWw6TGluZWFyUmluZyR7YXR0cnMoeydnbWw6aWQnOmdtbElkLCBzcnNOYW1lfSl9PmAgK1xuICAgIGA8Z21sOnBvc0xpc3Qke2F0dHJzKHtzcnNEaW1lbnNpb259KX0+YCArXG4gICAgY29vcmRzLm1hcCgoZSk9PmUucmV2ZXJzZSgpLmpvaW4oJyAnKSkuam9pbignICcpICsgXG4gICAgJzwvZ21sOnBvc0xpc3Q+JyArIFxuICAgICc8L2dtbDpMaW5lYXJSaW5nPic7XG59XG4vKipcbiAqIENvbnZlcnRzIGFuIGlucHV0IGdlb2pzb24gUG9seWdvbiBnZW9tZXRyeSB0byBnbWxcbiAqIEBmdW5jdGlvbiBcbiAqIEBwYXJhbSB7bnVtYmVyW11bXVtdfSBjb29yZHMgdGhlIGNvb3JkaW5hdGVzIG1lbWJlciBvZiB0aGUgZ2VvanNvbiBnZW9tZXRyeVxuICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfSBnbWxJZCB0aGUgZ21sOmlkXG4gKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIG9wdGlvbmFsIHBhcmFtZXRlcnNcbiAqIEBwYXJhbSB7c3RyaW5nfHVuZGVmaW5lZH0gcGFyYW1zLnNyc05hbWUgYXMgc3RyaW5nIHNwZWNpZnlpbmcgU1JTXG4gKiBAcGFyYW0ge251bWJlcnxzdHJpbmd8dW5kZWZpbmVkfSBwYXJhbXMuc3JzRGltZW5zaW9uIHRoZSBkaW1lbnNpb25hbGl0eSBvZiBlYWNoIGNvb3JkaW5hdGUsIGkuZS4gMiBvciAzLlxuICogQHJldHVybnMge3N0cmluZ30gYSBzdHJpbmcgY29udGFpbmluZyBnbWwgcmVwcmVzZW50aW5nIHRoZSBpbnB1dCBnZW9tZXRyeVxuICovXG5mdW5jdGlvbiBQb2x5Z29uKGNvb3JkcywgZ21sSWQsIHBhcmFtcz17fSl7XG4gIGVuZm9yY2VHbWxJZChnbWxJZCk7XG4gIC8vIGdlb20uY29vcmRpbmF0ZXMgYXJlIGFycmF5cyBvZiBMaW5lYXJSaW5nc1xuICB2YXIge3Nyc05hbWV9ID0gcGFyYW1zO1xuICBsZXQgcG9seWdvbiA9IGA8Z21sOlBvbHlnb24ke2F0dHJzKHtzcnNOYW1lLCAnZ21sOmlkJzpnbWxJZH0pfT5gICtcbiAgICAgICAgJzxnbWw6ZXh0ZXJpb3I+JyArXG4gICAgICAgIExpbmVhclJpbmcoY29vcmRzWzBdKSArXG4gICAgICAgICc8L2dtbDpleHRlcmlvcj4nO1xuICBpZiAoY29vcmRzLmxlbmd0aCA+PSAyKXtcbiAgICBmb3IgKGxldCBsaW5lYXJSaW5nIG9mIGNvb3Jkcy5zbGljZSgxKSl7XG4gICAgICBwb2x5Z29uICs9ICc8Z21sOmludGVyaW9yPicgK1xuICAgICAgICBMaW5lYXJSaW5nKGxpbmVhclJpbmcpICsgXG4gICAgICAgICc8L2dtbDppbnRlcmlvcj4nO1xuICAgIH1cbiAgfVxuICBwb2x5Z29uICs9ICc8L2dtbDpQb2x5Z29uPic7XG4gIHJldHVybiBwb2x5Z29uO1xufVxuLyoqXG4gKiBDb252ZXJ0cyBhbiBpbnB1dCBnZW9qc29uIE11bHRpUG9pbnQgZ2VvbWV0cnkgdG8gZ21sXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7bnVtYmVyW11bXX0gY29vcmRzIHRoZSBjb29yZGluYXRlcyBtZW1iZXIgb2YgdGhlIGdlb2pzb24gZ2VvbWV0cnlcbiAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcn0gZ21sSWQgdGhlIGdtbDppZFxuICogQHBhcmFtIHtPYmplY3R9IHBhcmFtcyBvcHRpb25hbCBwYXJhbWV0ZXJzXG4gKiBAcGFyYW0ge3N0cmluZ3x1bmRlZmluZWR9IHBhcmFtcy5zcnNOYW1lIGFzIHN0cmluZyBzcGVjaWZ5aW5nIFNSU1xuICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfHVuZGVmaW5lZH0gcGFyYW1zLnNyc0RpbWVuc2lvbiB0aGUgZGltZW5zaW9uYWxpdHkgb2YgZWFjaCBjb29yZGluYXRlLCBpLmUuIDIgb3IgMy5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IGEgc3RyaW5nIGNvbnRhaW5pbmcgZ21sIHJlcHJlc2VudGluZyB0aGUgaW5wdXQgZ2VvbWV0cnlcbiAqL1xuZnVuY3Rpb24gTXVsdGlQb2ludChjb29yZHMsIGdtbElkLCBwYXJhbXM9e30pe1xuICBlbmZvcmNlR21sSWQoZ21sSWQpO1xuICByZXR1cm4gbXVsdGkoJ011bHRpUG9pbnQnLCAncG9pbnRNZW1iZXInLCBQb2ludCwgY29vcmRzLCBnbWxJZCwgcGFyYW1zKTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyBhbiBpbnB1dCBnZW9qc29uIE11bHRpTGluZVN0cmluZyBnZW9tZXRyeSB0byBnbWxcbiAqIEBmdW5jdGlvbiBcbiAqIEBwYXJhbSB7bnVtYmVyW11bXVtdfSBjb29yZHMgdGhlIGNvb3JkaW5hdGVzIG1lbWJlciBvZiB0aGUgZ2VvanNvbiBnZW9tZXRyeVxuICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfSBnbWxJZCB0aGUgZ21sOmlkXG4gKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIG9wdGlvbmFsIHBhcmFtZXRlcnNcbiAqIEBwYXJhbSB7c3RyaW5nfHVuZGVmaW5lZH0gcGFyYW1zLnNyc05hbWUgYXMgc3RyaW5nIHNwZWNpZnlpbmcgU1JTXG4gKiBAcGFyYW0ge251bWJlcnxzdHJpbmd8dW5kZWZpbmVkfSBwYXJhbXMuc3JzRGltZW5zaW9uIHRoZSBkaW1lbnNpb25hbGl0eSBvZiBlYWNoIGNvb3JkaW5hdGUsIGkuZS4gMiBvciAzLlxuICogQHJldHVybnMge3N0cmluZ30gYSBzdHJpbmcgY29udGFpbmluZyBnbWwgcmVwcmVzZW50aW5nIHRoZSBpbnB1dCBnZW9tZXRyeVxuICovXG5mdW5jdGlvbiBNdWx0aUxpbmVTdHJpbmcoY29vcmRzLCBnbWxJZCwgcGFyYW1zPXt9KXtcbiAgcmV0dXJuIG11bHRpKCdNdWx0aUN1cnZlJywgJ2N1cnZlTWVtYmVyJywgTGluZVN0cmluZywgY29vcmRzLCBnbWxJZCwgcGFyYW1zKTtcbn1cbi8qKlxuICogQ29udmVydHMgYW4gaW5wdXQgZ2VvanNvbiBNdWx0aVBvbHlnb24gZ2VvbWV0cnkgdG8gZ21sXG4gKiBAZnVuY3Rpb24gXG4gKiBAcGFyYW0ge251bWJlcltdW11bXVtdfSBjb29yZHMgdGhlIGNvb3JkaW5hdGVzIG1lbWJlciBvZiB0aGUgZ2VvanNvbiBnZW9tZXRyeVxuICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfSBnbWxJZCB0aGUgZ21sOmlkXG4gKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIG9wdGlvbmFsIHBhcmFtZXRlcnNcbiAqIEBwYXJhbSB7c3RyaW5nfHVuZGVmaW5lZH0gcGFyYW1zLnNyc05hbWUgYXMgc3RyaW5nIHNwZWNpZnlpbmcgU1JTXG4gKiBAcGFyYW0ge251bWJlcnxzdHJpbmd8dW5kZWZpbmVkfSBwYXJhbXMuc3JzRGltZW5zaW9uIHRoZSBkaW1lbnNpb25hbGl0eSBvZiBlYWNoIGNvb3JkaW5hdGUsIGkuZS4gMiBvciAzLlxuICogQHJldHVybnMge3N0cmluZ30gYSBzdHJpbmcgY29udGFpbmluZyBnbWwgcmVwcmVzZW50aW5nIHRoZSBpbnB1dCBnZW9tZXRyeVxuICovXG5mdW5jdGlvbiBNdWx0aVBvbHlnb24oY29vcmRzLCBnbWxJZCwgcGFyYW1zPXt9KXtcbiAgcmV0dXJuIG11bHRpKCdNdWx0aVN1cmZhY2UnLCAnc3VyZmFjZU1lbWJlcicsIFBvbHlnb24sIGNvb3JkcywgZ21sSWQsIHBhcmFtcyk7XG59XG4vKiogQGNvbnN0IFxuICogQGRlc2MgYSBuYW1lc3BhY2UgdG8gc3dpdGNoIGJldHdlZW4gZ2VvanNvbi1oYW5kbGluZyBmdW5jdGlvbnMgYnkgZ2VvanNvbi50eXBlXG4gKi9cbmNvbnN0IGNvbnZlcnRlciA9IHtcbiAgUG9pbnQsIExpbmVTdHJpbmcsIExpbmVhclJpbmcsIFBvbHlnb24sIE11bHRpUG9pbnQsIE11bHRpTGluZVN0cmluZyxcbiAgTXVsdGlQb2x5Z29uLCBHZW9tZXRyeUNvbGxlY3Rpb25cbn07XG4vKipcbiAqIENvbnZlcnRzIGFuIGlucHV0IGdlb2pzb24gR2VvbWV0cnlDb2xsZWN0aW9uIGdlb21ldHJ5IHRvIGdtbFxuICogQGZ1bmN0aW9uIFxuICogQHBhcmFtIHtPYmplY3RbXX0gY29vcmRzIHRoZSBjb29yZGluYXRlcyBtZW1iZXIgb2YgdGhlIGdlb2pzb24gZ2VvbWV0cnlcbiAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcn0gZ21sSWQgdGhlIGdtbDppZFxuICogQHBhcmFtIHtPYmplY3R9IHBhcmFtcyBvcHRpb25hbCBwYXJhbWV0ZXJzXG4gKiBAcGFyYW0ge3N0cmluZ3x1bmRlZmluZWR9IHBhcmFtcy5zcnNOYW1lIGFzIHN0cmluZyBzcGVjaWZ5aW5nIFNSU1xuICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfHVuZGVmaW5lZH0gcGFyYW1zLnNyc0RpbWVuc2lvbiB0aGUgZGltZW5zaW9uYWxpdHkgb2YgZWFjaCBjb29yZGluYXRlLCBpLmUuIDIgb3IgMy5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IGEgc3RyaW5nIGNvbnRhaW5pbmcgZ21sIHJlcHJlc2VudGluZyB0aGUgaW5wdXQgZ2VvbWV0cnlcbiAqL1xuZnVuY3Rpb24gR2VvbWV0cnlDb2xsZWN0aW9uKGdlb21zLCBnbWxJZCwgcGFyYW1zPXt9KXtcbiAgcmV0dXJuIG11bHRpKCdNdWx0aUdlb21ldHJ5JywgJ2dlb21ldHJ5TWVtYmVyJywgY29udmVydGVyLFxuICAgICAgICAgICAgICAgZ2VvbXMsIGdtbElkLCBwYXJhbXMpO1xufVxuXG4vKipcbiAqIFRyYW5zbGF0ZXMgYW55IGdlb2pzb24gZ2VvbWV0cnkgaW50byBHTUwgMy4yLjFcbiAqIEBwdWJsaWMgXG4gKiBAZnVuY3Rpb24gXG4gKiBAcGFyYW0ge09iamVjdH0gZ2VvbSBhIGdlb2pzb24gZ2VvbWV0cnkgb2JqZWN0XG4gKiBAcGFyYW0ge0FycmF5fHVuZGVmaW5lZH0gZ2VvbS5jb29yZGluYXRlcyB0aGUgbmVzdGVkIGFycmF5IG9mIGNvb3JkaW5hdGVzIGZvcm1pbmcgdGhlIGdlb21ldHJ5XG4gKiBAcGFyYW0ge09iamVjdFtdfHVuZGVmaW5lZH0gZ2VvbS5nZW9tZXRyaWVzIGZvciBhIEdlb21ldHJ5Q29sbGVjdGlvbiBvbmx5LCB0aGUgYXJyYXkgb2YgbWVtYmVyIGdlb21ldHJ5IG9iamVjdHNcbiAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcn0gZ21sSWQgdGhlIGdtbDppZCBvZiB0aGUgZ2VvbWV0cnlcbiAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXMgb3B0aW9uYWwgcGFyYW1ldGVyc1xuICogQHBhcmFtIHtzdHJpbmd8dW5kZWZpbmVkfSBwYXJhbXMuc3JzTmFtZSBhIHN0cmluZyBzcGVjaWZ5aW5nIHRoZSBTUlNcbiAqIEBwYXJhbSB7c3RyaW5nfHVuZGVmaW5lZH0gcGFyYW1zLnNyc0RpbWVuc2lvbiB0aGUgZGltZW5zaW9uYWxpdHkgb2YgZWFjaCBjb29yZGluYXRlLCBpLmUuIDIgb3IgMy5cbiAqIEBwYXJhbSB7bnVtYmVyW118c3RyaW5nW118dW5kZWZpbmVkfSBnbWxJZHMgIGFuIGFycmF5IG9mIG51bWJlci9zdHJpbmcgZ21sOmlkcyBvZiB0aGUgbWVtYmVyIGdlb21ldHJpZXMgb2YgYSBtdWx0aWdlb21ldHJ5LlxuICogQHJldHVybnMge3N0cmluZ30gYSB2YWxpZCBnbWwgc3RyaW5nIGRlc2NyaWJpbmcgdGhlIGlucHV0IGdlb2pzb24gZ2VvbWV0cnlcbiAqL1xuZnVuY3Rpb24gZ2VvbVRvR21sKGdlb20sIGdtbElkLCBwYXJhbXMpe1xuICByZXR1cm4gY29udmVydGVyW2dlb20udHlwZV0oXG4gICAgZ2VvbS5jb29yZGluYXRlcyB8fCBnZW9tLmdlb21ldHJpZXMsXG4gICAgZ21sSWQsXG4gICAgcGFyYW1zXG4gICk7XG59XG5leHBvcnQge1xuICBnZW9tVG9HbWwsIGNvbnZlcnRlciwgUG9pbnQsIExpbmVTdHJpbmcsIExpbmVhclJpbmcsXG4gIFBvbHlnb24sIE11bHRpUG9pbnQsIE11bHRpTGluZVN0cmluZywgTXVsdGlQb2x5Z29uXG59O1xuIiwiaW1wb3J0IHtnZW9tVG9HbWwgYXMgZ21sM30gZnJvbSAnZ2VvanNvbi10by1nbWwtMyc7XG5cbi8qKiBAY29uc3Qge09iamVjdH0geG1sICovXG5jb25zdCB4bWwgPSB7XG4gIC8qKlxuICAgKiBUdXJucyBhbiBvYmplY3QgaW50byBhIHN0cmluZyBvZiB4bWwgYXR0cmlidXRlIGtleS12YWx1ZSBwYWlycy5cbiAgICogQG1lbWJlck9mIHhtbC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBhdHRycyBhbiBvYmplY3QgbWFwcGluZyBhdHRyaWJ1dGUgbmFtZXMgdG8gYXR0cmlidXRlIHZhbHVlc1xuICAgKiBAcmV0dXJucyB7c3RyaW5nfSBhIHN0cmluZyBvZiB4bWwgYXR0cmlidXRlIGtleS12YWx1ZSBwYWlyc1xuICAgKi9cbiAgJ2F0dHJzJzogZnVuY3Rpb24oYXR0cnMpe1xuICAgIHJldHVybiBPYmplY3Qua2V5cyhhdHRycylcbiAgICAgIC5tYXAoKGEpID0+IGF0dHJzW2FdID8gYCAke2F9PVwiJHthdHRyc1thXX1cImAgOiAnJylcbiAgICAgIC5qb2luKCcnKTtcbiAgfSxcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBzdHJpbmcgeG1sIHRhZy5cbiAgICogQGZ1bmN0aW9uIFxuICAgKiBAbWVtYmVyT2YgeG1sLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbnMgdGhlIHRhZydzIHhtbCBuYW1lc3BhY2UgYWJicmV2aWF0aW9uLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGFnTmFtZSB0aGUgdGFnIG5hbWUuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBhdHRycyBAc2VlIHhtbC5hdHRycy5cbiAgICogQHBhcmFtIHtzdHJpbmd9IGlubmVyIGlubmVyIHhtbC5cbiAgICogQHJldHVybnMge3N0cmluZ30gYW4geG1sIHN0cmluZy5cbiAgICovXG4gICd0YWcnOiBmdW5jdGlvbihucywgdGFnTmFtZSwgYXR0cnMsIGlubmVyKXsgLy8gVE9ETzogc2VsZi1jbG9zaW5nXG4gICAgbGV0IHRhZyA9IChucyA/IGAke25zfTpgIDogJycpICsgdGFnTmFtZTtcbiAgICBpZiAodGFnTmFtZSl7XG4gICAgICByZXR1cm4gYDwke3RhZ30ke3RoaXMuYXR0cnMoYXR0cnMpfT4ke2lubmVyfTwvJHt0YWd9PmA7ICAgXG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignbm8gdGFnIHN1cHBsaWVkICcgKyBKU09OLnN0cmluZ2lmeShhcmd1bWVudHMpKTtcbiAgICB9XG4gIH1cbn07XG4vKipcbiAqIFNob3J0aGFuZCBmb3IgY3JlYXRpbmcgYSB3ZnMgeG1sIHRhZy5cbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWdOYW1lIGEgdmFsaWQgd2ZzIHRhZyBuYW1lLlxuICogQHBhcmFtIHtPYmplY3R9IGF0dHJzIEBzZWUgeG1sLmF0dHJzLlxuICogQHBhcmFtIHtzdHJpbmd9IGlubmVyIEBzZWUgeG1sLnRhZy5cbiAqL1xuY29uc3Qgd2ZzID0gKHRhZ05hbWUsIGF0dHJzLCBpbm5lcikgPT4geG1sLnRhZygnd2ZzJywgdGFnTmFtZSwgYXR0cnMsIGlubmVyKTtcbi8qKlxuICogRW5zdXJlcyB0aGUgcmVzdWx0IGlzIGFuIGFycmF5LlxuICogQHBhcmFtIHtBcnJheXxPYmplY3R9IG1heWJlIGEgR2VvSlNPTiBGZWF0dXJlIG9yIEZlYXR1cmVDb2xsZWN0aW9uIG9iamVjdCBvciBhbiBhcnJheSB0aGVyZW9mLlxuICovXG5jb25zdCBlbnN1cmVBcnJheSA9ICguLi5tYXliZSk9PiAobWF5YmVbMF0uZmVhdHVyZXMgfHwgW10uY29uY2F0KC4uLm1heWJlKSlcblx0LmZpbHRlcigoZikgPT4gZik7XG4vKipcbiAqIEVuc3VyZXMgYSBsYXllci5pZCBmb3JtYXQgb2YgYW4gaW5wdXQgaWQuXG4gKiBAcGFyYW0ge3N0cmluZ30gbHlyIGxheWVyIG5hbWVcbiAqIEBwYXJhbSB7c3RyaW5nfSBpZCBpZCwgcG9zc2libHkgYWxyZWFkeSBpbiBjb3JyZWN0IGxheWVyLmlkIGZvcm1hdC5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IGEgY29ycmVjdGx5LWZvcm1hdHRlZCBnbWw6aWRcbiAqL1xuY29uc3QgZW5zdXJlSWQgPSAobHlyLCBpZCkgPT4gL1xcLi8uZXhlYyhpZCB8fCAnJykgPyBpZCA6YCR7bHlyfS4ke2lkfWA7XG4vKipcbiAqIHJldHVybnMgYSBjb3JyZWN0bHktZm9ybWF0dGVkIHR5cGVOYW1lXG4gKiBAcGFyYW0ge3N0cmluZ30gbnMgbmFtZXNwYWNlXG4gKiBAcGFyYW0ge3N0cmluZ30gbGF5ZXIgbGF5ZXIgbmFtZVxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGVOYW1lIHR5cGVOYW1lIHRvIGNoZWNrXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBhIGNvcnJlY3RseS1mb3JtYXR0ZWQgdHlwZU5hbWVcbiAqIEB0aHJvd3Mge0Vycm9yfSBpZiB0eXBlTmFtZSBpdCBjYW5ub3QgZm9ybSBhIHR5cGVOYW1lIGZyb20gbnMgYW5kIGxheWVyXG4gKi9cbmNvbnN0IGVuc3VyZVR5cGVOYW1lID0gKG5zLCBsYXllciwgdHlwZU5hbWUpID0+e1xuICBpZiAoIXR5cGVOYW1lICYmICEobnMgJiYgbGF5ZXIpKXtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYG5vIHR5cGVuYW1lIHBvc3NpYmxlOiAke0pTT04uc3RyaW5naWZ5KHt0eXBlTmFtZSwgbnMsIGxheWVyfSl9YCk7XG4gIH1cbiAgcmV0dXJuIHR5cGVOYW1lIHx8IGAke25zfToke2xheWVyfVR5cGVgO1xufTtcblxuLyoqXG4gKiBTdGFuZHMgaW4gZm9yIG90aGVyIGZ1bmN0aW9ucyBpbiBzd2ljaCBzdGF0ZW1lbnRzLCBldGMuIERvZXMgbm90aGluZy5cbiAqIEBmdW5jdGlvbiBcbiAqL1xuY29uc3QgcGFzcyA9ICgpID0+ICcnO1xuXG4vKipcbiAqIEl0ZXJhdGVzIG92ZXIgdGhlIGtleS12YWx1ZSBwYWlycywgZmlsdGVyaW5nIGJ5IGEgd2hpdGVsaXN0IGlmIGF2YWlsYWJsZS5cbiAqIEBwYXJhbSB7QXJyYXk8c3RyaW5nPn0gd2hpdGVsaXN0IGEgd2hpdGVsaXN0IG9mIHByb3BlcnR5IG5hbWVzXG4gKiBAcGFyYW0ge09iamVjdH0gcHJvcGVydGllcyBhbiBvYmplY3QgbWFwcGluZyBwcm9wZXJ0eSBuYW1lcyB0byB2YWx1ZXNcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNiIGEgZnVuY3Rpb24gdG8gY2FsbCBvbiBlYWNoICh3aGl0ZWxpc3RlZCBrZXksIHZhbHVlKSBwYWlyXG4gKi9cbmNvbnN0IHVzZVdoaXRlbGlzdElmQXZhaWxhYmxlID0gKHdoaXRlbGlzdCwgcHJvcGVydGllcywgY2IpID0+e1xuICBmb3IgKGxldCBwcm9wIG9mIHdoaXRlbGlzdCB8fCBPYmplY3Qua2V5cyhwcm9wZXJ0aWVzKSl7XG4gICAgcHJvcGVydGllc1twcm9wXSA/IGNiKHByb3AsIHByb3BlcnRpZXNbcHJvcF0pIDogcGFzcygpO1xuICB9XG59O1xuLyoqXG4gKiBDcmVhdGVzIGEgZmVzOlJlc291cmNlSWQgZmlsdGVyIGZyb20gYSBsYXllcm5hbWUgYW5kIGlkXG4gKiBAcGFyYW0ge3N0cmluZ30gbHlyIGxheWVyIG5hbWUgb2YgdGhlIGZpbHRlcmVkIGZlYXR1cmVcbiAqIEBwYXJhbSB7c3RyaW5nfSBpZCBmZWF0dXJlIGlkXG4gKi9cbmNvbnN0IGlkRmlsdGVyID0gKGx5ciwgaWQpID0+IGA8ZmVzOlJlc291cmNlSWQgcmlkPVwiJHtlbnN1cmVJZChseXIsIGlkKX1cIi8+YDtcblxuY29uc3QgdW5wYWNrID0gKCgpPT57XG4gIGxldCBmZWF0dXJlTWVtYmVycyA9IG5ldyBTZXQoWydwcm9wZXJ0aWVzJywgJ2dlb21ldHJ5JywgJ2lkJywgJ2xheWVyJ10pO1xuICAvKipcbiAgICogUmVzb2x2ZXMgYXR0cmlidXRlcyBmcm9tIGZlYXR1cmUsIHRoZW4gcGFyYW1zIHVubGVzcyB0aGV5IGFyZSBub3JtYWxseVxuICAgKiBmb3VuZCBpbiB0aGUgZmVhdHVyZVxuICAgKiBAcGFyYW0ge09iamVjdH0gZmVhdHVyZSBhIGdlb2pzb24gZmVhdHVyZVxuICAgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIGFuIG9iamVjdCBvZiBiYWNrdXAgLyBvdmVycmlkZSBwYXJhbWV0ZXJzXG4gICAqIEBwYXJhbSB7QXJyYXk8c3RyaW5nPn0gYXJncyBwYXJhbWV0ZXIgbmFtZXMgdG8gcmVzb2x2ZSBmcm9tIGZlYXR1cmUgb3IgcGFyYW1zXG4gICAqIEByZXR1cm5zIHtPYmplY3R9IGFuIG9iamVjdCBtYXBwaW5nIGVhY2ggbmFtZWQgcGFyYW1ldGVyIHRvIGl0cyByZXNvbHZlZCB2YWx1ZVxuICAgKi9cbiAgcmV0dXJuIChmZWF0dXJlLCBwYXJhbXMsIC4uLmFyZ3MpID0+IHtcbiAgICBsZXQgcmVzdWx0cyA9IHt9O1xuICAgIGZvciAobGV0IGFyZyBvZiBhcmdzKXtcbiAgICAgIGlmIChhcmcgPT09ICdsYXllcicpe1xuXHRyZXN1bHRzW2FyZ10gPSAocGFyYW1zLmxheWVyIHx8IHt9KS5pZCB8fCBwYXJhbXMubGF5ZXJcblx0ICB8fCAoZmVhdHVyZS5sYXllcnx8e30pLmlkIHx8IGZlYXR1cmUubGF5ZXIgfHwgJyc7XG4gICAgICB9IGVsc2UgaWYgKCFmZWF0dXJlTWVtYmVycy5oYXMoYXJnKSl7XG4gICAgICAgIHJlc3VsdHNbYXJnXSA9IGZlYXR1cmVbYXJnXSB8fCBwYXJhbXNbYXJnXSB8fCAnJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdHNbYXJnXSA9IHBhcmFtc1thcmddIHx8IGZlYXR1cmVbYXJnXSAgfHwgJyc7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHRzO1xuICB9O1xufSkoKTtcblxuLyoqXG4gKiBCdWlsZHMgYSBmaWx0ZXIgZnJvbSBmZWF0dXJlIGlkcyBpZiBvbmUgaXMgbm90IGFscmVhZHkgaW5wdXQuXG4gKiBAZnVuY3Rpb24gXG4gKiBAcGFyYW0ge3N0cmluZ3x1bmRlZmluZWR9IGZpbHRlciBhIHBvc3NpYmxlIHN0cmluZyBmaWx0ZXJcbiAqIEBwYXJhbSB7QXJyYXk8T2JqZWN0Pn0gZmVhdHVyZXMgYW4gYXJyYXkgb2YgZ2VvanNvbiBmZWF0dXJlIG9iamVjdHNcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbXMgYW4gb2JqZWN0IG9mIGJhY2t1cCAvIG92ZXJyaWRlIHBhcmFtZXRlcnNcbiAqIEByZXR1cm5zIHtzdHJpbmd9IEEgZmlsdGVyLCBvciB0aGUgaW5wdXQgZmlsdGVyIGlmIGl0IHdhcyBhIHN0cmluZy5cbiAqL1xuZnVuY3Rpb24gZW5zdXJlRmlsdGVyKGZpbHRlciwgZmVhdHVyZXMsIHBhcmFtcyl7XG4gIGlmICghZmlsdGVyKXtcbiAgICBmaWx0ZXIgPSAnJztcbiAgICBmb3IgKGxldCBmZWF0dXJlIG9mIGZlYXR1cmVzKXtcbiAgICAgIGxldCBsYXllciA9IHVucGFjayhmZWF0dXJlLCBwYXJhbXMpO1xuICAgICAgZmlsdGVyICs9IGlkRmlsdGVyKGxheWVyLCBmZWF0dXJlLmlkKTtcbiAgICB9XG4gICAgcmV0dXJuIGA8ZmVzOkZpbHRlcj4ke2ZpbHRlcn08L2ZlczpGaWx0ZXI+YDtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZmlsdGVyO1xuICB9XG59O1xuLy9odHRwOi8vZG9jcy5vcGVuZ2Vvc3BhdGlhbC5vcmcvaXMvMDktMDI1cjIvMDktMDI1cjIuaHRtbCMyODZcbi8qKlxuICogQ2hlY2tzIHRoZSB0eXBlIG9mIHRoZSBpbnB1dCBhY3Rpb25cbiAqIEBmdW5jdGlvbiBcbiAqIEBwYXJhbSB7c3RyaW5nIHwgdW5kZWZpbmVkfSBhY3Rpb24gXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gd2hldGhlciB0aGUgYWN0aW9uIGlzIGFsbG93ZWRcbiovXG5jb25zdCBlbnN1cmVBY3Rpb24gPSAoKCk9PntcbiAgY29uc3QgYWxsb3dlZCA9IG5ldyBTZXQoWydyZXBsYWNlJywgJ2luc2VydEJlZm9yZScsICdpbnNlcnRBZnRlcicsICdyZW1vdmUnXSk7XG4gIHJldHVybiAoYWN0aW9uKSA9PiBhbGxvd2VkLmhhcyhhY3Rpb24pO1xufSkoKTtcblxuLyoqXG4gKiBBbiBvYmplY3QgY29udGFpbmluZyBvcHRpb25hbCBuYW1lZCBwYXJhbWV0ZXJzLlxuICogQHR5cGVkZWYge09iamVjdH0gUGFyYW1zXG4gKiBAcHJvcCB7c3RyaW5nfHVuZGVmaW5lZH0gbnMgYW4geG1sIG5hbWVzcGFjZSBhbGlhcy5cbiAqIEBwcm9wIHtzdHJpbmd8T2JqZWN0fHVuZGVmaW5lZH0gbGF5ZXIgYSBzdHJpbmcgbGF5ZXIgbmFtZSBvciB7aWR9LCB3aGVyZSBpZFxuICogaXMgdGhlIGxheWVyIG5hbWVcbiAqIEBwcm9wIHtzdHJpbmd8dW5kZWZpbmVkfSBnZW9tZXRyeV9uYW1lIHRoZSBuYW1lIG9mIHRoZSBmZWF0dXJlIGdlb21ldHJ5IGZpZWxkLlxuICogQHByb3Age09iamVjdHx1bmRlZmluZWR9IHByb3BlcnRpZXMgYW4gb2JqZWN0IG1hcHBpbmcgZmVhdHVyZSBmaWVsZCBuYW1lcyB0byBmZWF0dXJlIHByb3BlcnRpZXNcbiAqIEBwcm9wIHtzdHJpbmd8dW5kZWZpbmVkfSBpZCBhIHN0cmluZyBmZWF0dXJlIGlkLlxuICogQHByb3Age3N0cmluZ1tdfHVuZGVmaW5lZH0gd2hpdGVsaXN0IGFuIGFycmF5IG9mIHN0cmluZyBmaWVsZCBuYW1lcyB0byBcbiAqIHVzZSBmcm9tIEBzZWUgUGFyYW1zLnByb3BlcnRpZXNcbiAqIEBwcm9wIHtzdHJpbmd8dW5kZWZpbmVkfSBpbnB1dEZvcm1hdCBpbnB1dEZvcm1hdCwgYXMgc3BlY2lmaWVkIGF0IFxuICogW09HQyAwOS0wMjVyMiDCpyA3LjYuNS40XXtAbGluayBodHRwOi8vZG9jcy5vcGVuZ2Vvc3BhdGlhbC5vcmcvaXMvMDktMDI1cjIvMDktMDI1cjIuaHRtbCM2NX0uXG4gKiBAcHJvcCB7c3RyaW5nfHVuZGVmaW5lZH0gc3JzTmFtZSBzcnNOYW1lLCBhcyBzcGVjaWZpZWQgYXQgXG4gKiBbT0dDIDA5LTAyNXIyIMKnIDcuNi41LjVde0BsaW5rIGh0dHA6Ly9kb2NzLm9wZW5nZW9zcGF0aWFsLm9yZy9pcy8wOS0wMjVyMi8wOS0wMjVyMi5odG1sIzY2fS5cbiAqIGlmIHVuZGVmaW5lZCwgdGhlIGdtbDMgbW9kdWxlIHdpbGwgZGVmYXVsdCB0byAnRVBTRzo0MzI2Jy5cbiAqIEBwcm9wIHtzdHJpbmd8dW5kZWZpbmVkfSBoYW5kbGUgaGFuZGxlIHBhcmFtZXRlciwgYXMgc3BlY2lmaWVkIGF0XG4gKiBbT0dDIDA5LTAyNXIyIMKnIDcuNi4yLjYgXXtAbGluayBodHRwOi8vZG9jcy5vcGVuZ2Vvc3BhdGlhbC5vcmcvaXMvMDktMDI1cjIvMDktMDI1cjIuaHRtbCM0NH1cbiAqIEBwcm9wIHtzdHJpbmd8dW5kZWZpbmVkfSBmaWx0ZXIgYSBzdHJpbmcgZmVzOkZpbHRlci5cbiAqIEBwcm9wIHtzdHJpbmd8dW5kZWZpbmVkfSB0eXBlTmFtZSBhIHN0cmluZyBzcGVjaWZ5aW5nIHRoZSBmZWF0dXJlIHR5cGUgd2l0aGluXG4gKiBpdHMgbmFtZXNwYWNlLiBTZWUgWzA5LTAyNXIyIMKnIDcuOS4yLjQuMV17QGxpbmsgaHR0cDovL2RvY3Mub3Blbmdlb3NwYXRpYWwub3JnL2lzLzA5LTAyNXIyLzA5LTAyNXIyLmh0bWwjOTB9LlxuICogQHByb3Age09iamVjdHx1bmRlZmluZWR9IHNjaGVtYUxvY2F0aW9ucyBhbiBvYmplY3QgbWFwcGluZyB1cmkgdG8gc2NoZW1hbG9jYXRpb25cbiAqIEBwcm9wIHtPYmplY3R8dW5kZWZpbmVkfSBuc0Fzc2lnbm1lbnRzIGFuIG9iamVjdCBtYXBwaW5nIG5zIHRvIHVyaVxuICovXG5cbi8qKlxuICogQSBHZW9KU09OIGZlYXR1cmUgd2l0aCB0aGUgZm9sbG93aW5nIG9wdGlvbmFsIGZvcmVpZ24gbWVtYmVycyAoc2VlIFxuICogW3JmYzc5NjUgwqcgNl17QGxpbmsgaHR0cHM6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzc5NDYjc2VjdGlvbi02fSkuXG4gKiBvciBhbiBvYmplY3Qgd2l0aCBzb21lIG9mIHRoZSBmb2xsb3dpbmcgbWVtYmVycy5cbiAqIE1lbWJlcnMgb2YgRmVhdHVyZSB3aWxsIGJlIHVzZWQgb3ZlciB0aG9zZSBpbiBQYXJhbXMgZXhjZXB0IGZvciBsYXllciwgaWQsXG4gKiBhbmQgcHJvcGVydGllcy5cbiAqIEB0eXBlZGVmIHtPYmplY3R9IEZlYXR1cmVcbiAqIEBleHRlbmRzIFBhcmFtc1xuICogQHByb3BlcnR5IHtPYmplY3R8dW5kZWZpbmVkfSBnZW9tZXRyeSBhIEdlb0pTT04gZ2VvbWV0cnkuXG4gKiBAcHJvcGVydHkge3N0cmluZ3x1bmRlZmluZWR9IHR5cGUgJ0ZlYXR1cmUnLlxuICogQGV4YW1wbGUgXG4gKiB7J2lkJzondGFzbWFuaWFfcm9hZHMuMScsICd0eXBlTmFtZSc6J3RvcHA6dGFzbWFuaWFfcm9hZHNUeXBlJ30gXG4gKiAvLyBjYW4gYmUgcGFzc2VkIHRvIERlbGV0ZVxuICovXG5cbi8qKlxuICogYSBHZW9KU09OIEZlYXR1cmVDb2xsZWN0aW9uIHdpdGggb3B0aW9uYWwgZm9yZWlnbiBtZW1iZXJzIGFzIGluIEZlYXR1cmUuXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBGZWF0dXJlQ29sbGVjdGlvblxuICogQGV4dGVuZHMgRmVhdHVyZVxuICogQHByb3BlcnR5IHtzdHJpbmd9IHR5cGUgJ0ZlYXR1cmVDb2xsZWN0aW9uJy5cbiAqIEBwcm9wZXJ0eSB7RmVhdHVyZVtdfSBmZWF0dXJlcyBhbiBhcnJheSBvZiBHZW9KU09OIEZlYXR1cmVzLlxuICovXG5cbi8qKlxuICogVHVybnMgYW4gYXJyYXkgb2YgZ2VvanNvbiBmZWF0dXJlcyBpbnRvIGdtbDpfZmVhdHVyZSBzdHJpbmdzIGRlc2NyaWJpbmcgdGhlbS5cbiAqIEBmdW5jdGlvbiBcbiAqIEBwYXJhbSB7RmVhdHVyZVtdfSBmZWF0dXJlcyBhbiBhcnJheSBvZiBmZWF0dXJlcyB0byB0cmFuc2xhdGUgdG8gXG4gKiBnbWw6X2ZlYXR1cmVzLlxuICogQHBhcmFtIHtQYXJhbXN9IHBhcmFtcyBhbiBvYmplY3Qgb2YgYmFja3VwIC8gb3ZlcnJpZGUgcGFyYW1ldGVycyBcbiAqIEByZXR1cm5zIHtzdHJpbmd9IGEgZ21sOl9mZWF0dXJlIHN0cmluZy5cbiAqL1xuZnVuY3Rpb24gdHJhbnNsYXRlRmVhdHVyZXMoZmVhdHVyZXMsIHBhcmFtcz17fSl7XG4gIGxldCBpbm5lciA9ICcnO1xuICBsZXQge3Nyc05hbWV9ID0gcGFyYW1zO1xuICBmb3IgKGxldCBmZWF0dXJlIG9mIGZlYXR1cmVzKXtcbiAgICAvL1RPRE86IGFkZCB3aGl0ZWxpc3Qgc3VwcG9ydFxuICAgIGxldCB7bnMsIGxheWVyLCBnZW9tZXRyeV9uYW1lLCBwcm9wZXJ0aWVzLCBpZCwgd2hpdGVsaXN0fSA9IHVucGFjayhcbiAgICAgIGZlYXR1cmUsIHBhcmFtcywgJ25zJywgJ2xheWVyJywgJ2dlb21ldHJ5X25hbWUnLCAncHJvcGVydGllcycsICdpZCcsICd3aGl0ZWxpc3QnXG4gICAgKTtcbiAgICBsZXQgZmllbGRzID0gJyc7XG4gICAgaWYgKGdlb21ldHJ5X25hbWUpe1xuICAgICAgZmllbGRzICs9IHhtbC50YWcoXG5cdG5zLCBnZW9tZXRyeV9uYW1lLCB7fSwgZ21sMyhmZWF0dXJlLmdlb21ldHJ5LCAnJywge3Nyc05hbWV9KVxuICAgICAgKTtcbiAgICB9XG4gICAgdXNlV2hpdGVsaXN0SWZBdmFpbGFibGUoXG4gICAgICB3aGl0ZWxpc3QsIHByb3BlcnRpZXMsXG4gICAgICAocHJvcCwgdmFsKT0+ZmllbGRzICs9IHhtbC50YWcobnMsIHByb3AsIHt9LCBwcm9wZXJ0aWVzW3Byb3BdKVxuICAgICk7XG4gICAgaW5uZXIgKz0geG1sLnRhZyhucywgbGF5ZXIsIHsnZ21sOmlkJzogZW5zdXJlSWQobGF5ZXIsIGlkKX0sIGZpZWxkcyk7XG4gIH1cbiAgcmV0dXJuIGlubmVyO1xufVxuXG4vKipcbiAqIFJldHVybnMgYSB3ZnM6SW5zZXJ0IHRhZyB3cmFwcGluZyBhIHRyYW5zbGF0ZWQgZmVhdHVyZVxuICogQGZ1bmN0aW9uIFxuICogQHBhcmFtIHtGZWF0dXJlW118RmVhdHVyZUNvbGxlY3Rpb258RmVhdHVyZX0gZmVhdHVyZXMgRmVhdHVyZShzKSB0byBwYXNzIHRvIEBzZWUgdHJhbnNsYXRlRmVhdHVyZXNcbiAqIEBwYXJhbSB7UGFyYW1zfSBwYXJhbXMgdG8gYmUgcGFzc2VkIHRvIEBzZWUgdHJhbnNsYXRlRmVhdHVyZXMsIHdpdGggb3B0aW9uYWxcbiAqIGlucHV0Rm9ybWF0LCBzcnNOYW1lLCBoYW5kbGUgZm9yIHRoZSB3ZnM6SW5zZXJ0IHRhZy5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IGEgd2ZzOkluc2VydCBzdHJpbmcuXG4gKi9cbmZ1bmN0aW9uIEluc2VydChmZWF0dXJlcywgcGFyYW1zPXt9KXtcbiAgZmVhdHVyZXMgPSBlbnN1cmVBcnJheShmZWF0dXJlcyk7XG4gIGxldCB7aW5wdXRGb3JtYXQsIHNyc05hbWUsIGhhbmRsZX0gPSBwYXJhbXM7XG4gIGlmICghZmVhdHVyZXMubGVuZ3RoKXtcbiAgICBjb25zb2xlLndhcm4oJ25vIGZlYXR1cmVzIHN1cHBsaWVkJyk7XG4gICAgcmV0dXJuICcnO1xuICB9XG4gIGxldCB0b0luc2VydCA9IHRyYW5zbGF0ZUZlYXR1cmVzKGZlYXR1cmVzLCBwYXJhbXMpO1xuICByZXR1cm4geG1sLnRhZygnd2ZzJywgJ0luc2VydCcsIHtpbnB1dEZvcm1hdCwgc3JzTmFtZSwgaGFuZGxlfSwgdG9JbnNlcnQpO1xufVxuXG4vKipcbiAqIFVwZGF0ZXMgdGhlIGlucHV0IGZlYXR1cmVzIGluIGJ1bGsgd2l0aCBwYXJhbXMucHJvcGVydGllcyBvciBieSBpZC5cbiAqIEBwYXJhbSB7RmVhdHVyZVtdfEZlYXR1cmVDb2xsZWN0aW9ufSBmZWF0dXJlcyBmZWF0dXJlcyB0byB1cGRhdGUuICBUaGVzZSBtYXkgXG4gKiBwYXNzIGluIGdlb21ldHJ5X25hbWUsIHByb3BlcnRpZXMsIGFuZCBsYXllciAob3ZlcnJ1bGVkIGJ5IHBhcmFtcykgYW5kIFxuICogbnMsIGxheWVyLCBzcnNOYW1lIChvdmVycnVsaW5nIHBhcmFtcykuXG4gKiBAcGFyYW0ge1BhcmFtc30gcGFyYW1zIHdpdGggb3B0aW9uYWwgcHJvcGVydGllcywgbnMsIGxheWVyLCBnZW9tZXRyeV9uYW1lLFxuICogZmlsdGVyLCB0eXBlTmFtZSwgd2hpdGVsaXN0LlxuICogQHJldHVybnMge3N0cmluZ30gYSBzdHJpbmcgd2ZzOlVwYXRlIGFjdGlvbi5cbiAqL1xuZnVuY3Rpb24gVXBkYXRlKGZlYXR1cmVzLCBwYXJhbXM9e30pe1xuICBmZWF0dXJlcyA9IGVuc3VyZUFycmF5KGZlYXR1cmVzKTtcbiAgLyoqXG4gICAqIG1ha2VzIGEgd2ZzOlByb3BlcnR5IHN0cmluZyBjb250YWluZyBhIHdmczpWYWx1ZVJlZmVyZW5jZSwgd2ZzOlZhbHVlIHBhaXIuXG4gICAqIEBmdW5jdGlvbiBcbiAgICogQG1lbWJlcm9mIFVwZGF0ZX5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHByb3AgdGhlIGZpZWxkL3Byb3BlcnR5IG5hbWVcbiAgICogQHBhcmFtIHtzdHJpbmd9IHZhbCB0aGUgZmllbGQvcHJvcGVydHkgdmFsdWUgXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhY3Rpb24gb25lIG9mICdpbnNlcnRCZWZvcmUnLCAnaW5zZXJ0QWZ0ZXInLCAncmVtb3ZlJyxcbiAgICogJ3JlcGxhY2UnLiBTZWUgW09HQyAwOS0wMjVyMiDCpyAxNS4yLjUuMi4xXXtAbGluayBodHRwOi8vZG9jcy5vcGVuZ2Vvc3BhdGlhbC5vcmcvaXMvMDktMDI1cjIvMDktMDI1cjIuaHRtbCMyODZ9LlxuICAgKiBgYWN0aW9uYCB3b3VsZCBkZWxldGUgb3IgbW9kaWZ5IHRoZSBvcmRlciBvZiBmaWVsZHMgd2l0aGluIHRoZSByZW1vdGVcbiAgICogZmVhdHVyZS4gVGhlcmUgaXMgY3VycmVudGx5IG5vIHdheSB0byBpbnB1dCBgYWN0aW9uLGAgc2luY2Ugd2ZzOlVwZGF0ZSdzXG4gICAqIGRlZmF1bHQgYWN0aW9uLCAncmVwbGFjZScsIGlzIHN1ZmZpY2llbnQuXG4gICAqL1xuICBjb25zdCBtYWtlS3ZwID0gKHByb3AsIHZhbCwgYWN0aW9uKSA9PiB3ZnMoXG4gICAgJ1Byb3BlcnR5Jywge30sXG4gICAgd2ZzKCdWYWx1ZVJlZmVyZW5jZScsIHthY3Rpb259LCBwcm9wKSArXG4gICAgICAodmFsID09IHVuZGVmaW5lZCA/IHdmcygnVmFsdWUnLCB7fSwgdmFsKTogJycpXG4gICk7XG4gIGlmIChwYXJhbXMucHJvcGVydGllcyl7XG4gICAgbGV0IHtoYW5kbGUsIGlucHV0Rm9ybWF0LCBmaWx0ZXIsIHR5cGVOYW1lLCB3aGl0ZWxpc3R9ID0gcGFyYW1zO1xuICAgIGxldCB7IHNyc05hbWUsIG5zLCBsYXllciwgZ2VvbWV0cnlfbmFtZSB9ID0gdW5wYWNrKFxuICAgICAgZmVhdHVyZXNbMF0gfHwge30sIHBhcmFtcywgJ3Nyc05hbWUnLCAnbnMnLCAnbGF5ZXInLCAnZ2VvbWV0cnlfbmFtZScpO1xuICAgIHR5cGVOYW1lID0gZW5zdXJlVHlwZU5hbWUobnMsIGxheWVyLCB0eXBlTmFtZSk7XG4gICAgZmlsdGVyID0gZW5zdXJlRmlsdGVyKGZpbHRlciwgZmVhdHVyZXMsIHBhcmFtcyk7XG4gICAgaWYgKCFmaWx0ZXIgJiYgIWZlYXR1cmVzLmxlbmd0aCl7XG4gICAgICBjb25zb2xlLndhcm4oJ25laXRoZXIgZmVhdHVyZXMgbm9yIGZpbHRlciBzdXBwbGllZCcpO1xuICAgICAgcmV0dXJuICcnO1xuICAgIH1cbiAgICBsZXQgZmllbGRzID0gJyc7XG4gICAgdXNlV2hpdGVsaXN0SWZBdmFpbGFibGUoIC8vIFRPRE86IGFjdGlvbiBhdHRyXG4gICAgICB3aGl0ZWxpc3QsIHBhcmFtcy5wcm9wZXJ0aWVzLCAoaywgdikgPT4gZmllbGRzICs9IG1ha2VLdnAoayx2KVxuICAgICk7XG4gICAgaWYgKGdlb21ldHJ5X25hbWUpe1xuICAgICAgZmllbGRzICs9ICB4bWwudGFnKFxuXHRucywgZ2VvbWV0cnlfbmFtZSwge30sIGdtbDMocGFyYW1zLmdlb21ldHJ5LCAnJywge3Nyc05hbWV9KVxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIHdmcygnVXBkYXRlJywge2lucHV0Rm9ybWF0LCBzcnNOYW1lLCB0eXBlTmFtZX0sIGZpZWxkcyArIGZpbHRlcik7XG4gIH0gZWxzZSB7XG4gICAgLy8gZW5jYXBzdWxhdGUgZWFjaCB1cGRhdGUgaW4gaXRzIG93biBVcGRhdGUgdGFnXG4gICAgcmV0dXJuIGZlYXR1cmVzLm1hcChcbiAgICAgIChmKSA9PiBVcGRhdGUoXG4gICAgICAgIGYsIE9iamVjdC5hc3NpZ24oe30sIHBhcmFtcywge3Byb3BlcnRpZXM6Zi5wcm9wZXJ0aWVzfSlcbiAgICAgIClcbiAgICApLmpvaW4oJycpO1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIHdmczpEZWxldGUgYWN0aW9uLCBjcmVhdGluZyBhIGZpbHRlciBhbmQgdHlwZU5hbWUgZnJvbSBmZWF0dXJlIGlkcyBcbiAqIGlmIG5vbmUgYXJlIHN1cHBsaWVkLlxuICogQHBhcmFtIHtGZWF0dXJlW118RmVhdHVyZUNvbGxlY3Rpb258RmVhdHVyZX0gZmVhdHVyZXNcbiAqIEBwYXJhbSB7UGFyYW1zfSBwYXJhbXMgb3B0aW9uYWwgcGFyYW1ldGVyIG92ZXJyaWRlcy5cbiAqIEBwYXJhbSB7c3RyaW5nfSBbcGFyYW1zLm5zXSBAc2VlIFBhcmFtcy5uc1xuICogQHBhcmFtIHtzdHJpbmd8T2JqZWN0fSBbcGFyYW1zLmxheWVyXSBAc2VlIFBhcmFtcy5sYXllclxuICogQHBhcmFtIHtzdHJpbmd9IFtwYXJhbXMudHlwZU5hbWVdIEBzZWUgUGFyYW1zLnR5cGVOYW1lLiBUaGlzIHdpbGwgYmUgaW5mZXJyZWRcbiAqIGZyb20gZmVhdHVyZS9wYXJhbXMgbGF5ZXIgYW5kIG5zIGlmIHRoaXMgaXMgbGVmdCB1bmRlZmluZWQuXG4gKiBAcGFyYW0ge2ZpbHRlcn0gW3BhcmFtcy5maWx0ZXJdIEBzZWUgUGFyYW1zLmZpbHRlci4gIFRoaXMgd2lsbCBiZSBpbmZlcnJlZFxuICogZnJvbSBmZWF0dXJlIGlkcyBhbmQgbGF5ZXIocykgaWYgbGVmdCB1bmRlZmluZWQgKEBzZWUgZW5zdXJlRmlsdGVyKS5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IGEgd2ZzOkRlbGV0ZSBzdHJpbmcuXG4gKi9cbmZ1bmN0aW9uIERlbGV0ZShmZWF0dXJlcywgcGFyYW1zPXt9KXtcbiAgZmVhdHVyZXMgPSBlbnN1cmVBcnJheShmZWF0dXJlcyk7XG4gIGxldCB7ZmlsdGVyLCB0eXBlTmFtZX0gPSBwYXJhbXM7IC8vVE9ETzogcmVjdXJlICYgZW5jYXBzdWxhdGUgYnkgdHlwZU5hbWVcbiAgbGV0IHtucywgbGF5ZXJ9ID0gdW5wYWNrKGZlYXR1cmVzWzBdIHx8IHt9LCBwYXJhbXMsICdsYXllcicsICducycpO1xuICB0eXBlTmFtZSA9IGVuc3VyZVR5cGVOYW1lKG5zLCBsYXllciwgdHlwZU5hbWUpO1xuICBmaWx0ZXIgPSBlbnN1cmVGaWx0ZXIoZmlsdGVyLCBmZWF0dXJlcywgcGFyYW1zKTtcbiAgcmV0dXJuIHdmcygnRGVsZXRlJywge3R5cGVOYW1lfSwgZmlsdGVyKTsgXG59XG5cbi8qKlxuICogUmV0dXJucyBhIHN0cmluZyB3ZnM6UmVwbGFjZSBhY3Rpb24uXG4gKiBAcGFyYW0ge0ZlYXR1cmVbXXxGZWF0dXJlQ29sbGVjdGlvbnxGZWF0dXJlfSBmZWF0dXJlcyBmZWF0dXJlKHMpIHRvIHJlcGxhY2VcbiAqIEBwYXJhbSB7UGFyYW1zfSBwYXJhbXMgd2l0aCBvcHRpb25hbCBmaWx0ZXIsIGlucHV0Rm9ybWF0LCBzcnNOYW1lXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBhIHN0cmluZyB3ZnM6UmVwbGFjZSBhY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIFJlcGxhY2UoZmVhdHVyZXMsIHBhcmFtcz17fSl7XG4gIGZlYXR1cmVzID0gZW5zdXJlQXJyYXkoZmVhdHVyZXMpO1xuICBsZXQge2ZpbHRlciwgaW5wdXRGb3JtYXQsIHNyc05hbWV9ID0gdW5wYWNrIChcbiAgICBmZWF0dXJlc1swXSB8fCB7fSwgcGFyYW1zIHx8IHt9LCAnZmlsdGVyJywgJ2lucHV0Rm9ybWF0JywgJ3Nyc05hbWUnXG4gICk7XG4gIGxldCByZXBsYWNlbWVudHMgPSB0cmFuc2xhdGVGZWF0dXJlcyhcbiAgICBbZmVhdHVyZXNbMF1dLmZpbHRlcigoZik9PmYpLFxuICAgIHBhcmFtcyB8fCB7c3JzTmFtZX1cbiAgKTtcbiAgZmlsdGVyID0gZW5zdXJlRmlsdGVyKGZpbHRlciwgZmVhdHVyZXMsIHBhcmFtcyk7XG4gIHJldHVybiB3ZnMoJ1JlcGxhY2UnLCB7aW5wdXRGb3JtYXQsIHNyc05hbWV9LCByZXBsYWNlbWVudHMgKyBmaWx0ZXIpO1xufVxuXG4vKipcbiAqIFdyYXBzIHRoZSBpbnB1dCBhY3Rpb25zIGluIGEgd2ZzOlRyYW5zYWN0aW9uLlxuICogQHBhcmFtIHtPYmplY3R8c3RyaW5nW118c3RyaW5nfSBhY3Rpb25zIGFuIG9iamVjdCBtYXBwaW5nIHtJbnNlcnQsIFVwZGF0ZSxcbiAqIERlbGV0ZX0gdG8gZmVhdHVyZShzKSB0byBwYXNzIHRvIEluc2VydCwgVXBkYXRlLCBEZWxldGUsIG9yIHdmczphY3Rpb24gXG4gKiBzdHJpbmcocykgdG8gd3JhcCBpbiBhIHRyYW5zYWN0aW9uLlxuICogQHBhcmFtIHtPYmplY3R9IHBhcmFtcyBvcHRpb25hbCBzcnNOYW1lLCBsb2NrSWQsIHJlbGVhc2VBY3Rpb24sIGhhbmRsZSxcbiAqIGlucHV0Rm9ybWF0LCB2ZXJzaW9uLCBhbmQgcmVxdWlyZWQgbnNBc3NpZ25tZW50cywgc2NoZW1hTG9jYXRpb25zLlxuICogQHJldHVybnMge3N0cmluZ30gQSB3ZnM6dHJhbnNhY3Rpb24gd3JhcHBpbmcgdGhlIGlucHV0IGFjdGlvbnMuXG4gKiBAdGhyb3dzIHtFcnJvcn0gaWYgYGFjdGlvbnNgIGlzIG5vdCBhbiBhcnJheSBvZiBzdHJpbmdzLCBhIHN0cmluZywgb3IgXG4gKiB7QHNlZSBJbnNlcnQsIEBzZWUgVXBkYXRlLCBAc2VlIERlbGV0ZX0sIHdoZXJlIGVhY2ggYWN0aW9uIGFyZSB2YWxpZCBpbnB1dHMgXG4gKiB0byB0aGUgZXBvbnltb3VzIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBUcmFuc2FjdGlvbihhY3Rpb25zLCBwYXJhbXM9e30pe1xuICBsZXQge1xuICAgIHNyc05hbWUsIGxvY2tJZCwgcmVsZWFzZUFjdGlvbiwgaGFuZGxlLCBpbnB1dEZvcm1hdCwgdmVyc2lvbiwgLy8gb3B0aW9uYWxcbiAgICBuc0Fzc2lnbm1lbnRzLCBzY2hlbWFMb2NhdGlvbnMgLy8gcmVxdWlyZWRcbiAgfSA9IHBhcmFtcztcbiAgbGV0IGNvbnZlcnRlciA9IHtJbnNlcnQsIFVwZGF0ZSwgRGVsZXRlfTtcbiAgbGV0IHtpbnNlcnQ6dG9JbnNlcnQsIHVwZGF0ZTp0b1VwZGF0ZSwgZGVsZXRlOnRvRGVsZXRlfSA9IGFjdGlvbnMgfHwge307XG4gIGxldCBmaW5hbEFjdGlvbnMgPSAnJzsgLy8gcHJvY2Vzc2VkQWN0aW9ucyB3b3VsZCBiZSBtb3JlIGFjY3VyYXRlXG4gIFxuICBpZiAoQXJyYXkuaXNBcnJheShhY3Rpb25zKSAmJiBhY3Rpb25zLmV2ZXJ5KCh2KSA9PiB0eXBlb2YodikgPT0gJ3N0cmluZycpKXtcbiAgICBmaW5hbEFjdGlvbnMgKz0gYWN0aW9ucy5qb2luKCcnKTtcbiAgfSBlbHNlIGlmICh0eXBlb2YoYWN0aW9ucykgPT0gJ3N0cmluZycpIHtcbiAgICBmaW5hbEFjdGlvbnMgPSBhY3Rpb25zO1xuICB9XG4gICAgZWxzZSBpZiAoW3RvSW5zZXJ0LCB0b1VwZGF0ZSwgdG9EZWxldGVdLnNvbWUoKGUpID0+IGUpKXtcbiAgICBmaW5hbEFjdGlvbnMgKz0gSW5zZXJ0KHRvSW5zZXJ0LCBwYXJhbXMpICtcbiAgICAgIFVwZGF0ZSh0b1VwZGF0ZSwgcGFyYW1zKSArXG4gICAgICBEZWxldGUodG9EZWxldGUsIHBhcmFtcyk7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGB1bmV4cGVjdGVkIGlucHV0OiAke0pTT04uc3RyaW5naWZ5KGFjdGlvbnMpfWApO1xuICB9XG4gIC8vIGdlbmVyYXRlIHNjaGVtYUxvY2F0aW9uLCB4bWxucydzXG4gIG5zQXNzaWdubWVudHMgPSBuc0Fzc2lnbm1lbnRzIHx8IHt9O1xuICBzY2hlbWFMb2NhdGlvbnMgPSBzY2hlbWFMb2NhdGlvbnMgfHwge307XG4gIGxldCBhdHRycyA9IGdlbmVyYXRlTnNBc3NpZ25tZW50cyhuc0Fzc2lnbm1lbnRzLCBhY3Rpb25zKTtcbiAgYXR0cnNbJ3hzaTpzY2hlbWFMb2NhdGlvbiddID0gIGdlbmVyYXRlU2NoZW1hTGluZXMocGFyYW1zLnNjaGVtYUxvY2F0aW9ucyk7XG4gIGF0dHJzWydzZXJ2aWNlJ10gPSAnV0ZTJztcbiAgYXR0cnNbJ3ZlcnNpb24nXSA9IC8yXFwuMFxcLlxcZCsvLmV4ZWModmVyc2lvbiB8fCAnJykgPyB2ZXJzaW9uIDogJzIuMC4wJztcbiAgcmV0dXJuIHdmcygnVHJhbnNhY3Rpb24nLCBhdHRycywgZmluYWxBY3Rpb25zKTtcbn1cblxuLyoqXG4gKiBHZW5lcmF0ZXMgYW4gb2JqZWN0IHRvIGJlIHBhc3NlZCB0byBAc2VlIHhtbC5hdHRycyB4bWxuczpucz1cInVyaVwiIGRlZmluaXRpb25zIGZvciBhIHdmczpUcmFuc2FjdGlvblxuICogQHBhcmFtIHtPYmplY3R9IG5zQXNzaWdubWVudHMgQHNlZSBQYXJhbXMubnNBc3NpZ25tZW50c1xuICogQHBhcmFtIHtzdHJpbmd9IHhtbCBhcmJpdHJhcnkgeG1sLlxuICogQHJldHVybnMge09iamVjdH0gYW4gb2JqZWN0IG1hcHBpbmcgZWFjaCBucyB0byBpdHMgVVJJIGFzICd4bWxuczpucycgOiAnVVJJJy5cbiAqIEB0aHJvd3Mge0Vycm9yfSBpZiBhbnkgbmFtZXNwYWNlIHVzZWQgd2l0aGluIGB4bWxgIGlzIG1pc3NpbmcgYSBVUkkgZGVmaW5pdGlvblxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZU5zQXNzaWdubWVudHMobnNBc3NpZ25tZW50cywgeG1sKXtcbiAgbGV0IGF0dHJzID0ge307XG4gIGNvbnN0IG1ha2VOc0Fzc2lnbm1lbnQgPSAobnMsIHVyaSkgPT4gYXR0cnNbYHhtbG5zOiR7bnN9YF0gPSB1cmk7XG4gIGZvciAobGV0IG5zIGluIG5zQXNzaWdubWVudHMpe1xuICAgIG1ha2VOc0Fzc2lnbm1lbnQobnMsIG5zQXNzaWdubWVudHNbbnNdKTtcbiAgfVxuICAvLyBjaGVjayBhbGwgbnMncyBhc3NpZ25lZCBcbiAgdmFyIHJlID0gLyg8fHR5cGVOYW1lPVwiKShcXHcrKTovZztcbiAgdmFyIGFycjtcbiAgdmFyIGFsbE5hbWVzcGFjZXMgPSBuZXcgU2V0KCk7XG4gIHdoaWxlICgoYXJyID0gcmUuZXhlYyh4bWwpKSAhPT0gbnVsbCl7XG4gICAgYWxsTmFtZXNwYWNlcy5hZGQoYXJyWzJdKTtcbiAgfVxuICBpZiAoYWxsTmFtZXNwYWNlcy5oYXMoJ2ZlcycpKXtcbiAgICBtYWtlTnNBc3NpZ25tZW50KCdmZXMnLCAnaHR0cDovL3d3dy5vcGVuZ2lzLm5ldC9mZXMvMi4wJyk7XG4gIH07XG4gIG1ha2VOc0Fzc2lnbm1lbnQoJ3hzaScsICdodHRwOi8vd3d3LnczLm9yZy8yMDAxL1hNTFNjaGVtYS1pbnN0YW5jZScpO1xuICBtYWtlTnNBc3NpZ25tZW50KCdnbWwnLCAnaHR0cDovL3d3dy5vcGVuZ2lzLm5ldC9nbWwvMy4yJyk7XG4gIG1ha2VOc0Fzc2lnbm1lbnQoJ3dmcycsICdodHRwOi8vd3d3Lm9wZW5naXMubmV0L3dmcy8yLjAnKTtcblxuICBmb3IgKGxldCBucyBvZiBhbGxOYW1lc3BhY2VzKXtcbiAgICBpZiAoIWF0dHJzWyd4bWxuczonICsgbnNdKXtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgdW5hc3NpZ25lZCBuYW1lc3BhY2UgJHtuc31gKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGF0dHJzO1xufVxuXG4vKipcbiAqIFJldHVybnMgYSBzdHJpbmcgYWx0ZXJuYXRpbmcgdXJpLCB3aGl0ZXNwYWNlLCBhbmQgdGhlIHVyaSdzIHNjaGVtYSdzIGxvY2F0aW9uLlxuICogQHBhcmFtIHtPYmplY3R9IHNjaGVtYUxvY2F0aW9ucyBhbiBvYmplY3QgbWFwcGluZyB1cmk6c2NoZW1hbG9jYXRpb25cbiAqIEByZXR1cm5zIHtzdHJpbmd9IGEgc3RyaW5nIHRoYXQgaXMgYSB2YWxpZCB4c2k6c2NoZW1hTG9jYXRpb24gdmFsdWUuXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlU2NoZW1hTGluZXMoc2NoZW1hTG9jYXRpb25zPXt9KXtcbiAgLy9UT0RPOiBhZGQgbnMgYXNzaWdubWVudCBjaGVja1xuICBzY2hlbWFMb2NhdGlvbnNbJ2h0dHA6Ly93d3cub3Blbmdpcy5uZXQvd2ZzLzIuMCddID0gXG4gICAgJ2h0dHA6Ly9zY2hlbWFzLm9wZW5naXMubmV0L3dmcy8yLjAvd2ZzLnhzZCc7XG4gIHZhciBzY2hlbWFMaW5lcyA9IFtdO1xuICBmb3IgKGxldCB1cmkgaW4gc2NoZW1hTG9jYXRpb25zKXtcbiAgICBzY2hlbWFMaW5lcy5wdXNoKGAke3VyaX1cXG4ke3NjaGVtYUxvY2F0aW9uc1t1cmldfWApO1xuICB9XG4gIHJldHVybiBzY2hlbWFMaW5lcy5qb2luKCdcXG4nKTtcbn1cblxuZXhwb3J0IHtJbnNlcnQsIFVwZGF0ZSwgUmVwbGFjZSwgRGVsZXRlLCBUcmFuc2FjdGlvbn07XG4iLCJpbXBvcnQgeyBnZW9tVG9HbWwgYXMgZ21sMiB9IGZyb20gJ2dlb2pzb24tdG8tZ21sLTInO1xuaW1wb3J0IHsgZ2VvbVRvR21sIGFzIGdtbDMgfSBmcm9tICdnZW9qc29uLXRvLWdtbC0zJztcbmltcG9ydCB7VHJhbnNhY3Rpb24sIEluc2VydH0gZnJvbSAnZ2VvanNvbi10by13ZnMtdC0yJzsgLy8gTW9yZSBsYXRlciwgSSBndWVzc1xuLyogdG9nZ2xlcyAqL1xuJCgnLnBvcnRmb2xpby10b2dnbGUnKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgJCh0aGlzKS5uZXh0KCcucG9ydGZvbGlvLWl0ZW0nKS5zbGlkZVRvZ2dsZSgzMDApO1xuICAgIC8vIFRPRE86IGVuc3VyZSB0aGUgdG9nZ2xlZCBpdGVtIGlzIGluIHZpZXdcbn0pO1xuXG4vKiB0cmFuc2xhdGlvbiBmdW5jdGlvbiAqL1xuZnVuY3Rpb24gdHJhbnNsYXRvcihidXR0b24sIGZyb20sIHRvLCB0cmFuc2xhdG9yQ2Ipe1xuICAkKGJ1dHRvbikubW91c2V1cCgoZSk9PntcbiAgICB0cnkge1xuICAgICAgZGVidWdnZXI7XG4gICAgICBjb25zdCB0b1RyYW5zbGF0ZSA9IEpTT04ucGFyc2UoJChmcm9tKS50ZXh0KCkpO1xuICAgICAgY29uc3QgdHJhbnNsYXRlZCA9IGZvcm1hdFhtbCh0cmFuc2xhdG9yQ2IodG9UcmFuc2xhdGUpKTtcbiAgICAgIHRyeSB7XG5cdCQodG8pLnRleHQodHJhbnNsYXRlZCk7XG4gICAgICB9IGNhdGNoIChlcnIpe1xuXHQkKHRvKS52YWwodHJhbnNsYXRlZCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyKXtcbiAgICAgIGFsZXJ0KGVycik7XG4gICAgfVxuICB9KTtcbn1cblxuLyogR2VvanNvbiAtPiBHTUwgZXhhbXBsZSAqL1xudHJhbnNsYXRvcihcbiAgJyN0cmFuc2xhdGUtZ2VvanNvbi1nbWwtMicsICcjZ2VvanNvbi1zYW1wbGUtZ21sJywgJyNnbWwtdGFyZ2V0JyxcbiAgKHRvVHJhbnNsYXRlKSA9PiBnbWwyKHRvVHJhbnNsYXRlKVxuKTtcbnRyYW5zbGF0b3IoXG4gICcjdHJhbnNsYXRlLWdlb2pzb24tZ21sLTMnLCAnI2dlb2pzb24tc2FtcGxlLWdtbCcsICcjZ21sLXRhcmdldCcsXG4gICh0b1RyYW5zbGF0ZSkgPT4gZ21sMyh0b1RyYW5zbGF0ZSlcbik7XG50cmFuc2xhdG9yKFxuICAnI3RyYW5zbGF0ZS1nZW9qc29uLXdmc3QnLCAnI2dlb2pzb24tc2FtcGxlLXdmcycsICcjZ21sLXRhcmdldCcsXG4gICh0b1RyYW5zbGF0ZSk9PlRyYW5zYWN0aW9uKEluc2VydCh0b1RyYW5zbGF0ZSkpXG4pO1xuZnVuY3Rpb24gZm9ybWF0WG1sKHhtbCkge1xuICAgIHZhciBmb3JtYXR0ZWQgPSAnJztcbiAgICB2YXIgcmVnID0gLyg+KSg8KShcXC8qKS9nO1xuICAgIHhtbCA9IHhtbC5yZXBsYWNlKHJlZywgJyQxXFxyXFxuJDIkMycpO1xuICAgIHZhciBwYWQgPSAwO1xuICAgIHhtbC5zcGxpdCgnXFxyXFxuJykuZm9yRWFjaChmdW5jdGlvbiAobm9kZSwgaW5kZXgpIHtcbiAgICAgICAgdmFyIGluZGVudCA9IDA7XG4gICAgICAgIGlmIChub2RlLm1hdGNoKC8uKzxcXC9cXHdbXj5dKj4kLykpIHtcbiAgICAgICAgICAgIGluZGVudCA9IDA7XG4gICAgICAgIH0gZWxzZSBpZiAobm9kZS5tYXRjaCgvXjxcXC9cXHcvKSkge1xuICAgICAgICAgICAgaWYgKHBhZCAhPSAwKSB7XG4gICAgICAgICAgICAgICAgcGFkIC09IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAobm9kZS5tYXRjaCgvXjxcXHcoW14+XSpbXlxcL10pPz4uKiQvKSkge1xuICAgICAgICAgICAgaW5kZW50ID0gMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGluZGVudCA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcGFkZGluZyA9ICcnO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhZDsgaSsrKSB7XG4gICAgICAgICAgICBwYWRkaW5nICs9ICcgICc7XG4gICAgICAgIH1cblxuICAgICAgICBmb3JtYXR0ZWQgKz0gcGFkZGluZyArIG5vZGUgKyAnXFxyXFxuJztcbiAgICAgICAgcGFkICs9IGluZGVudDtcbiAgICB9KTtcblxuICAgIHJldHVybiBmb3JtYXR0ZWQ7XG59XG4vL1RPRE86IEdlb0pTT04gLT4gV0ZTLVRcblxuXG5cbi8qIHJlZGlyZWN0IG9uIGxhbmRpbmcgKi9cbiQoZG9jdW1lbnQpLnJlYWR5KCgpPT4kKHdpbmRvdy5sb2NhdGlvbi5oYXNoKS5zaG93KCkpO1xuXG4kKCdhLmxpbmstcmlnaHQnKS5vbihcbiAgICBcImNsaWNrXCIsXG4gICAgZnVuY3Rpb24oZSl7XG5cdCQoJCh0aGlzKS5hdHRyKCdocmVmJykpLnNob3coKTtcblx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9XG4pO1xuIl0sIm5hbWVzIjpbIlBvaW50IiwiTGluZVN0cmluZyIsIkxpbmVhclJpbmciLCJQb2x5Z29uIiwiTXVsdGlQb2ludCIsIk11bHRpTGluZVN0cmluZyIsIk11bHRpUG9seWdvbiIsImNvbnZlcnRlciIsIkdlb21ldHJ5Q29sbGVjdGlvbiIsImdlb21Ub0dtbCIsImdtbDMiLCIkIiwib24iLCJuZXh0Iiwic2xpZGVUb2dnbGUiLCJ0cmFuc2xhdG9yIiwiYnV0dG9uIiwiZnJvbSIsInRvIiwidHJhbnNsYXRvckNiIiwibW91c2V1cCIsImUiLCJ0b1RyYW5zbGF0ZSIsIkpTT04iLCJwYXJzZSIsInRleHQiLCJ0cmFuc2xhdGVkIiwiZm9ybWF0WG1sIiwiZXJyIiwidmFsIiwiZ21sMiIsIlRyYW5zYWN0aW9uIiwiSW5zZXJ0IiwieG1sIiwiZm9ybWF0dGVkIiwicmVnIiwicmVwbGFjZSIsInBhZCIsInNwbGl0IiwiZm9yRWFjaCIsIm5vZGUiLCJpbmRleCIsImluZGVudCIsIm1hdGNoIiwicGFkZGluZyIsImkiLCJkb2N1bWVudCIsInJlYWR5Iiwid2luZG93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
