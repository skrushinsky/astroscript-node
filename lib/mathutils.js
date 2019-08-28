'use strict';

// Core Math routines.
// (с) Sergey Krushinsky, 2017

const _S = Math.PI / 180.0;

const self = module.exports = {

    PI2: Math.PI * 2,
    PI_HALF: Math.PI / 2.0,

    // Fractional part of x.
    // The result always keeps sign of the argument, e.g.: frac(-5.5) = -0.5
    frac: function (x) {
        return x % 1;
    },

    // Used with polinomial function for better accuracy.
    frac360: function (x) {
        return self.frac(x) * 360;
    },

    // Given decimal hours (or degrees), return nearest hours (or degrees), int,
    // minutes, int, and seconds, float.
    dms: function (x, places = 3) {
        if (places === 1) {
            return [x];
        }

        let f = self.frac(x);
        const i = parseInt(x - f);
        if (i !== 0 && f < 0) {
            f = -f;
        }
        return [i, ...self.dms(f * 60, places - 1)];
    },

    // Convert decimal degrees to:
    // zodiac sign number (zero based), zodiac degrees, minutes and seconds.
    zdms: function (x) {
        const res = self.dms(x);
        const d = res.shift();
        const z = parseInt(d / 30);
        return [z, d % 30, ...res];
    },

    // Given hours (or degrees), minutes and seconds,
    // return decimal hours (or degrees). In the case of hours (angles) < 0.
    //
    // In case of negative input value,
    // only the first non-zero element should be negative.
    ddd: function (...vals) {
        const sgn = vals.some(x => x < 0) ? -1 : 1;
        const res = vals.reverse().reduce((a, b) => Math.abs(a) / 60 + Math.abs(b));
        return res * sgn;
    },

    // Calculates polynome: a1 + a2*t + a3*t*t + a4*t*t*t...
    polynome: function (t, ...terms) {
        return terms.reverse().reduce((a, b) => a * t + b);
    },

    // Reduces x to 0 >= x < r
    toRange: function (x, r) {
        const a = x % r;
        return a < 0 ? a + r : a;
    },

    // Reduces x to 0 >= x < 360
    reduceDeg: function(x) {
        return self.toRange(x, 360);
    },

    // Reduces x to 0 >= x < PI * 2
    reduceRad: function(x) {
        return self.toRange(x, self.PI2);
    },

    // degrees -> radians
    radians: function(x) {
        return x * _S;
    },

    // radians -> degrees
    degrees: function(x) {
        return x / _S;
    },

    // Return angle b - a, accounting for circular values.
    // Parameters a and b should be in the range 0..pi*2. The
    // result will be in the range -pi..pi.
    //
    // This allows us to directly compare angles which cross through 0:
    // 359 degress... 0 degrees... 1 degree... etc.
    //
    // Arguments:
    //     a : first angle, in radians
    //     b : second angle, in radians
    //
    // Returns:
    //     b - a, in radians
    diffAngle: function (a, b) {
        const x = (b < a) ? b + self.PI2 - a : b - a;
        return x > Math.PI ? x - self.PI2 : x;
    },

    // Same as diffAngle, except that angles are in arc-degrees.
    diffAngleDeg: function (a, b) {
        const x = (b < a) ? b + 360 - a : b - a;
        return x > 180 ? x - 360 : x;
    }


};