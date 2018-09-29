'use strict';
/************************************************************************************
 Transforming between various types of celestial coordinates.


 (с) Sergey Krushinsky, 2017

************************************************************************************/

const { PI2, reduceRad } = require ('./mathutils.js');

const cos = Math.cos;
const sin = Math.sin;
const asin = Math.asin;
const atan2 = Math.atan2;
const tan = Math.tan;
const acos = Math.acos;

const _EQU_TO_ECL = 1;
const _ECL_TO_EQU =-1;

// Converts between longitude/right ascension and latitude/declination.
// The last argument is flag specifying the conversion direction:
// k = 1 for equatorial -> ecliptical,
// k =-1 for ecliptical -> equatorial
function _equecl(x, y, sin_e, cos_e, k) {
    const sin_x = sin(x);
    const a = atan2(sin_x * cos_e + k * (tan(y) * sin_e), cos(x));
    const b = asin(sin(y) * cos_e - k * (cos(y) * sin_e * sin_x));
    return [ reduceRad(a), b ];
}

// Converts between azimuth/altitude and hour-angle/declination.
// The equations are symmetrical in the two pairs of coordinates so that exactly
// the same code may be used to convert in either direction, there being no need
// to specify direction with a swich. (see [1], page 35).
function _equhor(x, y, phi) {
    const [sx, sy, sphi] = [x, y, phi].map( x => sin(x) );
    const [cx, cy, cphi] = [x, y, phi].map( x => cos(x) );

    const sq = (sy * sphi) + (cy * cphi * cx);
    const q = asin(sq);
    const cp = (sy - (sphi * sq)) / (cphi * cos(q));
    let p = acos(cp);
    if (sx > 0) {
        p = PI2 - p;
    }
    return [ p, q ];
}



module.exports = {

    // Convert equatorial to ecliptic coordinates.
    // Arguments:
    //    x : right ascension, in radians
    //    y : declination, in radians
    // Returns:
    //    [ longitude,  latitude ], in radians
    equ2ecl(x, y, e) {
        return _equecl(x, y, sin(e), cos(e), _EQU_TO_ECL);
    },

    // Convert ecliptic to equatorial coordinates.
    // Arguments:
    //    x : longitude, in radians
    //    y : latitude, in radians
    //    e : obliquity of the ecliptic, in radians
    // Returns:
    //    [ right ascension, declination ], in radians
    ecl2equ(x, y, e) {
        return _equecl(x, y, sin(e), cos(e), _ECL_TO_EQU);
    },

    // Convert equatorial to horizontal coordinates.
    // Arguments:
    //    h     : the local hour angle, in radians, measured westwards from the South.
    //            h = LST - right ascension
    //    delta : declination, in radians
    //    phi   : the observer's latitude, in radians, positive in the nothern hemisphere,
    //            negative in the southern one
    // Returns array of:
    //    azimuth, in radians, measured westward from the South
    //    altitude, in radians, positive above the horizon
    equ2hor(h, delta, phi) {
        return _equhor(h, delta, phi);
    },

    // Convert horizontal to equatorial coordinates.
    // Arguments:
    //    az    : azimuth, in radians, measured westwards from the South.
    //            h = LST - right ascension
    //    alt   : altitude, in radians, positive above the horizon
    //    phi   : the observer's latitude, in radians, positive in the nothern hemisphere,
    //            negative in the southern one
    // Returns array of:
    //    hour angle, in radians
    //    declination, in radians
    hor2equ(az, alt, phi) {
        return _equhor(az, alt, phi);
    }



};
