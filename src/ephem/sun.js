'use strict';
/************************************************************************************
 Sun-related calculations

 (с) Sergey Krushinsky, 2017

************************************************************************************/
const { kepler, trueAnomaly } = require('./kepler.js');
const { radians, PI2, frac360, reduceRad, reduceDeg, polynome } = require ('../mathutils.js');

const sin = Math.sin;
const cos = Math.cos;
const floor = Math.floor;

const self = module.exports = {
    meanLongitude: function(t) {
        return 	reduceDeg(2.7969668e2 + 3.025e-4 * t * t + frac360(1.000021359e2 * t));
    },

    meanAnomaly: function(t) {
        return reduceDeg(3.5847583e2 - (1.5e-4 + 3.3e-6 * t) * t * t + frac360(9.999736042e1 * t));
    },

    // Calculates lsn, true geocentric longitude of the Sun for the mean equinox of date (radians),
    // and rsn, the Sun-Earth distance (AU) for moment t, Julian centuries since 1900 Jan, 0.5.
    trueGeocentric: function(t, mean_anomaly=null) {
        const ms = mean_anomaly === null ? self.meanAnomaly(t) : mean_anomaly;
        const ls = self.meanLongitude(t);
        const ma = radians(ms);
        const s = polynome(t, 1.675104e-2, -4.18e-5, -1.26e-7); // eccentricity
        const ea = kepler(s, ma - PI2 * floor(ma / PI2)); // eccentric anomaly
        const nu = trueAnomaly(s, ea); // true anomaly
        const t2 = t * t;
        const [ a, b, c, d, h ] = [
            [153.23, 6.255209472e1], // Venus
            [216.57, 1.251041894e2], // ?
            [312.69, 9.156766028e1], // Jupiter
            [350.74 - 1.44e-3 * t2, 1.236853095e3], // Moon
            [353.4, 1.831353208e2] // Jupiter
        ].map( (x) => radians(x[0] + frac360(x[1] * t)) );
        const e = radians(231.19 + 20.2 * t); // inequality of long period

        // correction in orbital longitude
        const dl = 1.34e-3 * cos(a)
               + 1.54e-3 * cos(b)
               + 2e-3 * cos(c)
               + 1.79e-3 * sin(d)
               + 1.78e-3 * sin(e);
        // correction in radius-vector
        const dr = 5.43e-6 * sin(a)
               + 1.575e-5 * sin(b)
               + 1.627e-5 * sin(c)
               + 3.076e-5 * cos(d)
               + 9.27e-6 * sin(h);
        const lsn = reduceRad(nu + radians(ls - ms + dl));
        const rsn = 1.0000002 * (1 - s * cos(ea)) + dr;
        return [lsn, rsn];
    }

};
