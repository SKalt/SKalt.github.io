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
var coordinateOrder = true;
function orderCoords(coords){
  if (coordinateOrder){
    return coords;
  }
  if (coords[2]){
    return [coords[1], coords[0], coords[2]];
  }
  return coords.reverse();
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
    orderCoords(coords).join() +
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
    coords.map((e)=>orderCoords(e).join(' ')).join(' ') +
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
    coords.map((e)=>orderCoords(e).join(' ')).join(' ') +
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

/* eslint-disable no-console */
/* 
 Note this can only convert what geojson can store: simple feature types, not
 coverage, topology, etc.
 */

/** 
 * geojson coordinates are in longitude/easting, latitude/northing [,elevation]
 * order by [RFC-7946 § 3.1.1]{@link https://tools.ietf.org/html/rfc7946#section-3.1.1}.
 * however, you may use a CRS that follows a latitude/easting,
 * longitude/northing, [,elevation] order.
 */
var coordinateOrder$1 = true;
function orderCoords$1(coords){
  if (coordinateOrder$1){
    return coords;
  } 
  if (coords[2]){
    return [coords[1], coords[0], coords[2]];
  } 
  return coords.reverse();
}



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
  multi += `<gml:${memberName}>`;
  geom.forEach(function(member, i){
    let _gmlId = member.id || (gmlIds || [])[i] || '';
    if (name == 'MultiGeometry'){
      let memberType = member.type;
      member = member.coordinates;
      multi += membercb[memberType](member, _gmlId, params);
    } else {
      multi += membercb(member, _gmlId, params);
    }
  });
  multi += `</gml:${memberName}>`;
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
    orderCoords$1(coords).join(' ') +
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
    coords.map((e)=>orderCoords$1(e).join(' ')).join(' ') + 
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
    coords.map((e)=>orderCoords$1(e).join(' ')).join(' ') + 
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
  return multi('MultiPoint', 'pointMembers', Point$1, coords, gmlId, params);
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
  return multi('MultiCurve', 'curveMembers', LineString$1, coords, gmlId, params);
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
  return multi('MultiSurface', 'surfaceMembers', Polygon$1, coords, gmlId, params);
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
  return multi('MultiGeometry', 'geometryMembers', converter$1,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsiLi4vbm9kZV9tb2R1bGVzL2dlb2pzb24tdG8tZ21sLTIvZ2VvbVRvR21sLTIuMS4yLWVzNi5qcyIsIi4uL25vZGVfbW9kdWxlcy9nZW9qc29uLXRvLWdtbC0zL2dlb21Ub0dtbC0zLjIuMS1lczYuanMiLCIuLi9ub2RlX21vZHVsZXMvZ2VvanNvbi10by13ZnMtdC0yL2dlb2pzb24tdG8td2ZzdC0yLWVzNi5qcyIsIi4uL3NyYy9zY3JpcHRzL21haW4uanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyogQ29udmVydCBnZW9qc29uIGludG8gZ21sIDIuMS4yIHNpbXBsZSBmZWF0dXJlcy5cbiBHTUwgbW9kZWxzIGZyb20gaHR0cHM6Ly9kb2NzLm9yYWNsZS5jb20vY2QvRTExODgyXzAxL2FwcGRldi4xMTIvZTExODI5L29yYWNsZS9zcGF0aWFsL3V0aWwvR01MLmh0bWxcbiAqL1xuLyoqXG4gKiByZXR1cm5zIGEgc3RyaW5nIHdpdGggdGhlIGZpcnN0IGxldHRlciBjYXBpdGFsaXplZC5cbiAqIEBmdW5jdGlvblxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJcbiAqIEByZXR1cm5zIHtzdHJpbmd9IGEgc3RyaW5nIHdpdGggdGhlIGZpcnN0IGxldHRlciBjYXBpdGFsaXplZC5cbiAqL1xuZnVuY3Rpb24gY2FwaXRhbGl6ZUZpcnN0TGV0dGVyKHN0cil7XG4gIHJldHVybiBzdHIucmVwbGFjZSgvXi4vLCAobGV0dGVyKSA9PiBsZXR0ZXIudG9VcHBlckNhc2UoKSk7XG59XG4vKipcbiAqIHJldHVybnMgYSBzdHJpbmcgd2l0aCB0aGUgZmlyc3QgbGV0dGVyIGxvd2VyZWQuXG4gKiBAZnVuY3Rpb25cbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBhIHN0cmluZyB3aXRoIHRoZSBmaXJzdCBsZXR0ZXIgbG93ZXJlZC5cbiAqL1xuZnVuY3Rpb24gbG93ZXJGaXJzdExldHRlcihzdHIpe1xuICByZXR1cm4gc3RyLnJlcGxhY2UoL14uLywgKGxldHRlcik9PmxldHRlci50b0xvd2VyQ2FzZSgpKTtcbn1cbnZhciBjb29yZGluYXRlT3JkZXIgPSB0cnVlO1xuLyoqXG4gKiBnZW9qc29uIGNvb3JkaW5hdGVzIGFyZSBpbiBsb25naXR1ZGUvZWFzdGluZywgbGF0aXR1ZGUvbm9ydGhpbmcgWyxlbGV2YXRpb25dXG4gKiBvcmRlciBieSBbUkZDLTc5NDYgwqcgMy4xLjFde0BsaW5rIGh0dHBzOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmM3OTQ2I3NlY3Rpb24tMy4xLjF9LlxuICogaG93ZXZlciwgeW91IG1heSB1c2UgYSBDUlMgdGhhdCBmb2xsb3dzIGEgbGF0aXR1ZGUvZWFzdGluZyxcbiAqIGxvbmdpdHVkZS9ub3J0aGluZywgWyxlbGV2YXRpb25dIG9yZGVyLlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge2Jvb2xlYW59IG9yZGVyIHRoZSBvcmRlcjogdHJ1ZSBzZXRzIGxuZyxsYXQgb3JkZXIsIGZhbHNlIHNldHMgbGF0LGxuZy5cbiAqIEByZXR1cm5zIHVuZGVmaW5lZFxuICovXG5jb25zdCBzZXRDb29yZGluYXRlT3JkZXIgPSAob3JkZXIpID0+IGNvb3JkaW5hdGVPcmRlciA9IG9yZGVyO1xuZnVuY3Rpb24gb3JkZXJDb29yZHMoY29vcmRzKXtcbiAgaWYgKGNvb3JkaW5hdGVPcmRlcil7XG4gICAgcmV0dXJuIGNvb3JkcztcbiAgfVxuICBpZiAoY29vcmRzWzJdKXtcbiAgICByZXR1cm4gW2Nvb3Jkc1sxXSwgY29vcmRzWzBdLCBjb29yZHNbMl1dO1xuICB9XG4gIHJldHVybiBjb29yZHMucmV2ZXJzZSgpO1xufVxuXG4vKipcbiAqIGNvbnZlcnRzIGEgZ2VvanNvbiBnZW9tZXRyeSBQb2ludCB0byBnbWxcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtudW1iZXJbXX0gY29vcmRzIHRoZSBjb29yZGluYXRlcyBtZW1iZXIgb2YgdGhlIGdlb21ldHJ5XG4gKiBAcGFyYW0ge3N0cmluZ3x1bmRlZmluZWR9IHNyc05hbWUgYSBzdHJpbmcgc3BlY2lmeWluZyBTUlNcbiAqIEByZXR1cm5zIHtzdHJpbmd9IGEgc3RyaW5nIG9mIGdtbCBkZXNjcmliaW5nIHRoZSBpbnB1dCBnZW9tZXRyeVxuICovXG5mdW5jdGlvbiBQb2ludChjb29yZHMsIHNyc05hbWUpe1xuICByZXR1cm4gYDxnbWw6UG9pbnQkeyhzcnNOYW1lID8gYCBzcnNOYW1lPVwiJHtzcnNOYW1lfVwiYCA6ICcnKX0+YCArXG4gICAgJzxnbWw6Y29vcmRpbmF0ZXMgY3M9XCIsXCIgdHM9XCIgXCIgZGVjaW1hbD1cIi5cIj4nICtcbiAgICBvcmRlckNvb3Jkcyhjb29yZHMpLmpvaW4oKSArXG4gICAgJzwvZ21sOmNvb3JkaW5hdGVzPicgK1xuICAgICc8L2dtbDpQb2ludD4nO1xufVxuLyoqXG4gKiBjb252ZXJ0cyBhIGdlb2pzb24gZ2VvbWV0cnkgTGluZVN0cmluZyB0byBnbWxcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtudW1iZXJbXVtdfSBjb29yZHMgdGhlIGNvb3JkaW5hdGVzIG1lbWJlciBvZiB0aGUgZ2VvbWV0cnlcbiAqIEBwYXJhbSB7c3RyaW5nfHVuZGVmaW5lZH0gc3JzTmFtZSBhIHN0cmluZyBzcGVjaWZ5aW5nIFNSU1xuICogQHJldHVybnMge3N0cmluZ30gYSBzdHJpbmcgb2YgZ21sIGRlc2NyaWJpbmcgdGhlIGlucHV0IGdlb21ldHJ5XG4gKi9cbmZ1bmN0aW9uIExpbmVTdHJpbmcoY29vcmRzLCBzcnNOYW1lKXtcbiAgcmV0dXJuIGA8Z21sOkxpbmVTdHJpbmckeyhzcnNOYW1lID8gYCBzcnNOYW1lPVwiJHtzcnNOYW1lfVwiYDonJyl9PmAgK1xuICAgICc8Z21sOmNvb3JkaW5hdGVzIGNzPVwiLFwiIHRzPVwiIFwiIGRlY2ltYWw9XCIuXCI+JyArXG4gICAgY29vcmRzLm1hcCgoZSk9Pm9yZGVyQ29vcmRzKGUpLmpvaW4oJyAnKSkuam9pbignICcpICtcbiAgICAnPC9nbWw6Y29vcmRpbmF0ZXM+JyArXG4gICAgJzwvZ21sOkxpbmVTdHJpbmc+Jztcbn1cbi8qKlxuICogY29udmVydHMgYSBnZW9qc29uIGdlb21ldHJ5IHJpbmcgaW4gYSBwb2x5Z29uIHRvIGdtbFxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge251bWJlcltdW119IGNvb3JkcyB0aGUgY29vcmRpbmF0ZXMgbWVtYmVyIG9mIHRoZSBnZW9tZXRyeVxuICogQHBhcmFtIHtzdHJpbmd8dW5kZWZpbmVkfSBzcnNOYW1lIGEgc3RyaW5nIHNwZWNpZnlpbmcgU1JTXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBhIHN0cmluZyBvZiBnbWwgZGVzY3JpYmluZyB0aGUgaW5wdXQgZ2VvbWV0cnlcbiAqL1xuZnVuY3Rpb24gTGluZWFyUmluZyhjb29yZHMsIHNyc05hbWUpe1xuICByZXR1cm4gYDxnbWw6TGluZWFyUmluZyR7KHNyc05hbWUgPyBgIHNyc05hbWU9XCIke3Nyc05hbWV9XCJgOicnKX0+YCArXG4gICAgJzxnbWw6Y29vcmRpbmF0ZXMgY3M9XCIsXCIgdHM9XCIgXCIgZGVjaW1hbD1cIi5cIj4nICtcbiAgICBjb29yZHMubWFwKChlKT0+b3JkZXJDb29yZHMoZSkuam9pbignICcpKS5qb2luKCcgJykgK1xuICAgICc8L2dtbDpjb29yZGluYXRlcz4nICtcbiAgICAnPC9nbWw6TGluZWFyUmluZz4nO1xufVxuLyoqXG4gKiBjb252ZXJ0cyBhIGdlb2pzb24gZ2VvbWV0cnkgUG9seWdvbiB0byBnbWxcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtudW1iZXJbXVtdW119IGNvb3JkcyB0aGUgY29vcmRpbmF0ZXMgbWVtYmVyIG9mIHRoZSBnZW9tZXRyeVxuICogQHBhcmFtIHtzdHJpbmd8dW5kZWZpbmVkfSBzcnNOYW1lIGEgc3RyaW5nIHNwZWNpZnlpbmcgU1JTXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBhIHN0cmluZyBvZiBnbWwgZGVzY3JpYmluZyB0aGUgaW5wdXQgZ2VvbWV0cnlcbiAqL1xuZnVuY3Rpb24gUG9seWdvbihjb29yZHMsIHNyc05hbWUpe1xuICAvLyBnZW9tLmNvb3JkaW5hdGVzIGFyZSBhcnJheXMgb2YgTGluZWFyUmluZ3NcbiAgbGV0IHBvbHlnb24gPSBgPGdtbDpQb2x5Z29uJHsoc3JzTmFtZSA/IGAgc3JzTmFtZT1cIiR7c3JzTmFtZX1cImA6JycpfT5gICtcbiAgICAnPGdtbDpvdXRlckJvdW5kYXJ5SXM+JyArXG4gICAgTGluZWFyUmluZyhjb29yZHNbMF0pICtcbiAgICAnPC9nbWw6b3V0ZXJCb3VuZGFyeUlzPic7XG4gIGlmIChjb29yZHMubGVuZ3RoID49IDIpe1xuICAgIGZvciAobGV0IGxpbmVhclJpbmcgb2YgY29vcmRzLnNsaWNlKDEpKXtcbiAgICAgIHBvbHlnb24gKz0gJzxnbWw6aW5uZXJCb3VuZGFyeUlzPicgK1xuTGluZWFyUmluZyhsaW5lYXJSaW5nKSArXG4nPC9nbWw6aW5uZXJCb3VuZGFyeUlzPic7XG4gICAgfVxuICB9XG4gIHBvbHlnb24gKz0gJzwvZ21sOlBvbHlnb24+JztcbiAgcmV0dXJuIHBvbHlnb247XG59XG4vKipcbiAqIEhhbmRsZXMgbXVsdGlnZW9tZXRyaWVzIG9yIGdlb21ldHJ5IGNvbGxlY3Rpb25zXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7T2JqZWN0fSBnZW9tIGEgZ2VvanNvbiBnZW9tZXRyeSBvYmplY3RcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIHRoZSBuYW1lIG9mIHRoZSBtdWx0aWdlb21ldHJ5LCBlLmcuICdNdWx0aVBvbHlnb24nXG4gKiBAcGFyYW0ge3N0cmluZ3x1bmRlZmluZWR9IHNyc05hbWUgYSBzdHJpbmcgc3BlY2lmeWluZyB0aGUgU1JTXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVtYmVyUHJlZml4IHRoZSBwcmVmaXggb2YgYSBnbWwgbWVtYmVyIHRhZ1xuICogQHJldHVybnMge3N0cmluZ30gYSBzdHJpbmcgb2YgZ21sIGRlc2NyaWJpbmcgdGhlIGlucHV0IG11bHRpZ2VvbWV0cnlcbiAqIEB0aHJvd3Mge0Vycm9yfSB3aWxsIHRocm93IGFuIGVycm9yIGlmIGEgbWVtYmVyIGdlb21ldHJ5IGlzIHN1cHBsaWVkIHdpdGhvdXQgYSBgdHlwZWAgYXR0cmlidXRlXG4gKi9cbmZ1bmN0aW9uIF9tdWx0aShnZW9tLCBuYW1lLCBjYiwgc3JzTmFtZSwgbWVtYmVyUHJlZml4PScnKXtcbiAgbGV0IG11bHRpID0gYDxnbWw6JHtuYW1lfSR7KHNyc05hbWUgPyBgIHNyc05hbWU9XCIke3Nyc05hbWV9XCJgIDogJycpfT5gO1xuICBmb3IgKGxldCBtZW1iZXIgb2YgZ2VvbSl7XG4gICAgdmFyIF9tZW1iZXJQcmVmaXggPSAnJztcbiAgICBpZiAobWVtYmVyLnR5cGUpe1xuICAgICAgLy8gZ2VvbWV0cnlDb2xsZWN0aW9uOiBtZW1iZXJQcmVmaXggc2hvdWxkIGJlICcnLFxuICAgICAgbWVtYmVyUHJlZml4ID0gbG93ZXJGaXJzdExldHRlcihtZW1iZXIudHlwZSk7XG4gICAgICBtZW1iZXIgPSBtZW1iZXIuY29vcmRpbmF0ZXM7XG4gICAgfVxuICAgIGlmICghbWVtYmVyUHJlZml4KXtcbiAgICAgIHRocm93ICd1bi10eXBlZCBtZW1iZXIgJyArIEpTT04uc3RyaW5naWZ5KG1lbWJlcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIF9tZW1iZXJQcmVmaXggPSBjYXBpdGFsaXplRmlyc3RMZXR0ZXIobWVtYmVyUHJlZml4KTtcbiAgICB9XG4gICAgbGV0IGlubmVyID0gKGNiW19tZW1iZXJQcmVmaXhdIHx8IGNiKShtZW1iZXIsIHNyc05hbWU9JycpO1xuICAgIG11bHRpICs9IGA8Z21sOiR7bWVtYmVyUHJlZml4fU1lbWJlcj4ke2lubmVyfTwvZ21sOiR7bWVtYmVyUHJlZml4fU1lbWJlcj5gO1xuICB9XG4gIG11bHRpICs9IGA8L2dtbDoke25hbWV9PmA7XG4gIHJldHVybiBtdWx0aTtcbn1cbi8qKlxuICogY29udmVydHMgYSBnZW9qc29uIGdlb21ldHJ5IE11bHRpUG9pbnQgdG8gZ21sXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7bnVtYmVyW11bXX0gY29vcmRzIHRoZSBjb29yZGluYXRlcyBtZW1iZXIgb2YgdGhlIGdlb21ldHJ5XG4gKiBAcGFyYW0ge3N0cmluZ3x1bmRlZmluZWR9IHNyc05hbWUgYSBzdHJpbmcgc3BlY2lmeWluZyBTUlNcbiAqIEByZXR1cm5zIHtzdHJpbmd9IGEgc3RyaW5nIG9mIGdtbCBkZXNjcmliaW5nIHRoZSBpbnB1dCBnZW9tZXRyeVxuICogQHNlZSBfbXVsdGlcbiAqIEBzZWUgUG9pbnRcbiAqL1xuZnVuY3Rpb24gTXVsdGlQb2ludChjb29yZHMsIHNyc05hbWUpe1xuICByZXR1cm4gX211bHRpKGNvb3JkcywgJ011bHRpUG9pbnQnLCBQb2ludCwgc3JzTmFtZSwgJ3BvaW50Jyk7XG59XG4vKipcbiAqIGNvbnZlcnRzIGEgZ2VvanNvbiBnZW9tZXRyeSBNdWx0aUxpbmVTdHJpbmcgdG8gZ21sXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7bnVtYmVyW11bXVtdfSBjb29yZHMgdGhlIGNvb3JkaW5hdGVzIG1lbWJlciBvZiB0aGUgZ2VvbWV0cnlcbiAqIEBwYXJhbSB7c3RyaW5nfHVuZGVmaW5lZH0gc3JzTmFtZSBhIHN0cmluZyBzcGVjaWZ5aW5nIFNSU1xuICogQHJldHVybnMge3N0cmluZ30gYSBzdHJpbmcgb2YgZ21sIGRlc2NyaWJpbmcgdGhlIGlucHV0IGdlb21ldHJ5XG4gKiBAc2VlIF9tdWx0aVxuICogQHNlZSBMaW5lU3RyaW5nXG4gKi9cbmZ1bmN0aW9uIE11bHRpTGluZVN0cmluZyhjb29yZHMsIHNyc05hbWUpe1xuICByZXR1cm4gX211bHRpKGNvb3JkcywgJ011bHRpTGluZVN0cmluZycsIExpbmVTdHJpbmcsIHNyc05hbWUsICdsaW5lU3RyaW5nJyk7XG59XG4vKipcbiAqIGNvbnZlcnRzIGEgZ2VvanNvbiBnZW9tZXRyeSBNdWx0aVBvbHlnb24gdG8gZ21sXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7bnVtYmVyW11bXVtdW119IGNvb3JkcyB0aGUgY29vcmRpbmF0ZXMgbWVtYmVyIG9mIHRoZSBnZW9tZXRyeVxuICogQHBhcmFtIHtzdHJpbmd8dW5kZWZpbmVkfSBzcnNOYW1lIGEgc3RyaW5nIHNwZWNpZnlpbmcgU1JTXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBhIHN0cmluZyBvZiBnbWwgZGVzY3JpYmluZyB0aGUgaW5wdXQgZ2VvbWV0cnlcbiAqIEBzZWUgX211bHRpXG4gKiBAc2VlIFBvbHlnb25cbiAqL1xuZnVuY3Rpb24gTXVsdGlQb2x5Z29uKGNvb3Jkcywgc3JzTmFtZSl7XG4gIHJldHVybiBfbXVsdGkoY29vcmRzLCAnTXVsdGlQb2x5Z29uJywgUG9seWdvbiwgc3JzTmFtZSwgJ3BvbHlnb24nKTtcbn1cbmNvbnN0IGNvbnZlcnRlciA9IHtcbiAgUG9pbnQsIExpbmVTdHJpbmcsIExpbmVhclJpbmcsIFBvbHlnb24sXG4gIE11bHRpUG9pbnQsIE11bHRpTGluZVN0cmluZywgTXVsdGlQb2x5Z29uLCBHZW9tZXRyeUNvbGxlY3Rpb25cbn07XG5cbi8qKlxuICogY29udmVydHMgYSBnZW9qc29uIGdlb21ldHJ5IEdlb21ldHJ5Q29sbGVjdGlvbiB0byBnbWwgTXVsdGlHZW9tZXRyeVxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge09iamVjdFtdfSBnZW9tcyBhbiBhcnJheSBvZiBnZW9qc29uIGdlb21ldHJ5IG9iamVjdHNcbiAqIEBwYXJhbSB7c3RyaW5nfHVuZGVmaW5lZH0gc3JzTmFtZSBhIHN0cmluZyBzcGVjaWZ5aW5nIFNSU1xuICogQHJldHVybnMge3N0cmluZ30gYSBzdHJpbmcgb2YgZ21sIGRlc2NyaWJpbmcgdGhlIGlucHV0IEdlb21ldHJ5Q29sbGVjdGlvblxuICogQHNlZSBfbXVsdGlcbiAqL1xuZnVuY3Rpb24gR2VvbWV0cnlDb2xsZWN0aW9uKGdlb21zLCBzcnNOYW1lKXtcbiAgcmV0dXJuIF9tdWx0aShnZW9tcywgJ011bHRpR2VvbWV0cnknLCBjb252ZXJ0ZXIsIHNyc05hbWUsICdnZW9tZXRyeScpO1xufVxuXG4vKipcbiAqIFRyYW5zbGF0ZSBnZW9qc29uIHRvIGdtbCAyLjEuMiBmb3IgYW55IGdlb2pzb24gZ2VvbWV0cnkgdHlwZVxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge09iamVjdH0gZ2VvbSBhIGdlb2pzb24gZ2VvbWV0cnkgb2JqZWN0XG4gKiBAcGFyYW0ge3N0cmluZ3x1bmRlZmluZWR9IHNyc05hbWUgYSBzdHJpbmcgc3BlY2lmeWluZyBTUlNcbiAqIEByZXR1cm5zIHtzdHJpbmd9IGEgc3RyaW5nIG9mIGdtbCBkZXNjcmliaW5nIHRoZSBpbnB1dCBnZW9tZXRyeVxuICovXG5mdW5jdGlvbiBnZW9tVG9HbWwoZ2VvbSwgc3JzTmFtZT0nRVBTRzo0MzI2Jyl7XG4gIHJldHVybiBjb252ZXJ0ZXJbZ2VvbS50eXBlXShnZW9tLmNvb3JkaW5hdGVzIHx8IGdlb20uZ2VvbWV0cmllcywgc3JzTmFtZSk7XG59XG4vKiogZXhwb3J0cyBhIGZ1bmN0aW9uIHRvIGNvbnZlcnQgZ2VvanNvbiBnZW9tZXRyaWVzIHRvIGdtbCAyLjEuMiAqL1xuZXhwb3J0IHtcbiAgZ2VvbVRvR21sLCBQb2ludCwgTGluZVN0cmluZywgTGluZWFyUmluZywgUG9seWdvbixcbiAgTXVsdGlQb2ludCwgTXVsdGlMaW5lU3RyaW5nLCBNdWx0aVBvbHlnb24sIEdlb21ldHJ5Q29sbGVjdGlvbixcbiAgc2V0Q29vcmRpbmF0ZU9yZGVyXG59O1xuIiwiLyogZXNsaW50LWRpc2FibGUgbm8tY29uc29sZSAqL1xuLyogXG4gTm90ZSB0aGlzIGNhbiBvbmx5IGNvbnZlcnQgd2hhdCBnZW9qc29uIGNhbiBzdG9yZTogc2ltcGxlIGZlYXR1cmUgdHlwZXMsIG5vdFxuIGNvdmVyYWdlLCB0b3BvbG9neSwgZXRjLlxuICovXG5cbi8qKiBcbiAqIGdlb2pzb24gY29vcmRpbmF0ZXMgYXJlIGluIGxvbmdpdHVkZS9lYXN0aW5nLCBsYXRpdHVkZS9ub3J0aGluZyBbLGVsZXZhdGlvbl1cbiAqIG9yZGVyIGJ5IFtSRkMtNzk0NiDCpyAzLjEuMV17QGxpbmsgaHR0cHM6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzc5NDYjc2VjdGlvbi0zLjEuMX0uXG4gKiBob3dldmVyLCB5b3UgbWF5IHVzZSBhIENSUyB0aGF0IGZvbGxvd3MgYSBsYXRpdHVkZS9lYXN0aW5nLFxuICogbG9uZ2l0dWRlL25vcnRoaW5nLCBbLGVsZXZhdGlvbl0gb3JkZXIuXG4gKi9cbnZhciBjb29yZGluYXRlT3JkZXIgPSB0cnVlO1xuY29uc3Qgc2V0Q29vcmRpbmF0ZU9yZGVyID0gKG9yZGVyKSA9PiBjb29yZGluYXRlT3JkZXIgPSBvcmRlcjtcbmZ1bmN0aW9uIG9yZGVyQ29vcmRzKGNvb3Jkcyl7XG4gIGlmIChjb29yZGluYXRlT3JkZXIpe1xuICAgIHJldHVybiBjb29yZHM7XG4gIH0gXG4gIGlmIChjb29yZHNbMl0pe1xuICAgIHJldHVybiBbY29vcmRzWzFdLCBjb29yZHNbMF0sIGNvb3Jkc1syXV07XG4gIH0gXG4gIHJldHVybiBjb29yZHMucmV2ZXJzZSgpO1xufVxuXG5cblxuLyoqIEBwcml2YXRlKi9cbmZ1bmN0aW9uIGF0dHJzKGF0dHJNYXBwaW5ncyl7XG4gIGxldCByZXN1bHRzID0gJyc7XG4gIGZvciAobGV0IGF0dHJOYW1lIGluIGF0dHJNYXBwaW5ncyl7XG4gICAgbGV0IHZhbHVlID0gYXR0ck1hcHBpbmdzW2F0dHJOYW1lXTtcbiAgICByZXN1bHRzICs9ICh2YWx1ZSA/IGAgJHthdHRyTmFtZX09XCIke3ZhbHVlfVwiYCA6ICcnKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0cztcbn1cblxuLyoqXG4gKiBjaGVja3Mgb3V0ZXIgc2NvcGUgZm9yIGdtbElkIGFyZ3VtZW50L3ZhcmlhYmxlXG4gKiBAZnVuY3Rpb24gXG4gKi9cbmNvbnN0IGVuZm9yY2VHbWxJZCA9IChnbWxJZCkgPT57XG4gIGlmICghZ21sSWQpe1xuICAgIGNvbnNvbGUud2FybignTm8gZ21sSWQgc3VwcGxpZWQnKTtcbiAgfVxufTtcblxuLyoqXG4gKiBBIGhhbmRsZXIgdG8gY29tcGlsZSBnZW9tZXRyaWVzIHRvIG11bHRpZ2VvbWV0cmllc1xuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSB0aGUgbmFtZSBvZiB0aGUgdGFyZ2V0IG11bHRpZ2VvbWV0cnlcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZW1iZXJOYW1lIHRoZSBnbWw6dGFnIG9mIGVhY2ggbXVsdGlnZW9tZXRyeSBtZW1iZXIuXG4gKiBAcGFyYW0ge09iamVjdFtdfEFycmF5fSBnZW9tIGFuIGFycmF5IG9mIGdlb2pzb24gZ2VvbWV0cmllc1xuICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfSBnbWxJZCB0aGUgZ21sOmlkIG9mIHRoZSBtdWx0aWdlb21ldHJ5XG4gKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIG9wdGlvbmFsIHBhcmFtZXRlcnMuIE9taXQgZ21sSWRzIGF0IHlvdXIgb3duIHJpc2ssIGhvd2V2ZXIuXG4gKiBAcGFyYW0ge3N0cmluZ3x1bmRlZmluZWR9IHBhcmFtcy5zcnNOYW1lIGFzIHN0cmluZyBzcGVjaWZ5aW5nIFNSU1xuICogQHBhcmFtIHtudW1iZXJbXXxzdHJpbmdbXX0gcGFyYW1zLmdtbElkcyBhbiBhcnJheSBvZiBudW1iZXIvc3RyaW5nIGdtbDppZHMgb2YgdGhlIG1lbWJlciBnZW9tZXRyaWVzLlxuICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfHVuZGVmaW5lZH0gcGFyYW1zLnNyc0RpbWVuc2lvbiB0aGUgZGltZW5zaW9uYWxpdHkgb2YgZWFjaCBjb29yZGluYXRlLCBpLmUuIDIgb3IgMy5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IGEgc3RyaW5nIGNvbnRhaW5pbmcgZ21sIGRlc2NyaWJpbmcgdGhlIGlucHV0IG11bHRpZ2VvbWV0cnlcbiAqIEB0aHJvd3Mge0Vycm9yfSBpZiBhIG1lbWJlciBnZW9tZXRyeSBjYW5ub3QgYmUgY29udmVydGVkIHRvIGdtbFxuICovXG5mdW5jdGlvbiBtdWx0aShuYW1lLCBtZW1iZXJOYW1lLCBtZW1iZXJjYiwgZ2VvbSwgZ21sSWQsIHBhcmFtcz17fSl7XG4gIGVuZm9yY2VHbWxJZChnbWxJZCk7XG4gIHZhciB7c3JzTmFtZSwgZ21sSWRzfSA9IHBhcmFtcztcbiAgbGV0IG11bHRpID0gYDxnbWw6JHtuYW1lfSR7YXR0cnMoe3Nyc05hbWUsICdnbWw6aWQnOmdtbElkfSl9PmA7XG4gIG11bHRpICs9IGA8Z21sOiR7bWVtYmVyTmFtZX0+YDtcbiAgZ2VvbS5mb3JFYWNoKGZ1bmN0aW9uKG1lbWJlciwgaSl7XG4gICAgbGV0IF9nbWxJZCA9IG1lbWJlci5pZCB8fCAoZ21sSWRzIHx8IFtdKVtpXSB8fCAnJztcbiAgICBpZiAobmFtZSA9PSAnTXVsdGlHZW9tZXRyeScpe1xuICAgICAgbGV0IG1lbWJlclR5cGUgPSBtZW1iZXIudHlwZTtcbiAgICAgIG1lbWJlciA9IG1lbWJlci5jb29yZGluYXRlcztcbiAgICAgIG11bHRpICs9IG1lbWJlcmNiW21lbWJlclR5cGVdKG1lbWJlciwgX2dtbElkLCBwYXJhbXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBtdWx0aSArPSBtZW1iZXJjYihtZW1iZXIsIF9nbWxJZCwgcGFyYW1zKTtcbiAgICB9XG4gIH0pO1xuICBtdWx0aSArPSBgPC9nbWw6JHttZW1iZXJOYW1lfT5gO1xuICByZXR1cm4gbXVsdGkgKyBgPC9nbWw6JHtuYW1lfT5gO1xufVxuLyoqXG4gKiBDb252ZXJ0cyBhbiBpbnB1dCBnZW9qc29uIFBvaW50IGdlb21ldHJ5IHRvIGdtbFxuICogQGZ1bmN0aW9uIFxuICogQHBhcmFtIHtudW1iZXJbXX0gY29vcmRzIHRoZSBjb29yZGluYXRlcyBtZW1iZXIgb2YgdGhlIGdlb2pzb24gZ2VvbWV0cnlcbiAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcn0gZ21sSWQgdGhlIGdtbDppZFxuICogQHBhcmFtIHtPYmplY3R9IHBhcmFtcyBvcHRpb25hbCBwYXJhbWV0ZXJzXG4gKiBAcGFyYW0ge3N0cmluZ3x1bmRlZmluZWR9IHBhcmFtcy5zcnNOYW1lIGFzIHN0cmluZyBzcGVjaWZ5aW5nIFNSU1xuICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfHVuZGVmaW5lZH0gcGFyYW1zLnNyc0RpbWVuc2lvbiB0aGUgZGltZW5zaW9uYWxpdHkgb2YgZWFjaCBjb29yZGluYXRlLCBpLmUuIDIgb3IgMy5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IGEgc3RyaW5nIGNvbnRhaW5pbmcgZ21sIHJlcHJlc2VudGluZyB0aGUgaW5wdXQgZ2VvbWV0cnlcbiAqL1xuZnVuY3Rpb24gUG9pbnQoY29vcmRzLCBnbWxJZCwgcGFyYW1zPXt9KXtcbiAgZW5mb3JjZUdtbElkKGdtbElkKTtcbiAgdmFyIHtzcnNOYW1lOnNyc05hbWUsIHNyc0RpbWVuc2lvbjpzcnNEaW1lbnNpb259ID0gcGFyYW1zO1xuICByZXR1cm4gYDxnbWw6UG9pbnQke2F0dHJzKHtzcnNOYW1lOnNyc05hbWUsICdnbWw6aWQnOiBnbWxJZH0pfT5gICtcbiAgICBgPGdtbDpwb3Mke2F0dHJzKHtzcnNEaW1lbnNpb259KX0+YCArXG4gICAgb3JkZXJDb29yZHMoY29vcmRzKS5qb2luKCcgJykgK1xuICAgICc8L2dtbDpwb3M+JyArXG4gICAgJzwvZ21sOlBvaW50Pic7XG59XG4vKipcbiAqIENvbnZlcnRzIGFuIGlucHV0IGdlb2pzb24gTGluZVN0cmluZyBnZW9tZXRyeSB0byBnbWxcbiAqIEBmdW5jdGlvbiBcbiAqIEBwYXJhbSB7bnVtYmVyW11bXX0gY29vcmRzIHRoZSBjb29yZGluYXRlcyBtZW1iZXIgb2YgdGhlIGdlb2pzb24gZ2VvbWV0cnlcbiAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcn0gZ21sSWQgdGhlIGdtbDppZFxuICogQHBhcmFtIHtPYmplY3R9IHBhcmFtcyBvcHRpb25hbCBwYXJhbWV0ZXJzXG4gKiBAcGFyYW0ge3N0cmluZ3x1bmRlZmluZWR9IHBhcmFtcy5zcnNOYW1lIGFzIHN0cmluZyBzcGVjaWZ5aW5nIFNSU1xuICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfHVuZGVmaW5lZH0gcGFyYW1zLnNyc0RpbWVuc2lvbiB0aGUgZGltZW5zaW9uYWxpdHkgb2YgZWFjaCBjb29yZGluYXRlLCBpLmUuIDIgb3IgMy5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IGEgc3RyaW5nIGNvbnRhaW5pbmcgZ21sIHJlcHJlc2VudGluZyB0aGUgaW5wdXQgZ2VvbWV0cnlcbiAqL1xuZnVuY3Rpb24gTGluZVN0cmluZyhjb29yZHMsIGdtbElkLCBwYXJhbXM9e30pe1xuICBlbmZvcmNlR21sSWQoZ21sSWQpO1xuICB2YXIge3Nyc05hbWU6c3JzTmFtZSwgc3JzRGltZW5zaW9uOnNyc0RpbWVuc2lvbn0gPSBwYXJhbXM7XG4gIHJldHVybiBgPGdtbDpMaW5lU3RyaW5nJHthdHRycyh7c3JzTmFtZSwgJ2dtbDppZCc6Z21sSWR9KX0+YCArXG4gICAgYDxnbWw6cG9zTGlzdCR7YXR0cnMoe3Nyc0RpbWVuc2lvbn0pfT5gICtcbiAgICBjb29yZHMubWFwKChlKT0+b3JkZXJDb29yZHMoZSkuam9pbignICcpKS5qb2luKCcgJykgKyBcbiAgICAnPC9nbWw6cG9zTGlzdD4nICtcbiAgICAnPC9nbWw6TGluZVN0cmluZz4nO1xufVxuLyoqXG4gKiBDb252ZXJ0cyBhbiBpbnB1dCBnZW9qc29uIExpbmVhclJpbmcgbWVtYmVyIG9mIGEgcG9seWdvbiBnZW9tZXRyeSB0byBnbWxcbiAqIEBmdW5jdGlvbiBcbiAqIEBwYXJhbSB7bnVtYmVyW11bXX0gY29vcmRzIHRoZSBjb29yZGluYXRlcyBtZW1iZXIgb2YgdGhlIGdlb2pzb24gZ2VvbWV0cnlcbiAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcn0gZ21sSWQgdGhlIGdtbDppZFxuICogQHBhcmFtIHtPYmplY3R9IHBhcmFtcyBvcHRpb25hbCBwYXJhbWV0ZXJzXG4gKiBAcGFyYW0ge3N0cmluZ3x1bmRlZmluZWR9IHBhcmFtcy5zcnNOYW1lIGFzIHN0cmluZyBzcGVjaWZ5aW5nIFNSU1xuICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfHVuZGVmaW5lZH0gcGFyYW1zLnNyc0RpbWVuc2lvbiB0aGUgZGltZW5zaW9uYWxpdHkgb2YgZWFjaCBjb29yZGluYXRlLCBpLmUuIDIgb3IgMy5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IGEgc3RyaW5nIGNvbnRhaW5pbmcgZ21sIHJlcHJlc2VudGluZyB0aGUgaW5wdXQgZ2VvbWV0cnlcbiAqL1xuZnVuY3Rpb24gTGluZWFyUmluZyhjb29yZHMsIGdtbElkLCBwYXJhbXM9e30pe1xuICBlbmZvcmNlR21sSWQoZ21sSWQpO1xuICB2YXIge3Nyc05hbWU6c3JzTmFtZSwgc3JzRGltZW5zaW9uOnNyc0RpbWVuc2lvbn0gPSBwYXJhbXM7XG4gIHJldHVybiBgPGdtbDpMaW5lYXJSaW5nJHthdHRycyh7J2dtbDppZCc6Z21sSWQsIHNyc05hbWV9KX0+YCArXG4gICAgYDxnbWw6cG9zTGlzdCR7YXR0cnMoe3Nyc0RpbWVuc2lvbn0pfT5gICtcbiAgICBjb29yZHMubWFwKChlKT0+b3JkZXJDb29yZHMoZSkuam9pbignICcpKS5qb2luKCcgJykgKyBcbiAgICAnPC9nbWw6cG9zTGlzdD4nICsgXG4gICAgJzwvZ21sOkxpbmVhclJpbmc+Jztcbn1cbi8qKlxuICogQ29udmVydHMgYW4gaW5wdXQgZ2VvanNvbiBQb2x5Z29uIGdlb21ldHJ5IHRvIGdtbFxuICogQGZ1bmN0aW9uIFxuICogQHBhcmFtIHtudW1iZXJbXVtdW119IGNvb3JkcyB0aGUgY29vcmRpbmF0ZXMgbWVtYmVyIG9mIHRoZSBnZW9qc29uIGdlb21ldHJ5XG4gKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ9IGdtbElkIHRoZSBnbWw6aWRcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbXMgb3B0aW9uYWwgcGFyYW1ldGVyc1xuICogQHBhcmFtIHtzdHJpbmd8dW5kZWZpbmVkfSBwYXJhbXMuc3JzTmFtZSBhcyBzdHJpbmcgc3BlY2lmeWluZyBTUlNcbiAqIEBwYXJhbSB7bnVtYmVyfHN0cmluZ3x1bmRlZmluZWR9IHBhcmFtcy5zcnNEaW1lbnNpb24gdGhlIGRpbWVuc2lvbmFsaXR5IG9mIGVhY2ggY29vcmRpbmF0ZSwgaS5lLiAyIG9yIDMuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBhIHN0cmluZyBjb250YWluaW5nIGdtbCByZXByZXNlbnRpbmcgdGhlIGlucHV0IGdlb21ldHJ5XG4gKi9cbmZ1bmN0aW9uIFBvbHlnb24oY29vcmRzLCBnbWxJZCwgcGFyYW1zPXt9KXtcbiAgZW5mb3JjZUdtbElkKGdtbElkKTtcbiAgLy8gZ2VvbS5jb29yZGluYXRlcyBhcmUgYXJyYXlzIG9mIExpbmVhclJpbmdzXG4gIHZhciB7c3JzTmFtZX0gPSBwYXJhbXM7XG4gIGxldCBwb2x5Z29uID0gYDxnbWw6UG9seWdvbiR7YXR0cnMoe3Nyc05hbWUsICdnbWw6aWQnOmdtbElkfSl9PmAgK1xuICAgICAgICAnPGdtbDpleHRlcmlvcj4nICtcbiAgICAgICAgTGluZWFyUmluZyhjb29yZHNbMF0pICtcbiAgICAgICAgJzwvZ21sOmV4dGVyaW9yPic7XG4gIGlmIChjb29yZHMubGVuZ3RoID49IDIpe1xuICAgIGZvciAobGV0IGxpbmVhclJpbmcgb2YgY29vcmRzLnNsaWNlKDEpKXtcbiAgICAgIHBvbHlnb24gKz0gJzxnbWw6aW50ZXJpb3I+JyArXG4gICAgICAgIExpbmVhclJpbmcobGluZWFyUmluZykgKyBcbiAgICAgICAgJzwvZ21sOmludGVyaW9yPic7XG4gICAgfVxuICB9XG4gIHBvbHlnb24gKz0gJzwvZ21sOlBvbHlnb24+JztcbiAgcmV0dXJuIHBvbHlnb247XG59XG4vKipcbiAqIENvbnZlcnRzIGFuIGlucHV0IGdlb2pzb24gTXVsdGlQb2ludCBnZW9tZXRyeSB0byBnbWxcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtudW1iZXJbXVtdfSBjb29yZHMgdGhlIGNvb3JkaW5hdGVzIG1lbWJlciBvZiB0aGUgZ2VvanNvbiBnZW9tZXRyeVxuICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfSBnbWxJZCB0aGUgZ21sOmlkXG4gKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIG9wdGlvbmFsIHBhcmFtZXRlcnNcbiAqIEBwYXJhbSB7c3RyaW5nfHVuZGVmaW5lZH0gcGFyYW1zLnNyc05hbWUgYXMgc3RyaW5nIHNwZWNpZnlpbmcgU1JTXG4gKiBAcGFyYW0ge251bWJlcnxzdHJpbmd8dW5kZWZpbmVkfSBwYXJhbXMuc3JzRGltZW5zaW9uIHRoZSBkaW1lbnNpb25hbGl0eSBvZiBlYWNoIGNvb3JkaW5hdGUsIGkuZS4gMiBvciAzLlxuICogQHJldHVybnMge3N0cmluZ30gYSBzdHJpbmcgY29udGFpbmluZyBnbWwgcmVwcmVzZW50aW5nIHRoZSBpbnB1dCBnZW9tZXRyeVxuICovXG5mdW5jdGlvbiBNdWx0aVBvaW50KGNvb3JkcywgZ21sSWQsIHBhcmFtcz17fSl7XG4gIGVuZm9yY2VHbWxJZChnbWxJZCk7XG4gIHJldHVybiBtdWx0aSgnTXVsdGlQb2ludCcsICdwb2ludE1lbWJlcnMnLCBQb2ludCwgY29vcmRzLCBnbWxJZCwgcGFyYW1zKTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyBhbiBpbnB1dCBnZW9qc29uIE11bHRpTGluZVN0cmluZyBnZW9tZXRyeSB0byBnbWxcbiAqIEBmdW5jdGlvbiBcbiAqIEBwYXJhbSB7bnVtYmVyW11bXVtdfSBjb29yZHMgdGhlIGNvb3JkaW5hdGVzIG1lbWJlciBvZiB0aGUgZ2VvanNvbiBnZW9tZXRyeVxuICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfSBnbWxJZCB0aGUgZ21sOmlkXG4gKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIG9wdGlvbmFsIHBhcmFtZXRlcnNcbiAqIEBwYXJhbSB7c3RyaW5nfHVuZGVmaW5lZH0gcGFyYW1zLnNyc05hbWUgYXMgc3RyaW5nIHNwZWNpZnlpbmcgU1JTXG4gKiBAcGFyYW0ge251bWJlcnxzdHJpbmd8dW5kZWZpbmVkfSBwYXJhbXMuc3JzRGltZW5zaW9uIHRoZSBkaW1lbnNpb25hbGl0eSBvZiBlYWNoIGNvb3JkaW5hdGUsIGkuZS4gMiBvciAzLlxuICogQHJldHVybnMge3N0cmluZ30gYSBzdHJpbmcgY29udGFpbmluZyBnbWwgcmVwcmVzZW50aW5nIHRoZSBpbnB1dCBnZW9tZXRyeVxuICovXG5mdW5jdGlvbiBNdWx0aUxpbmVTdHJpbmcoY29vcmRzLCBnbWxJZCwgcGFyYW1zPXt9KXtcbiAgcmV0dXJuIG11bHRpKCdNdWx0aUN1cnZlJywgJ2N1cnZlTWVtYmVycycsIExpbmVTdHJpbmcsIGNvb3JkcywgZ21sSWQsIHBhcmFtcyk7XG59XG4vKipcbiAqIENvbnZlcnRzIGFuIGlucHV0IGdlb2pzb24gTXVsdGlQb2x5Z29uIGdlb21ldHJ5IHRvIGdtbFxuICogQGZ1bmN0aW9uIFxuICogQHBhcmFtIHtudW1iZXJbXVtdW11bXX0gY29vcmRzIHRoZSBjb29yZGluYXRlcyBtZW1iZXIgb2YgdGhlIGdlb2pzb24gZ2VvbWV0cnlcbiAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcn0gZ21sSWQgdGhlIGdtbDppZFxuICogQHBhcmFtIHtPYmplY3R9IHBhcmFtcyBvcHRpb25hbCBwYXJhbWV0ZXJzXG4gKiBAcGFyYW0ge3N0cmluZ3x1bmRlZmluZWR9IHBhcmFtcy5zcnNOYW1lIGFzIHN0cmluZyBzcGVjaWZ5aW5nIFNSU1xuICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfHVuZGVmaW5lZH0gcGFyYW1zLnNyc0RpbWVuc2lvbiB0aGUgZGltZW5zaW9uYWxpdHkgb2YgZWFjaCBjb29yZGluYXRlLCBpLmUuIDIgb3IgMy5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IGEgc3RyaW5nIGNvbnRhaW5pbmcgZ21sIHJlcHJlc2VudGluZyB0aGUgaW5wdXQgZ2VvbWV0cnlcbiAqL1xuZnVuY3Rpb24gTXVsdGlQb2x5Z29uKGNvb3JkcywgZ21sSWQsIHBhcmFtcz17fSl7XG4gIHJldHVybiBtdWx0aSgnTXVsdGlTdXJmYWNlJywgJ3N1cmZhY2VNZW1iZXJzJywgUG9seWdvbiwgY29vcmRzLCBnbWxJZCwgcGFyYW1zKTtcbn1cbi8qKiBAY29uc3QgXG4gKiBAZGVzYyBhIG5hbWVzcGFjZSB0byBzd2l0Y2ggYmV0d2VlbiBnZW9qc29uLWhhbmRsaW5nIGZ1bmN0aW9ucyBieSBnZW9qc29uLnR5cGVcbiAqL1xuY29uc3QgY29udmVydGVyID0ge1xuICBQb2ludCwgTGluZVN0cmluZywgTGluZWFyUmluZywgUG9seWdvbiwgTXVsdGlQb2ludCwgTXVsdGlMaW5lU3RyaW5nLFxuICBNdWx0aVBvbHlnb24sIEdlb21ldHJ5Q29sbGVjdGlvblxufTtcbi8qKlxuICogQ29udmVydHMgYW4gaW5wdXQgZ2VvanNvbiBHZW9tZXRyeUNvbGxlY3Rpb24gZ2VvbWV0cnkgdG8gZ21sXG4gKiBAZnVuY3Rpb24gXG4gKiBAcGFyYW0ge09iamVjdFtdfSBjb29yZHMgdGhlIGNvb3JkaW5hdGVzIG1lbWJlciBvZiB0aGUgZ2VvanNvbiBnZW9tZXRyeVxuICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfSBnbWxJZCB0aGUgZ21sOmlkXG4gKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIG9wdGlvbmFsIHBhcmFtZXRlcnNcbiAqIEBwYXJhbSB7c3RyaW5nfHVuZGVmaW5lZH0gcGFyYW1zLnNyc05hbWUgYXMgc3RyaW5nIHNwZWNpZnlpbmcgU1JTXG4gKiBAcGFyYW0ge251bWJlcnxzdHJpbmd8dW5kZWZpbmVkfSBwYXJhbXMuc3JzRGltZW5zaW9uIHRoZSBkaW1lbnNpb25hbGl0eSBvZiBlYWNoIGNvb3JkaW5hdGUsIGkuZS4gMiBvciAzLlxuICogQHJldHVybnMge3N0cmluZ30gYSBzdHJpbmcgY29udGFpbmluZyBnbWwgcmVwcmVzZW50aW5nIHRoZSBpbnB1dCBnZW9tZXRyeVxuICovXG5mdW5jdGlvbiBHZW9tZXRyeUNvbGxlY3Rpb24oZ2VvbXMsIGdtbElkLCBwYXJhbXM9e30pe1xuICByZXR1cm4gbXVsdGkoJ011bHRpR2VvbWV0cnknLCAnZ2VvbWV0cnlNZW1iZXJzJywgY29udmVydGVyLFxuICAgICAgICAgICAgICAgZ2VvbXMsIGdtbElkLCBwYXJhbXMpO1xufVxuXG4vKipcbiAqIFRyYW5zbGF0ZXMgYW55IGdlb2pzb24gZ2VvbWV0cnkgaW50byBHTUwgMy4yLjFcbiAqIEBwdWJsaWMgXG4gKiBAZnVuY3Rpb24gXG4gKiBAcGFyYW0ge09iamVjdH0gZ2VvbSBhIGdlb2pzb24gZ2VvbWV0cnkgb2JqZWN0XG4gKiBAcGFyYW0ge0FycmF5fHVuZGVmaW5lZH0gZ2VvbS5jb29yZGluYXRlcyB0aGUgbmVzdGVkIGFycmF5IG9mIGNvb3JkaW5hdGVzIGZvcm1pbmcgdGhlIGdlb21ldHJ5XG4gKiBAcGFyYW0ge09iamVjdFtdfHVuZGVmaW5lZH0gZ2VvbS5nZW9tZXRyaWVzIGZvciBhIEdlb21ldHJ5Q29sbGVjdGlvbiBvbmx5LCB0aGUgYXJyYXkgb2YgbWVtYmVyIGdlb21ldHJ5IG9iamVjdHNcbiAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcn0gZ21sSWQgdGhlIGdtbDppZCBvZiB0aGUgZ2VvbWV0cnlcbiAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXMgb3B0aW9uYWwgcGFyYW1ldGVyc1xuICogQHBhcmFtIHtzdHJpbmd8dW5kZWZpbmVkfSBwYXJhbXMuc3JzTmFtZSBhIHN0cmluZyBzcGVjaWZ5aW5nIHRoZSBTUlNcbiAqIEBwYXJhbSB7c3RyaW5nfHVuZGVmaW5lZH0gcGFyYW1zLnNyc0RpbWVuc2lvbiB0aGUgZGltZW5zaW9uYWxpdHkgb2YgZWFjaCBjb29yZGluYXRlLCBpLmUuIDIgb3IgMy5cbiAqIEBwYXJhbSB7bnVtYmVyW118c3RyaW5nW118dW5kZWZpbmVkfSBnbWxJZHMgIGFuIGFycmF5IG9mIG51bWJlci9zdHJpbmcgZ21sOmlkcyBvZiB0aGUgbWVtYmVyIGdlb21ldHJpZXMgb2YgYSBtdWx0aWdlb21ldHJ5LlxuICogQHJldHVybnMge3N0cmluZ30gYSB2YWxpZCBnbWwgc3RyaW5nIGRlc2NyaWJpbmcgdGhlIGlucHV0IGdlb2pzb24gZ2VvbWV0cnlcbiAqL1xuZnVuY3Rpb24gZ2VvbVRvR21sKGdlb20sIGdtbElkLCBwYXJhbXMpe1xuICByZXR1cm4gY29udmVydGVyW2dlb20udHlwZV0oXG4gICAgZ2VvbS5jb29yZGluYXRlcyB8fCBnZW9tLmdlb21ldHJpZXMsXG4gICAgZ21sSWQsXG4gICAgcGFyYW1zXG4gICk7XG59XG5cbmV4cG9ydCB7XG4gIGdlb21Ub0dtbCwgY29udmVydGVyLCBQb2ludCwgTGluZVN0cmluZywgTGluZWFyUmluZyxcbiAgUG9seWdvbiwgTXVsdGlQb2ludCwgTXVsdGlMaW5lU3RyaW5nLCBNdWx0aVBvbHlnb24sXG4gIHNldENvb3JkaW5hdGVPcmRlclxufTtcbiIsImltcG9ydCB7Z2VvbVRvR21sIGFzIGdtbDN9IGZyb20gJ2dlb2pzb24tdG8tZ21sLTMnO1xuXG4vKiogQGNvbnN0IHtPYmplY3R9IHhtbCAqL1xuY29uc3QgeG1sID0ge1xuICAvKipcbiAgICogVHVybnMgYW4gb2JqZWN0IGludG8gYSBzdHJpbmcgb2YgeG1sIGF0dHJpYnV0ZSBrZXktdmFsdWUgcGFpcnMuXG4gICAqIEBtZW1iZXJPZiB4bWwuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcGFyYW0ge09iamVjdH0gYXR0cnMgYW4gb2JqZWN0IG1hcHBpbmcgYXR0cmlidXRlIG5hbWVzIHRvIGF0dHJpYnV0ZSB2YWx1ZXNcbiAgICogQHJldHVybnMge3N0cmluZ30gYSBzdHJpbmcgb2YgeG1sIGF0dHJpYnV0ZSBrZXktdmFsdWUgcGFpcnNcbiAgICovXG4gICdhdHRycyc6IGZ1bmN0aW9uKGF0dHJzKXtcbiAgICByZXR1cm4gT2JqZWN0LmtleXMoYXR0cnMpXG4gICAgICAubWFwKChhKSA9PiBhdHRyc1thXSA/IGAgJHthfT1cIiR7YXR0cnNbYV19XCJgIDogJycpXG4gICAgICAuam9pbignJyk7XG4gIH0sXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgc3RyaW5nIHhtbCB0YWcuXG4gICAqIEBmdW5jdGlvbiBcbiAgICogQG1lbWJlck9mIHhtbC5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG5zIHRoZSB0YWcncyB4bWwgbmFtZXNwYWNlIGFiYnJldmlhdGlvbi5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHRhZ05hbWUgdGhlIHRhZyBuYW1lLlxuICAgKiBAcGFyYW0ge09iamVjdH0gYXR0cnMgQHNlZSB4bWwuYXR0cnMuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBpbm5lciBpbm5lciB4bWwuXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9IGFuIHhtbCBzdHJpbmcuXG4gICAqL1xuICAndGFnJzogZnVuY3Rpb24obnMsIHRhZ05hbWUsIGF0dHJzLCBpbm5lcil7IC8vIFRPRE86IHNlbGYtY2xvc2luZ1xuICAgIGxldCB0YWcgPSAobnMgPyBgJHtuc306YCA6ICcnKSArIHRhZ05hbWU7XG4gICAgaWYgKHRhZ05hbWUpe1xuICAgICAgcmV0dXJuIGA8JHt0YWd9JHt0aGlzLmF0dHJzKGF0dHJzKX0+JHtpbm5lcn08LyR7dGFnfT5gOyAgIFxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ25vIHRhZyBzdXBwbGllZCAnICsgSlNPTi5zdHJpbmdpZnkoYXJndW1lbnRzKSk7XG4gICAgfVxuICB9XG59O1xuLyoqXG4gKiBTaG9ydGhhbmQgZm9yIGNyZWF0aW5nIGEgd2ZzIHhtbCB0YWcuXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFnTmFtZSBhIHZhbGlkIHdmcyB0YWcgbmFtZS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBhdHRycyBAc2VlIHhtbC5hdHRycy5cbiAqIEBwYXJhbSB7c3RyaW5nfSBpbm5lciBAc2VlIHhtbC50YWcuXG4gKi9cbmNvbnN0IHdmcyA9ICh0YWdOYW1lLCBhdHRycywgaW5uZXIpID0+IHhtbC50YWcoJ3dmcycsIHRhZ05hbWUsIGF0dHJzLCBpbm5lcik7XG4vKipcbiAqIEVuc3VyZXMgdGhlIHJlc3VsdCBpcyBhbiBhcnJheS5cbiAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fSBtYXliZSBhIEdlb0pTT04gRmVhdHVyZSBvciBGZWF0dXJlQ29sbGVjdGlvbiBvYmplY3Qgb3IgYW4gYXJyYXkgdGhlcmVvZi5cbiAqL1xuY29uc3QgZW5zdXJlQXJyYXkgPSAoLi4ubWF5YmUpPT4gKG1heWJlWzBdLmZlYXR1cmVzIHx8IFtdLmNvbmNhdCguLi5tYXliZSkpXG5cdC5maWx0ZXIoKGYpID0+IGYpO1xuLyoqXG4gKiBFbnN1cmVzIGEgbGF5ZXIuaWQgZm9ybWF0IG9mIGFuIGlucHV0IGlkLlxuICogQHBhcmFtIHtzdHJpbmd9IGx5ciBsYXllciBuYW1lXG4gKiBAcGFyYW0ge3N0cmluZ30gaWQgaWQsIHBvc3NpYmx5IGFscmVhZHkgaW4gY29ycmVjdCBsYXllci5pZCBmb3JtYXQuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBhIGNvcnJlY3RseS1mb3JtYXR0ZWQgZ21sOmlkXG4gKi9cbmNvbnN0IGVuc3VyZUlkID0gKGx5ciwgaWQpID0+IC9cXC4vLmV4ZWMoaWQgfHwgJycpID8gaWQgOmAke2x5cn0uJHtpZH1gO1xuLyoqXG4gKiByZXR1cm5zIGEgY29ycmVjdGx5LWZvcm1hdHRlZCB0eXBlTmFtZVxuICogQHBhcmFtIHtzdHJpbmd9IG5zIG5hbWVzcGFjZVxuICogQHBhcmFtIHtzdHJpbmd9IGxheWVyIGxheWVyIG5hbWVcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlTmFtZSB0eXBlTmFtZSB0byBjaGVja1xuICogQHJldHVybnMge3N0cmluZ30gYSBjb3JyZWN0bHktZm9ybWF0dGVkIHR5cGVOYW1lXG4gKiBAdGhyb3dzIHtFcnJvcn0gaWYgdHlwZU5hbWUgaXQgY2Fubm90IGZvcm0gYSB0eXBlTmFtZSBmcm9tIG5zIGFuZCBsYXllclxuICovXG5jb25zdCBlbnN1cmVUeXBlTmFtZSA9IChucywgbGF5ZXIsIHR5cGVOYW1lKSA9PntcbiAgaWYgKCF0eXBlTmFtZSAmJiAhKG5zICYmIGxheWVyKSl7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBubyB0eXBlbmFtZSBwb3NzaWJsZTogJHtKU09OLnN0cmluZ2lmeSh7dHlwZU5hbWUsIG5zLCBsYXllcn0pfWApO1xuICB9XG4gIHJldHVybiB0eXBlTmFtZSB8fCBgJHtuc306JHtsYXllcn1UeXBlYDtcbn07XG5cbi8qKlxuICogU3RhbmRzIGluIGZvciBvdGhlciBmdW5jdGlvbnMgaW4gc3dpY2ggc3RhdGVtZW50cywgZXRjLiBEb2VzIG5vdGhpbmcuXG4gKiBAZnVuY3Rpb24gXG4gKi9cbmNvbnN0IHBhc3MgPSAoKSA9PiAnJztcblxuLyoqXG4gKiBJdGVyYXRlcyBvdmVyIHRoZSBrZXktdmFsdWUgcGFpcnMsIGZpbHRlcmluZyBieSBhIHdoaXRlbGlzdCBpZiBhdmFpbGFibGUuXG4gKiBAcGFyYW0ge0FycmF5PHN0cmluZz59IHdoaXRlbGlzdCBhIHdoaXRlbGlzdCBvZiBwcm9wZXJ0eSBuYW1lc1xuICogQHBhcmFtIHtPYmplY3R9IHByb3BlcnRpZXMgYW4gb2JqZWN0IG1hcHBpbmcgcHJvcGVydHkgbmFtZXMgdG8gdmFsdWVzXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiBhIGZ1bmN0aW9uIHRvIGNhbGwgb24gZWFjaCAod2hpdGVsaXN0ZWQga2V5LCB2YWx1ZSkgcGFpclxuICovXG5jb25zdCB1c2VXaGl0ZWxpc3RJZkF2YWlsYWJsZSA9ICh3aGl0ZWxpc3QsIHByb3BlcnRpZXMsIGNiKSA9PntcbiAgZm9yIChsZXQgcHJvcCBvZiB3aGl0ZWxpc3QgfHwgT2JqZWN0LmtleXMocHJvcGVydGllcykpe1xuICAgIHByb3BlcnRpZXNbcHJvcF0gPyBjYihwcm9wLCBwcm9wZXJ0aWVzW3Byb3BdKSA6IHBhc3MoKTtcbiAgfVxufTtcbi8qKlxuICogQ3JlYXRlcyBhIGZlczpSZXNvdXJjZUlkIGZpbHRlciBmcm9tIGEgbGF5ZXJuYW1lIGFuZCBpZFxuICogQHBhcmFtIHtzdHJpbmd9IGx5ciBsYXllciBuYW1lIG9mIHRoZSBmaWx0ZXJlZCBmZWF0dXJlXG4gKiBAcGFyYW0ge3N0cmluZ30gaWQgZmVhdHVyZSBpZFxuICovXG5jb25zdCBpZEZpbHRlciA9IChseXIsIGlkKSA9PiBgPGZlczpSZXNvdXJjZUlkIHJpZD1cIiR7ZW5zdXJlSWQobHlyLCBpZCl9XCIvPmA7XG5cbmNvbnN0IHVucGFjayA9ICgoKT0+e1xuICBsZXQgZmVhdHVyZU1lbWJlcnMgPSBuZXcgU2V0KFsncHJvcGVydGllcycsICdnZW9tZXRyeScsICdpZCcsICdsYXllciddKTtcbiAgLyoqXG4gICAqIFJlc29sdmVzIGF0dHJpYnV0ZXMgZnJvbSBmZWF0dXJlLCB0aGVuIHBhcmFtcyB1bmxlc3MgdGhleSBhcmUgbm9ybWFsbHlcbiAgICogZm91bmQgaW4gdGhlIGZlYXR1cmVcbiAgICogQHBhcmFtIHtPYmplY3R9IGZlYXR1cmUgYSBnZW9qc29uIGZlYXR1cmVcbiAgICogQHBhcmFtIHtPYmplY3R9IHBhcmFtcyBhbiBvYmplY3Qgb2YgYmFja3VwIC8gb3ZlcnJpZGUgcGFyYW1ldGVyc1xuICAgKiBAcGFyYW0ge0FycmF5PHN0cmluZz59IGFyZ3MgcGFyYW1ldGVyIG5hbWVzIHRvIHJlc29sdmUgZnJvbSBmZWF0dXJlIG9yIHBhcmFtc1xuICAgKiBAcmV0dXJucyB7T2JqZWN0fSBhbiBvYmplY3QgbWFwcGluZyBlYWNoIG5hbWVkIHBhcmFtZXRlciB0byBpdHMgcmVzb2x2ZWQgdmFsdWVcbiAgICovXG4gIHJldHVybiAoZmVhdHVyZSwgcGFyYW1zLCAuLi5hcmdzKSA9PiB7XG4gICAgbGV0IHJlc3VsdHMgPSB7fTtcbiAgICBmb3IgKGxldCBhcmcgb2YgYXJncyl7XG4gICAgICBpZiAoYXJnID09PSAnbGF5ZXInKXtcblx0cmVzdWx0c1thcmddID0gKHBhcmFtcy5sYXllciB8fCB7fSkuaWQgfHwgcGFyYW1zLmxheWVyXG5cdCAgfHwgKGZlYXR1cmUubGF5ZXJ8fHt9KS5pZCB8fCBmZWF0dXJlLmxheWVyIHx8ICcnO1xuICAgICAgfSBlbHNlIGlmICghZmVhdHVyZU1lbWJlcnMuaGFzKGFyZykpe1xuICAgICAgICByZXN1bHRzW2FyZ10gPSBmZWF0dXJlW2FyZ10gfHwgcGFyYW1zW2FyZ10gfHwgJyc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHRzW2FyZ10gPSBwYXJhbXNbYXJnXSB8fCBmZWF0dXJlW2FyZ10gIHx8ICcnO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfTtcbn0pKCk7XG5cbi8qKlxuICogQnVpbGRzIGEgZmlsdGVyIGZyb20gZmVhdHVyZSBpZHMgaWYgb25lIGlzIG5vdCBhbHJlYWR5IGlucHV0LlxuICogQGZ1bmN0aW9uIFxuICogQHBhcmFtIHtzdHJpbmd8dW5kZWZpbmVkfSBmaWx0ZXIgYSBwb3NzaWJsZSBzdHJpbmcgZmlsdGVyXG4gKiBAcGFyYW0ge0FycmF5PE9iamVjdD59IGZlYXR1cmVzIGFuIGFycmF5IG9mIGdlb2pzb24gZmVhdHVyZSBvYmplY3RzXG4gKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIGFuIG9iamVjdCBvZiBiYWNrdXAgLyBvdmVycmlkZSBwYXJhbWV0ZXJzXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBBIGZpbHRlciwgb3IgdGhlIGlucHV0IGZpbHRlciBpZiBpdCB3YXMgYSBzdHJpbmcuXG4gKi9cbmZ1bmN0aW9uIGVuc3VyZUZpbHRlcihmaWx0ZXIsIGZlYXR1cmVzLCBwYXJhbXMpe1xuICBpZiAoIWZpbHRlcil7XG4gICAgZmlsdGVyID0gJyc7XG4gICAgZm9yIChsZXQgZmVhdHVyZSBvZiBmZWF0dXJlcyl7XG4gICAgICBsZXQgbGF5ZXIgPSB1bnBhY2soZmVhdHVyZSwgcGFyYW1zKTtcbiAgICAgIGZpbHRlciArPSBpZEZpbHRlcihsYXllciwgZmVhdHVyZS5pZCk7XG4gICAgfVxuICAgIHJldHVybiBgPGZlczpGaWx0ZXI+JHtmaWx0ZXJ9PC9mZXM6RmlsdGVyPmA7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGZpbHRlcjtcbiAgfVxufTtcbi8vaHR0cDovL2RvY3Mub3Blbmdlb3NwYXRpYWwub3JnL2lzLzA5LTAyNXIyLzA5LTAyNXIyLmh0bWwjMjg2XG4vKipcbiAqIENoZWNrcyB0aGUgdHlwZSBvZiB0aGUgaW5wdXQgYWN0aW9uXG4gKiBAZnVuY3Rpb24gXG4gKiBAcGFyYW0ge3N0cmluZyB8IHVuZGVmaW5lZH0gYWN0aW9uIFxuICogQHJldHVybnMge0Jvb2xlYW59IHdoZXRoZXIgdGhlIGFjdGlvbiBpcyBhbGxvd2VkXG4qL1xuY29uc3QgZW5zdXJlQWN0aW9uID0gKCgpPT57XG4gIGNvbnN0IGFsbG93ZWQgPSBuZXcgU2V0KFsncmVwbGFjZScsICdpbnNlcnRCZWZvcmUnLCAnaW5zZXJ0QWZ0ZXInLCAncmVtb3ZlJ10pO1xuICByZXR1cm4gKGFjdGlvbikgPT4gYWxsb3dlZC5oYXMoYWN0aW9uKTtcbn0pKCk7XG5cbi8qKlxuICogQW4gb2JqZWN0IGNvbnRhaW5pbmcgb3B0aW9uYWwgbmFtZWQgcGFyYW1ldGVycy5cbiAqIEB0eXBlZGVmIHtPYmplY3R9IFBhcmFtc1xuICogQHByb3Age3N0cmluZ3x1bmRlZmluZWR9IG5zIGFuIHhtbCBuYW1lc3BhY2UgYWxpYXMuXG4gKiBAcHJvcCB7c3RyaW5nfE9iamVjdHx1bmRlZmluZWR9IGxheWVyIGEgc3RyaW5nIGxheWVyIG5hbWUgb3Ige2lkfSwgd2hlcmUgaWRcbiAqIGlzIHRoZSBsYXllciBuYW1lXG4gKiBAcHJvcCB7c3RyaW5nfHVuZGVmaW5lZH0gZ2VvbWV0cnlfbmFtZSB0aGUgbmFtZSBvZiB0aGUgZmVhdHVyZSBnZW9tZXRyeSBmaWVsZC5cbiAqIEBwcm9wIHtPYmplY3R8dW5kZWZpbmVkfSBwcm9wZXJ0aWVzIGFuIG9iamVjdCBtYXBwaW5nIGZlYXR1cmUgZmllbGQgbmFtZXMgdG8gZmVhdHVyZSBwcm9wZXJ0aWVzXG4gKiBAcHJvcCB7c3RyaW5nfHVuZGVmaW5lZH0gaWQgYSBzdHJpbmcgZmVhdHVyZSBpZC5cbiAqIEBwcm9wIHtzdHJpbmdbXXx1bmRlZmluZWR9IHdoaXRlbGlzdCBhbiBhcnJheSBvZiBzdHJpbmcgZmllbGQgbmFtZXMgdG8gXG4gKiB1c2UgZnJvbSBAc2VlIFBhcmFtcy5wcm9wZXJ0aWVzXG4gKiBAcHJvcCB7c3RyaW5nfHVuZGVmaW5lZH0gaW5wdXRGb3JtYXQgaW5wdXRGb3JtYXQsIGFzIHNwZWNpZmllZCBhdCBcbiAqIFtPR0MgMDktMDI1cjIgwqcgNy42LjUuNF17QGxpbmsgaHR0cDovL2RvY3Mub3Blbmdlb3NwYXRpYWwub3JnL2lzLzA5LTAyNXIyLzA5LTAyNXIyLmh0bWwjNjV9LlxuICogQHByb3Age3N0cmluZ3x1bmRlZmluZWR9IHNyc05hbWUgc3JzTmFtZSwgYXMgc3BlY2lmaWVkIGF0IFxuICogW09HQyAwOS0wMjVyMiDCpyA3LjYuNS41XXtAbGluayBodHRwOi8vZG9jcy5vcGVuZ2Vvc3BhdGlhbC5vcmcvaXMvMDktMDI1cjIvMDktMDI1cjIuaHRtbCM2Nn0uXG4gKiBpZiB1bmRlZmluZWQsIHRoZSBnbWwzIG1vZHVsZSB3aWxsIGRlZmF1bHQgdG8gJ0VQU0c6NDMyNicuXG4gKiBAcHJvcCB7c3RyaW5nfHVuZGVmaW5lZH0gaGFuZGxlIGhhbmRsZSBwYXJhbWV0ZXIsIGFzIHNwZWNpZmllZCBhdFxuICogW09HQyAwOS0wMjVyMiDCpyA3LjYuMi42IF17QGxpbmsgaHR0cDovL2RvY3Mub3Blbmdlb3NwYXRpYWwub3JnL2lzLzA5LTAyNXIyLzA5LTAyNXIyLmh0bWwjNDR9XG4gKiBAcHJvcCB7c3RyaW5nfHVuZGVmaW5lZH0gZmlsdGVyIGEgc3RyaW5nIGZlczpGaWx0ZXIuXG4gKiBAcHJvcCB7c3RyaW5nfHVuZGVmaW5lZH0gdHlwZU5hbWUgYSBzdHJpbmcgc3BlY2lmeWluZyB0aGUgZmVhdHVyZSB0eXBlIHdpdGhpblxuICogaXRzIG5hbWVzcGFjZS4gU2VlIFswOS0wMjVyMiDCpyA3LjkuMi40LjFde0BsaW5rIGh0dHA6Ly9kb2NzLm9wZW5nZW9zcGF0aWFsLm9yZy9pcy8wOS0wMjVyMi8wOS0wMjVyMi5odG1sIzkwfS5cbiAqIEBwcm9wIHtPYmplY3R8dW5kZWZpbmVkfSBzY2hlbWFMb2NhdGlvbnMgYW4gb2JqZWN0IG1hcHBpbmcgdXJpIHRvIHNjaGVtYWxvY2F0aW9uXG4gKiBAcHJvcCB7T2JqZWN0fHVuZGVmaW5lZH0gbnNBc3NpZ25tZW50cyBhbiBvYmplY3QgbWFwcGluZyBucyB0byB1cmlcbiAqL1xuXG4vKipcbiAqIEEgR2VvSlNPTiBmZWF0dXJlIHdpdGggdGhlIGZvbGxvd2luZyBvcHRpb25hbCBmb3JlaWduIG1lbWJlcnMgKHNlZSBcbiAqIFtyZmM3OTY1IMKnIDZde0BsaW5rIGh0dHBzOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmM3OTQ2I3NlY3Rpb24tNn0pLlxuICogb3IgYW4gb2JqZWN0IHdpdGggc29tZSBvZiB0aGUgZm9sbG93aW5nIG1lbWJlcnMuXG4gKiBNZW1iZXJzIG9mIEZlYXR1cmUgd2lsbCBiZSB1c2VkIG92ZXIgdGhvc2UgaW4gUGFyYW1zIGV4Y2VwdCBmb3IgbGF5ZXIsIGlkLFxuICogYW5kIHByb3BlcnRpZXMuXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBGZWF0dXJlXG4gKiBAZXh0ZW5kcyBQYXJhbXNcbiAqIEBwcm9wZXJ0eSB7T2JqZWN0fHVuZGVmaW5lZH0gZ2VvbWV0cnkgYSBHZW9KU09OIGdlb21ldHJ5LlxuICogQHByb3BlcnR5IHtzdHJpbmd8dW5kZWZpbmVkfSB0eXBlICdGZWF0dXJlJy5cbiAqIEBleGFtcGxlIFxuICogeydpZCc6J3Rhc21hbmlhX3JvYWRzLjEnLCAndHlwZU5hbWUnOid0b3BwOnRhc21hbmlhX3JvYWRzVHlwZSd9IFxuICogLy8gY2FuIGJlIHBhc3NlZCB0byBEZWxldGVcbiAqL1xuXG4vKipcbiAqIGEgR2VvSlNPTiBGZWF0dXJlQ29sbGVjdGlvbiB3aXRoIG9wdGlvbmFsIGZvcmVpZ24gbWVtYmVycyBhcyBpbiBGZWF0dXJlLlxuICogQHR5cGVkZWYge09iamVjdH0gRmVhdHVyZUNvbGxlY3Rpb25cbiAqIEBleHRlbmRzIEZlYXR1cmVcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSB0eXBlICdGZWF0dXJlQ29sbGVjdGlvbicuXG4gKiBAcHJvcGVydHkge0ZlYXR1cmVbXX0gZmVhdHVyZXMgYW4gYXJyYXkgb2YgR2VvSlNPTiBGZWF0dXJlcy5cbiAqL1xuXG4vKipcbiAqIFR1cm5zIGFuIGFycmF5IG9mIGdlb2pzb24gZmVhdHVyZXMgaW50byBnbWw6X2ZlYXR1cmUgc3RyaW5ncyBkZXNjcmliaW5nIHRoZW0uXG4gKiBAZnVuY3Rpb24gXG4gKiBAcGFyYW0ge0ZlYXR1cmVbXX0gZmVhdHVyZXMgYW4gYXJyYXkgb2YgZmVhdHVyZXMgdG8gdHJhbnNsYXRlIHRvIFxuICogZ21sOl9mZWF0dXJlcy5cbiAqIEBwYXJhbSB7UGFyYW1zfSBwYXJhbXMgYW4gb2JqZWN0IG9mIGJhY2t1cCAvIG92ZXJyaWRlIHBhcmFtZXRlcnMgXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBhIGdtbDpfZmVhdHVyZSBzdHJpbmcuXG4gKi9cbmZ1bmN0aW9uIHRyYW5zbGF0ZUZlYXR1cmVzKGZlYXR1cmVzLCBwYXJhbXM9e30pe1xuICBsZXQgaW5uZXIgPSAnJztcbiAgbGV0IHtzcnNOYW1lfSA9IHBhcmFtcztcbiAgZm9yIChsZXQgZmVhdHVyZSBvZiBmZWF0dXJlcyl7XG4gICAgLy9UT0RPOiBhZGQgd2hpdGVsaXN0IHN1cHBvcnRcbiAgICBsZXQge25zLCBsYXllciwgZ2VvbWV0cnlfbmFtZSwgcHJvcGVydGllcywgaWQsIHdoaXRlbGlzdH0gPSB1bnBhY2soXG4gICAgICBmZWF0dXJlLCBwYXJhbXMsICducycsICdsYXllcicsICdnZW9tZXRyeV9uYW1lJywgJ3Byb3BlcnRpZXMnLCAnaWQnLCAnd2hpdGVsaXN0J1xuICAgICk7XG4gICAgbGV0IGZpZWxkcyA9ICcnO1xuICAgIGlmIChnZW9tZXRyeV9uYW1lKXtcbiAgICAgIGZpZWxkcyArPSB4bWwudGFnKFxuXHRucywgZ2VvbWV0cnlfbmFtZSwge30sIGdtbDMoZmVhdHVyZS5nZW9tZXRyeSwgJycsIHtzcnNOYW1lfSlcbiAgICAgICk7XG4gICAgfVxuICAgIHVzZVdoaXRlbGlzdElmQXZhaWxhYmxlKFxuICAgICAgd2hpdGVsaXN0LCBwcm9wZXJ0aWVzLFxuICAgICAgKHByb3AsIHZhbCk9PmZpZWxkcyArPSB4bWwudGFnKG5zLCBwcm9wLCB7fSwgcHJvcGVydGllc1twcm9wXSlcbiAgICApO1xuICAgIGlubmVyICs9IHhtbC50YWcobnMsIGxheWVyLCB7J2dtbDppZCc6IGVuc3VyZUlkKGxheWVyLCBpZCl9LCBmaWVsZHMpO1xuICB9XG4gIHJldHVybiBpbm5lcjtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgd2ZzOkluc2VydCB0YWcgd3JhcHBpbmcgYSB0cmFuc2xhdGVkIGZlYXR1cmVcbiAqIEBmdW5jdGlvbiBcbiAqIEBwYXJhbSB7RmVhdHVyZVtdfEZlYXR1cmVDb2xsZWN0aW9ufEZlYXR1cmV9IGZlYXR1cmVzIEZlYXR1cmUocykgdG8gcGFzcyB0byBAc2VlIHRyYW5zbGF0ZUZlYXR1cmVzXG4gKiBAcGFyYW0ge1BhcmFtc30gcGFyYW1zIHRvIGJlIHBhc3NlZCB0byBAc2VlIHRyYW5zbGF0ZUZlYXR1cmVzLCB3aXRoIG9wdGlvbmFsXG4gKiBpbnB1dEZvcm1hdCwgc3JzTmFtZSwgaGFuZGxlIGZvciB0aGUgd2ZzOkluc2VydCB0YWcuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBhIHdmczpJbnNlcnQgc3RyaW5nLlxuICovXG5mdW5jdGlvbiBJbnNlcnQoZmVhdHVyZXMsIHBhcmFtcz17fSl7XG4gIGZlYXR1cmVzID0gZW5zdXJlQXJyYXkoZmVhdHVyZXMpO1xuICBsZXQge2lucHV0Rm9ybWF0LCBzcnNOYW1lLCBoYW5kbGV9ID0gcGFyYW1zO1xuICBpZiAoIWZlYXR1cmVzLmxlbmd0aCl7XG4gICAgY29uc29sZS53YXJuKCdubyBmZWF0dXJlcyBzdXBwbGllZCcpO1xuICAgIHJldHVybiAnJztcbiAgfVxuICBsZXQgdG9JbnNlcnQgPSB0cmFuc2xhdGVGZWF0dXJlcyhmZWF0dXJlcywgcGFyYW1zKTtcbiAgcmV0dXJuIHhtbC50YWcoJ3dmcycsICdJbnNlcnQnLCB7aW5wdXRGb3JtYXQsIHNyc05hbWUsIGhhbmRsZX0sIHRvSW5zZXJ0KTtcbn1cblxuLyoqXG4gKiBVcGRhdGVzIHRoZSBpbnB1dCBmZWF0dXJlcyBpbiBidWxrIHdpdGggcGFyYW1zLnByb3BlcnRpZXMgb3IgYnkgaWQuXG4gKiBAcGFyYW0ge0ZlYXR1cmVbXXxGZWF0dXJlQ29sbGVjdGlvbn0gZmVhdHVyZXMgZmVhdHVyZXMgdG8gdXBkYXRlLiAgVGhlc2UgbWF5IFxuICogcGFzcyBpbiBnZW9tZXRyeV9uYW1lLCBwcm9wZXJ0aWVzLCBhbmQgbGF5ZXIgKG92ZXJydWxlZCBieSBwYXJhbXMpIGFuZCBcbiAqIG5zLCBsYXllciwgc3JzTmFtZSAob3ZlcnJ1bGluZyBwYXJhbXMpLlxuICogQHBhcmFtIHtQYXJhbXN9IHBhcmFtcyB3aXRoIG9wdGlvbmFsIHByb3BlcnRpZXMsIG5zLCBsYXllciwgZ2VvbWV0cnlfbmFtZSxcbiAqIGZpbHRlciwgdHlwZU5hbWUsIHdoaXRlbGlzdC5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IGEgc3RyaW5nIHdmczpVcGF0ZSBhY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIFVwZGF0ZShmZWF0dXJlcywgcGFyYW1zPXt9KXtcbiAgZmVhdHVyZXMgPSBlbnN1cmVBcnJheShmZWF0dXJlcyk7XG4gIC8qKlxuICAgKiBtYWtlcyBhIHdmczpQcm9wZXJ0eSBzdHJpbmcgY29udGFpbmcgYSB3ZnM6VmFsdWVSZWZlcmVuY2UsIHdmczpWYWx1ZSBwYWlyLlxuICAgKiBAZnVuY3Rpb24gXG4gICAqIEBtZW1iZXJvZiBVcGRhdGV+XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wIHRoZSBmaWVsZC9wcm9wZXJ0eSBuYW1lXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB2YWwgdGhlIGZpZWxkL3Byb3BlcnR5IHZhbHVlIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gYWN0aW9uIG9uZSBvZiAnaW5zZXJ0QmVmb3JlJywgJ2luc2VydEFmdGVyJywgJ3JlbW92ZScsXG4gICAqICdyZXBsYWNlJy4gU2VlIFtPR0MgMDktMDI1cjIgwqcgMTUuMi41LjIuMV17QGxpbmsgaHR0cDovL2RvY3Mub3Blbmdlb3NwYXRpYWwub3JnL2lzLzA5LTAyNXIyLzA5LTAyNXIyLmh0bWwjMjg2fS5cbiAgICogYGFjdGlvbmAgd291bGQgZGVsZXRlIG9yIG1vZGlmeSB0aGUgb3JkZXIgb2YgZmllbGRzIHdpdGhpbiB0aGUgcmVtb3RlXG4gICAqIGZlYXR1cmUuIFRoZXJlIGlzIGN1cnJlbnRseSBubyB3YXkgdG8gaW5wdXQgYGFjdGlvbixgIHNpbmNlIHdmczpVcGRhdGUnc1xuICAgKiBkZWZhdWx0IGFjdGlvbiwgJ3JlcGxhY2UnLCBpcyBzdWZmaWNpZW50LlxuICAgKi9cbiAgY29uc3QgbWFrZUt2cCA9IChwcm9wLCB2YWwsIGFjdGlvbikgPT4gd2ZzKFxuICAgICdQcm9wZXJ0eScsIHt9LFxuICAgIHdmcygnVmFsdWVSZWZlcmVuY2UnLCB7YWN0aW9ufSwgcHJvcCkgK1xuICAgICAgKHZhbCA9PSB1bmRlZmluZWQgPyB3ZnMoJ1ZhbHVlJywge30sIHZhbCk6ICcnKVxuICApO1xuICBpZiAocGFyYW1zLnByb3BlcnRpZXMpe1xuICAgIGxldCB7aGFuZGxlLCBpbnB1dEZvcm1hdCwgZmlsdGVyLCB0eXBlTmFtZSwgd2hpdGVsaXN0fSA9IHBhcmFtcztcbiAgICBsZXQgeyBzcnNOYW1lLCBucywgbGF5ZXIsIGdlb21ldHJ5X25hbWUgfSA9IHVucGFjayhcbiAgICAgIGZlYXR1cmVzWzBdIHx8IHt9LCBwYXJhbXMsICdzcnNOYW1lJywgJ25zJywgJ2xheWVyJywgJ2dlb21ldHJ5X25hbWUnKTtcbiAgICB0eXBlTmFtZSA9IGVuc3VyZVR5cGVOYW1lKG5zLCBsYXllciwgdHlwZU5hbWUpO1xuICAgIGZpbHRlciA9IGVuc3VyZUZpbHRlcihmaWx0ZXIsIGZlYXR1cmVzLCBwYXJhbXMpO1xuICAgIGlmICghZmlsdGVyICYmICFmZWF0dXJlcy5sZW5ndGgpe1xuICAgICAgY29uc29sZS53YXJuKCduZWl0aGVyIGZlYXR1cmVzIG5vciBmaWx0ZXIgc3VwcGxpZWQnKTtcbiAgICAgIHJldHVybiAnJztcbiAgICB9XG4gICAgbGV0IGZpZWxkcyA9ICcnO1xuICAgIHVzZVdoaXRlbGlzdElmQXZhaWxhYmxlKCAvLyBUT0RPOiBhY3Rpb24gYXR0clxuICAgICAgd2hpdGVsaXN0LCBwYXJhbXMucHJvcGVydGllcywgKGssIHYpID0+IGZpZWxkcyArPSBtYWtlS3ZwKGssdilcbiAgICApO1xuICAgIGlmIChnZW9tZXRyeV9uYW1lKXtcbiAgICAgIGZpZWxkcyArPSAgeG1sLnRhZyhcblx0bnMsIGdlb21ldHJ5X25hbWUsIHt9LCBnbWwzKHBhcmFtcy5nZW9tZXRyeSwgJycsIHtzcnNOYW1lfSlcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiB3ZnMoJ1VwZGF0ZScsIHtpbnB1dEZvcm1hdCwgc3JzTmFtZSwgdHlwZU5hbWV9LCBmaWVsZHMgKyBmaWx0ZXIpO1xuICB9IGVsc2Uge1xuICAgIC8vIGVuY2Fwc3VsYXRlIGVhY2ggdXBkYXRlIGluIGl0cyBvd24gVXBkYXRlIHRhZ1xuICAgIHJldHVybiBmZWF0dXJlcy5tYXAoXG4gICAgICAoZikgPT4gVXBkYXRlKFxuICAgICAgICBmLCBPYmplY3QuYXNzaWduKHt9LCBwYXJhbXMsIHtwcm9wZXJ0aWVzOmYucHJvcGVydGllc30pXG4gICAgICApXG4gICAgKS5qb2luKCcnKTtcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYSB3ZnM6RGVsZXRlIGFjdGlvbiwgY3JlYXRpbmcgYSBmaWx0ZXIgYW5kIHR5cGVOYW1lIGZyb20gZmVhdHVyZSBpZHMgXG4gKiBpZiBub25lIGFyZSBzdXBwbGllZC5cbiAqIEBwYXJhbSB7RmVhdHVyZVtdfEZlYXR1cmVDb2xsZWN0aW9ufEZlYXR1cmV9IGZlYXR1cmVzXG4gKiBAcGFyYW0ge1BhcmFtc30gcGFyYW1zIG9wdGlvbmFsIHBhcmFtZXRlciBvdmVycmlkZXMuXG4gKiBAcGFyYW0ge3N0cmluZ30gW3BhcmFtcy5uc10gQHNlZSBQYXJhbXMubnNcbiAqIEBwYXJhbSB7c3RyaW5nfE9iamVjdH0gW3BhcmFtcy5sYXllcl0gQHNlZSBQYXJhbXMubGF5ZXJcbiAqIEBwYXJhbSB7c3RyaW5nfSBbcGFyYW1zLnR5cGVOYW1lXSBAc2VlIFBhcmFtcy50eXBlTmFtZS4gVGhpcyB3aWxsIGJlIGluZmVycmVkXG4gKiBmcm9tIGZlYXR1cmUvcGFyYW1zIGxheWVyIGFuZCBucyBpZiB0aGlzIGlzIGxlZnQgdW5kZWZpbmVkLlxuICogQHBhcmFtIHtmaWx0ZXJ9IFtwYXJhbXMuZmlsdGVyXSBAc2VlIFBhcmFtcy5maWx0ZXIuICBUaGlzIHdpbGwgYmUgaW5mZXJyZWRcbiAqIGZyb20gZmVhdHVyZSBpZHMgYW5kIGxheWVyKHMpIGlmIGxlZnQgdW5kZWZpbmVkIChAc2VlIGVuc3VyZUZpbHRlcikuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBhIHdmczpEZWxldGUgc3RyaW5nLlxuICovXG5mdW5jdGlvbiBEZWxldGUoZmVhdHVyZXMsIHBhcmFtcz17fSl7XG4gIGZlYXR1cmVzID0gZW5zdXJlQXJyYXkoZmVhdHVyZXMpO1xuICBsZXQge2ZpbHRlciwgdHlwZU5hbWV9ID0gcGFyYW1zOyAvL1RPRE86IHJlY3VyZSAmIGVuY2Fwc3VsYXRlIGJ5IHR5cGVOYW1lXG4gIGxldCB7bnMsIGxheWVyfSA9IHVucGFjayhmZWF0dXJlc1swXSB8fCB7fSwgcGFyYW1zLCAnbGF5ZXInLCAnbnMnKTtcbiAgdHlwZU5hbWUgPSBlbnN1cmVUeXBlTmFtZShucywgbGF5ZXIsIHR5cGVOYW1lKTtcbiAgZmlsdGVyID0gZW5zdXJlRmlsdGVyKGZpbHRlciwgZmVhdHVyZXMsIHBhcmFtcyk7XG4gIHJldHVybiB3ZnMoJ0RlbGV0ZScsIHt0eXBlTmFtZX0sIGZpbHRlcik7IFxufVxuXG4vKipcbiAqIFJldHVybnMgYSBzdHJpbmcgd2ZzOlJlcGxhY2UgYWN0aW9uLlxuICogQHBhcmFtIHtGZWF0dXJlW118RmVhdHVyZUNvbGxlY3Rpb258RmVhdHVyZX0gZmVhdHVyZXMgZmVhdHVyZShzKSB0byByZXBsYWNlXG4gKiBAcGFyYW0ge1BhcmFtc30gcGFyYW1zIHdpdGggb3B0aW9uYWwgZmlsdGVyLCBpbnB1dEZvcm1hdCwgc3JzTmFtZVxuICogQHJldHVybnMge3N0cmluZ30gYSBzdHJpbmcgd2ZzOlJlcGxhY2UgYWN0aW9uLlxuICovXG5mdW5jdGlvbiBSZXBsYWNlKGZlYXR1cmVzLCBwYXJhbXM9e30pe1xuICBmZWF0dXJlcyA9IGVuc3VyZUFycmF5KGZlYXR1cmVzKTtcbiAgbGV0IHtmaWx0ZXIsIGlucHV0Rm9ybWF0LCBzcnNOYW1lfSA9IHVucGFjayAoXG4gICAgZmVhdHVyZXNbMF0gfHwge30sIHBhcmFtcyB8fCB7fSwgJ2ZpbHRlcicsICdpbnB1dEZvcm1hdCcsICdzcnNOYW1lJ1xuICApO1xuICBsZXQgcmVwbGFjZW1lbnRzID0gdHJhbnNsYXRlRmVhdHVyZXMoXG4gICAgW2ZlYXR1cmVzWzBdXS5maWx0ZXIoKGYpPT5mKSxcbiAgICBwYXJhbXMgfHwge3Nyc05hbWV9XG4gICk7XG4gIGZpbHRlciA9IGVuc3VyZUZpbHRlcihmaWx0ZXIsIGZlYXR1cmVzLCBwYXJhbXMpO1xuICByZXR1cm4gd2ZzKCdSZXBsYWNlJywge2lucHV0Rm9ybWF0LCBzcnNOYW1lfSwgcmVwbGFjZW1lbnRzICsgZmlsdGVyKTtcbn1cblxuLyoqXG4gKiBXcmFwcyB0aGUgaW5wdXQgYWN0aW9ucyBpbiBhIHdmczpUcmFuc2FjdGlvbi5cbiAqIEBwYXJhbSB7T2JqZWN0fHN0cmluZ1tdfHN0cmluZ30gYWN0aW9ucyBhbiBvYmplY3QgbWFwcGluZyB7SW5zZXJ0LCBVcGRhdGUsXG4gKiBEZWxldGV9IHRvIGZlYXR1cmUocykgdG8gcGFzcyB0byBJbnNlcnQsIFVwZGF0ZSwgRGVsZXRlLCBvciB3ZnM6YWN0aW9uIFxuICogc3RyaW5nKHMpIHRvIHdyYXAgaW4gYSB0cmFuc2FjdGlvbi5cbiAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbXMgb3B0aW9uYWwgc3JzTmFtZSwgbG9ja0lkLCByZWxlYXNlQWN0aW9uLCBoYW5kbGUsXG4gKiBpbnB1dEZvcm1hdCwgdmVyc2lvbiwgYW5kIHJlcXVpcmVkIG5zQXNzaWdubWVudHMsIHNjaGVtYUxvY2F0aW9ucy5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IEEgd2ZzOnRyYW5zYWN0aW9uIHdyYXBwaW5nIHRoZSBpbnB1dCBhY3Rpb25zLlxuICogQHRocm93cyB7RXJyb3J9IGlmIGBhY3Rpb25zYCBpcyBub3QgYW4gYXJyYXkgb2Ygc3RyaW5ncywgYSBzdHJpbmcsIG9yIFxuICoge0BzZWUgSW5zZXJ0LCBAc2VlIFVwZGF0ZSwgQHNlZSBEZWxldGV9LCB3aGVyZSBlYWNoIGFjdGlvbiBhcmUgdmFsaWQgaW5wdXRzIFxuICogdG8gdGhlIGVwb255bW91cyBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gVHJhbnNhY3Rpb24oYWN0aW9ucywgcGFyYW1zPXt9KXtcbiAgbGV0IHtcbiAgICBzcnNOYW1lLCBsb2NrSWQsIHJlbGVhc2VBY3Rpb24sIGhhbmRsZSwgaW5wdXRGb3JtYXQsIHZlcnNpb24sIC8vIG9wdGlvbmFsXG4gICAgbnNBc3NpZ25tZW50cywgc2NoZW1hTG9jYXRpb25zIC8vIHJlcXVpcmVkXG4gIH0gPSBwYXJhbXM7XG4gIGxldCBjb252ZXJ0ZXIgPSB7SW5zZXJ0LCBVcGRhdGUsIERlbGV0ZX07XG4gIGxldCB7aW5zZXJ0OnRvSW5zZXJ0LCB1cGRhdGU6dG9VcGRhdGUsIGRlbGV0ZTp0b0RlbGV0ZX0gPSBhY3Rpb25zIHx8IHt9O1xuICBsZXQgZmluYWxBY3Rpb25zID0gJyc7IC8vIHByb2Nlc3NlZEFjdGlvbnMgd291bGQgYmUgbW9yZSBhY2N1cmF0ZVxuICBcbiAgaWYgKEFycmF5LmlzQXJyYXkoYWN0aW9ucykgJiYgYWN0aW9ucy5ldmVyeSgodikgPT4gdHlwZW9mKHYpID09ICdzdHJpbmcnKSl7XG4gICAgZmluYWxBY3Rpb25zICs9IGFjdGlvbnMuam9pbignJyk7XG4gIH0gZWxzZSBpZiAodHlwZW9mKGFjdGlvbnMpID09ICdzdHJpbmcnKSB7XG4gICAgZmluYWxBY3Rpb25zID0gYWN0aW9ucztcbiAgfVxuICAgIGVsc2UgaWYgKFt0b0luc2VydCwgdG9VcGRhdGUsIHRvRGVsZXRlXS5zb21lKChlKSA9PiBlKSl7XG4gICAgZmluYWxBY3Rpb25zICs9IEluc2VydCh0b0luc2VydCwgcGFyYW1zKSArXG4gICAgICBVcGRhdGUodG9VcGRhdGUsIHBhcmFtcykgK1xuICAgICAgRGVsZXRlKHRvRGVsZXRlLCBwYXJhbXMpO1xuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcihgdW5leHBlY3RlZCBpbnB1dDogJHtKU09OLnN0cmluZ2lmeShhY3Rpb25zKX1gKTtcbiAgfVxuICAvLyBnZW5lcmF0ZSBzY2hlbWFMb2NhdGlvbiwgeG1sbnMnc1xuICBuc0Fzc2lnbm1lbnRzID0gbnNBc3NpZ25tZW50cyB8fCB7fTtcbiAgc2NoZW1hTG9jYXRpb25zID0gc2NoZW1hTG9jYXRpb25zIHx8IHt9O1xuICBsZXQgYXR0cnMgPSBnZW5lcmF0ZU5zQXNzaWdubWVudHMobnNBc3NpZ25tZW50cywgYWN0aW9ucyk7XG4gIGF0dHJzWyd4c2k6c2NoZW1hTG9jYXRpb24nXSA9ICBnZW5lcmF0ZVNjaGVtYUxpbmVzKHBhcmFtcy5zY2hlbWFMb2NhdGlvbnMpO1xuICBhdHRyc1snc2VydmljZSddID0gJ1dGUyc7XG4gIGF0dHJzWyd2ZXJzaW9uJ10gPSAvMlxcLjBcXC5cXGQrLy5leGVjKHZlcnNpb24gfHwgJycpID8gdmVyc2lvbiA6ICcyLjAuMCc7XG4gIHJldHVybiB3ZnMoJ1RyYW5zYWN0aW9uJywgYXR0cnMsIGZpbmFsQWN0aW9ucyk7XG59XG5cbi8qKlxuICogR2VuZXJhdGVzIGFuIG9iamVjdCB0byBiZSBwYXNzZWQgdG8gQHNlZSB4bWwuYXR0cnMgeG1sbnM6bnM9XCJ1cmlcIiBkZWZpbml0aW9ucyBmb3IgYSB3ZnM6VHJhbnNhY3Rpb25cbiAqIEBwYXJhbSB7T2JqZWN0fSBuc0Fzc2lnbm1lbnRzIEBzZWUgUGFyYW1zLm5zQXNzaWdubWVudHNcbiAqIEBwYXJhbSB7c3RyaW5nfSB4bWwgYXJiaXRyYXJ5IHhtbC5cbiAqIEByZXR1cm5zIHtPYmplY3R9IGFuIG9iamVjdCBtYXBwaW5nIGVhY2ggbnMgdG8gaXRzIFVSSSBhcyAneG1sbnM6bnMnIDogJ1VSSScuXG4gKiBAdGhyb3dzIHtFcnJvcn0gaWYgYW55IG5hbWVzcGFjZSB1c2VkIHdpdGhpbiBgeG1sYCBpcyBtaXNzaW5nIGEgVVJJIGRlZmluaXRpb25cbiAqL1xuZnVuY3Rpb24gZ2VuZXJhdGVOc0Fzc2lnbm1lbnRzKG5zQXNzaWdubWVudHMsIHhtbCl7XG4gIGxldCBhdHRycyA9IHt9O1xuICBjb25zdCBtYWtlTnNBc3NpZ25tZW50ID0gKG5zLCB1cmkpID0+IGF0dHJzW2B4bWxuczoke25zfWBdID0gdXJpO1xuICBmb3IgKGxldCBucyBpbiBuc0Fzc2lnbm1lbnRzKXtcbiAgICBtYWtlTnNBc3NpZ25tZW50KG5zLCBuc0Fzc2lnbm1lbnRzW25zXSk7XG4gIH1cbiAgLy8gY2hlY2sgYWxsIG5zJ3MgYXNzaWduZWQgXG4gIHZhciByZSA9IC8oPHx0eXBlTmFtZT1cIikoXFx3Kyk6L2c7XG4gIHZhciBhcnI7XG4gIHZhciBhbGxOYW1lc3BhY2VzID0gbmV3IFNldCgpO1xuICB3aGlsZSAoKGFyciA9IHJlLmV4ZWMoeG1sKSkgIT09IG51bGwpe1xuICAgIGFsbE5hbWVzcGFjZXMuYWRkKGFyclsyXSk7XG4gIH1cbiAgaWYgKGFsbE5hbWVzcGFjZXMuaGFzKCdmZXMnKSl7XG4gICAgbWFrZU5zQXNzaWdubWVudCgnZmVzJywgJ2h0dHA6Ly93d3cub3Blbmdpcy5uZXQvZmVzLzIuMCcpO1xuICB9O1xuICBtYWtlTnNBc3NpZ25tZW50KCd4c2knLCAnaHR0cDovL3d3dy53My5vcmcvMjAwMS9YTUxTY2hlbWEtaW5zdGFuY2UnKTtcbiAgbWFrZU5zQXNzaWdubWVudCgnZ21sJywgJ2h0dHA6Ly93d3cub3Blbmdpcy5uZXQvZ21sLzMuMicpO1xuICBtYWtlTnNBc3NpZ25tZW50KCd3ZnMnLCAnaHR0cDovL3d3dy5vcGVuZ2lzLm5ldC93ZnMvMi4wJyk7XG5cbiAgZm9yIChsZXQgbnMgb2YgYWxsTmFtZXNwYWNlcyl7XG4gICAgaWYgKCFhdHRyc1sneG1sbnM6JyArIG5zXSl7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYHVuYXNzaWduZWQgbmFtZXNwYWNlICR7bnN9YCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBhdHRycztcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgc3RyaW5nIGFsdGVybmF0aW5nIHVyaSwgd2hpdGVzcGFjZSwgYW5kIHRoZSB1cmkncyBzY2hlbWEncyBsb2NhdGlvbi5cbiAqIEBwYXJhbSB7T2JqZWN0fSBzY2hlbWFMb2NhdGlvbnMgYW4gb2JqZWN0IG1hcHBpbmcgdXJpOnNjaGVtYWxvY2F0aW9uXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBhIHN0cmluZyB0aGF0IGlzIGEgdmFsaWQgeHNpOnNjaGVtYUxvY2F0aW9uIHZhbHVlLlxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZVNjaGVtYUxpbmVzKHNjaGVtYUxvY2F0aW9ucz17fSl7XG4gIC8vVE9ETzogYWRkIG5zIGFzc2lnbm1lbnQgY2hlY2tcbiAgc2NoZW1hTG9jYXRpb25zWydodHRwOi8vd3d3Lm9wZW5naXMubmV0L3dmcy8yLjAnXSA9IFxuICAgICdodHRwOi8vc2NoZW1hcy5vcGVuZ2lzLm5ldC93ZnMvMi4wL3dmcy54c2QnO1xuICB2YXIgc2NoZW1hTGluZXMgPSBbXTtcbiAgZm9yIChsZXQgdXJpIGluIHNjaGVtYUxvY2F0aW9ucyl7XG4gICAgc2NoZW1hTGluZXMucHVzaChgJHt1cml9XFxuJHtzY2hlbWFMb2NhdGlvbnNbdXJpXX1gKTtcbiAgfVxuICByZXR1cm4gc2NoZW1hTGluZXMuam9pbignXFxuJyk7XG59XG5cbmV4cG9ydCB7SW5zZXJ0LCBVcGRhdGUsIFJlcGxhY2UsIERlbGV0ZSwgVHJhbnNhY3Rpb259O1xuIiwiaW1wb3J0IHsgZ2VvbVRvR21sIGFzIGdtbDIgfSBmcm9tICdnZW9qc29uLXRvLWdtbC0yJztcbmltcG9ydCB7IGdlb21Ub0dtbCBhcyBnbWwzIH0gZnJvbSAnZ2VvanNvbi10by1nbWwtMyc7XG5pbXBvcnQge1RyYW5zYWN0aW9uLCBJbnNlcnR9IGZyb20gJ2dlb2pzb24tdG8td2ZzLXQtMic7IC8vIE1vcmUgbGF0ZXIsIEkgZ3Vlc3Ncbi8qIHRvZ2dsZXMgKi9cbiQoJy5wb3J0Zm9saW8tdG9nZ2xlJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICQodGhpcykubmV4dCgnLnBvcnRmb2xpby1pdGVtJykuc2xpZGVUb2dnbGUoMzAwKTtcbiAgICAvLyBUT0RPOiBlbnN1cmUgdGhlIHRvZ2dsZWQgaXRlbSBpcyBpbiB2aWV3XG59KTtcblxuLyogdHJhbnNsYXRpb24gZnVuY3Rpb24gKi9cbmZ1bmN0aW9uIHRyYW5zbGF0b3IoYnV0dG9uLCBmcm9tLCB0bywgdHJhbnNsYXRvckNiKXtcbiAgJChidXR0b24pLm1vdXNldXAoKGUpPT57XG4gICAgdHJ5IHtcbiAgICAgIGRlYnVnZ2VyO1xuICAgICAgY29uc3QgdG9UcmFuc2xhdGUgPSBKU09OLnBhcnNlKCQoZnJvbSkudGV4dCgpKTtcbiAgICAgIGNvbnN0IHRyYW5zbGF0ZWQgPSBmb3JtYXRYbWwodHJhbnNsYXRvckNiKHRvVHJhbnNsYXRlKSk7XG4gICAgICB0cnkge1xuXHQkKHRvKS50ZXh0KHRyYW5zbGF0ZWQpO1xuICAgICAgfSBjYXRjaCAoZXJyKXtcblx0JCh0bykudmFsKHRyYW5zbGF0ZWQpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycil7XG4gICAgICBhbGVydChlcnIpO1xuICAgIH1cbiAgfSk7XG59XG5cbi8qIEdlb2pzb24gLT4gR01MIGV4YW1wbGUgKi9cbnRyYW5zbGF0b3IoXG4gICcjdHJhbnNsYXRlLWdlb2pzb24tZ21sLTInLCAnI2dlb2pzb24tc2FtcGxlLWdtbCcsICcjZ21sLXRhcmdldCcsXG4gICh0b1RyYW5zbGF0ZSkgPT4gZ21sMih0b1RyYW5zbGF0ZSlcbik7XG50cmFuc2xhdG9yKFxuICAnI3RyYW5zbGF0ZS1nZW9qc29uLWdtbC0zJywgJyNnZW9qc29uLXNhbXBsZS1nbWwnLCAnI2dtbC10YXJnZXQnLFxuICAodG9UcmFuc2xhdGUpID0+IGdtbDModG9UcmFuc2xhdGUpXG4pO1xudHJhbnNsYXRvcihcbiAgJyN0cmFuc2xhdGUtZ2VvanNvbi13ZnN0JywgJyNnZW9qc29uLXNhbXBsZS13ZnMnLCAnI2dtbC10YXJnZXQnLFxuICAodG9UcmFuc2xhdGUpPT5UcmFuc2FjdGlvbihJbnNlcnQodG9UcmFuc2xhdGUpKVxuKTtcbmZ1bmN0aW9uIGZvcm1hdFhtbCh4bWwpIHtcbiAgICB2YXIgZm9ybWF0dGVkID0gJyc7XG4gICAgdmFyIHJlZyA9IC8oPikoPCkoXFwvKikvZztcbiAgICB4bWwgPSB4bWwucmVwbGFjZShyZWcsICckMVxcclxcbiQyJDMnKTtcbiAgICB2YXIgcGFkID0gMDtcbiAgICB4bWwuc3BsaXQoJ1xcclxcbicpLmZvckVhY2goZnVuY3Rpb24gKG5vZGUsIGluZGV4KSB7XG4gICAgICAgIHZhciBpbmRlbnQgPSAwO1xuICAgICAgICBpZiAobm9kZS5tYXRjaCgvLis8XFwvXFx3W14+XSo+JC8pKSB7XG4gICAgICAgICAgICBpbmRlbnQgPSAwO1xuICAgICAgICB9IGVsc2UgaWYgKG5vZGUubWF0Y2goL148XFwvXFx3LykpIHtcbiAgICAgICAgICAgIGlmIChwYWQgIT0gMCkge1xuICAgICAgICAgICAgICAgIHBhZCAtPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKG5vZGUubWF0Y2goL148XFx3KFtePl0qW15cXC9dKT8+LiokLykpIHtcbiAgICAgICAgICAgIGluZGVudCA9IDE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpbmRlbnQgPSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHBhZGRpbmcgPSAnJztcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYWQ7IGkrKykge1xuICAgICAgICAgICAgcGFkZGluZyArPSAnICAnO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9ybWF0dGVkICs9IHBhZGRpbmcgKyBub2RlICsgJ1xcclxcbic7XG4gICAgICAgIHBhZCArPSBpbmRlbnQ7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZm9ybWF0dGVkO1xufVxuXG4vL1RPRE86IEdlb0pTT04gLT4gV0ZTLVRcblxuLyogcmVkaXJlY3Qgb24gbGFuZGluZyAqL1xuJChkb2N1bWVudCkucmVhZHkoKCk9PiQod2luZG93LmxvY2F0aW9uLmhhc2ggfHwgJyNhYm91dC1tZScpLnNob3coKSk7XG5cbiQoJ2EubGluay1yaWdodCcpLm9uKFxuICAgIFwiY2xpY2tcIixcbiAgICBmdW5jdGlvbihlKXtcblx0JCgkKHRoaXMpLmF0dHIoJ2hyZWYnKSkuc2hvdygpO1xuXHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH1cbik7XG4iXSwibmFtZXMiOlsiY29vcmRpbmF0ZU9yZGVyIiwib3JkZXJDb29yZHMiLCJQb2ludCIsIkxpbmVTdHJpbmciLCJMaW5lYXJSaW5nIiwiUG9seWdvbiIsIk11bHRpUG9pbnQiLCJNdWx0aUxpbmVTdHJpbmciLCJNdWx0aVBvbHlnb24iLCJjb252ZXJ0ZXIiLCJHZW9tZXRyeUNvbGxlY3Rpb24iLCJnZW9tVG9HbWwiLCJnbWwzIiwiJCIsIm9uIiwibmV4dCIsInNsaWRlVG9nZ2xlIiwidHJhbnNsYXRvciIsImJ1dHRvbiIsImZyb20iLCJ0byIsInRyYW5zbGF0b3JDYiIsIm1vdXNldXAiLCJlIiwidG9UcmFuc2xhdGUiLCJKU09OIiwicGFyc2UiLCJ0ZXh0IiwidHJhbnNsYXRlZCIsImZvcm1hdFhtbCIsImVyciIsInZhbCIsImdtbDIiLCJUcmFuc2FjdGlvbiIsIkluc2VydCIsInhtbCIsImZvcm1hdHRlZCIsInJlZyIsInJlcGxhY2UiLCJwYWQiLCJzcGxpdCIsImZvckVhY2giLCJub2RlIiwiaW5kZXgiLCJpbmRlbnQiLCJtYXRjaCIsInBhZGRpbmciLCJpIiwiZG9jdW1lbnQiLCJyZWFkeSIsIndpbmRvdyIsImxvY2F0aW9uIiwiaGFzaCIsInNob3ciLCJhdHRyIiwic3RvcFByb3BhZ2F0aW9uIl0sIm1hcHBpbmdzIjoiOzs7QUFBQTs7Ozs7Ozs7OztBQVVBLFNBQVMscUJBQXFCLENBQUMsR0FBRyxDQUFDO0VBQ2pDLE9BQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLEtBQUssTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7Q0FDNUQ7Ozs7Ozs7O0FBUUQsU0FBUyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUM7RUFDNUIsT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztDQUMx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
