'use strict';

const DLA_DELTA = 1e-7; // precision for Kepler equation

const self = module.exports = {

    // Solve Kepler equation to calculate ea, the eccentric anomaly, 
    // in elliptical motion given  s (< 1), the eccentricity,
    // and  ma, mean anomaly.
    kepler: function(s, m, ea=null, pass=0) {
        if (ea === null ) {
            ea = m;
        }
        let dla = ea - (s * Math.sin(ea)) - m;
        if (Math.abs(dla) < DLA_DELTA) {
            return ea;
        }
        dla = dla / (1 - (s * Math.cos(ea)));
        return self.kepler(s, m, ea - dla, pass + 1);
    },

    // Given s, eccentricity, and ea, eccentric anomaly, find true anomaly.
    trueAnomaly: function(s, ea) {
        return 2 * Math.atan(Math.sqrt((1 + s) / (1 - s)) * Math.tan(ea / 2));
    }
};