'use strict';
/************************************************************************************
 Sensitive points.

 (с) Sergey Krushinsky, 2017

************************************************************************************/
const { radians, reduceRad } = require('./mathutils.js');

const sin = Math.sin;
const cos = Math.cos;
const tan = Math.tan;
const atan2 = Math.atan2;
const PI = Math.PI;

const self = module.exports = {

    // Midheaven, or The Medium Coeli is the highest point of intersection between
    // the meridian and the ecliptic.
    //
    // Arguments:
    // ramc : right ascension of the meridian, in radians
    // eps  : Ecliptic obliquity, in radians
    //
    // Returns:
    // MC, in radians
    midheaven: function(ramc, eps) {
        let x = atan2(tan(ramc), cos(eps));
        if (x < 0) {
            x += Math.PI;
        }
        if (sin(ramc) < 0) {
            x += Math.PI;
        }
        return reduceRad(x);
    },

    // Ascendant -- the point of the zodiac rising on the Eastern horizon.
    //
    // Arguments:
    // ramc : right ascension of the meridian, in radians
    // eps  : Ecliptic obliquity, in radians
    // theta: geographical latitude, in radians, positive northwards
    //
    // Returns:
    // Ascendant, in radians
    ascendant: function(ramc, eps, theta) {
        return reduceRad(atan2(cos(ramc), -sin(ramc) * cos(eps) - tan(theta) * sin(eps)));
    },

    // Vertex -- the westernmost point on the Ecliptic where it intersects
    // the Prime Vertical.
    //
    // Arguments:
    // ramc : right ascension of the meridian, in radians
    // eps  : Ecliptic obliquity, in radians
    // theta: geographical latitude, in radians, positive northwards
    //
    // Returns:
    // Vertex longitude, in radians
    vertex: function(ramc, eps, theta) {
        return self.ascendant(ramc + PI, eps, radians(90) - theta);
    },

    // East Point (aka Equatorial Ascendant)  is the sign and degree rising over
    // the Eastern Horizon at the Earth's equator at any given time.
    //
    // Arguments:
    // ramc : right ascension of the meridian, in radians
    // eps  : Ecliptic obliquity, in radians
    //
    // Returns:
    // East Point longitude, in radians
    eastpoint: function(ramc, eps) {
        return reduceRad(atan2(cos(ramc), -sin(ramc) * cos(eps)));
    }

};
