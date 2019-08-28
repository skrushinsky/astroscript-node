'use strict';

const mathutils = require('../mathutils.js');
const julian = require('./julian.js');

const self = module.exports = {

    SOLAR_TO_SIDEREAL: 1.002737909350795,

    _t0: function (djd) {
        const s = julian.djdMidnight(djd) - julian.DAYS_PER_CENT;
        const t = s / julian.DAYS_PER_CENT;
        return mathutils.toRange(mathutils.polynome(t, 6.697374558, 2400.051336, 0.000025862), 24);
    },

    localSidereal: function (djd) {
        const lng = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

        const ut = mathutils.frac(djd - 0.5) * 24;
        return mathutils.toRange(self._t0(djd) + ut * self.SOLAR_TO_SIDEREAL - lng / 15, 24);
    },

    siderealToUTC: function (djd, lst) {
        const lng = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

        const gst = mathutils.toRange(lst + lng / 15, 24); // Greenwich Stellar Time
        const utc = mathutils.toRange(gst - self._t0(djd), 24) * 0.9972695663;
        return [utc, utc >= 0.06552]; //  check ambiguous conversion      
    }

};