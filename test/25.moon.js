'use strict';

const assert = require('chai').assert;
const mathutils = require('../src/mathutils.js');
const moon = require('../src/ephem/moon.js');
const ephemeris = require('../src/ephemeris.js');

describe('Moon true position', () => {

    const cases = [{
        djd: -1.000050E+04,
        coords: [253.85478, -0.35884, 0.98681]
    },
    {
        djd: -7.000500E+03,
        coords: [183.03298, -5.10613, 0.96482]
    },
    {
        djd: -4.000500E+03,
        coords: [114.49714, 0.29899, 0.91786]
    },
    {
        djd: -1.000500E+03,
        coords: [46.33258, 5.03904, 0.89971]
    },
    {
        djd: +1.999500E+03,
        coords: [340.74811, -0.76686, 0.91660]
    },
    {
        djd: +4.999500E+03,
        coords: [273.11888, -5.22297, 0.93431]
    },
    {
        djd: +7.999500E+03,
        coords: [198.76809, 0.13467, 0.97476]
    },
    {
        djd: +1.099950E+04,
        coords: [123.17331, 5.01217, 1.02067]
    },
    {
        djd: +1.399950E+04,
        coords: [50.40519, 0.59539, 1.00077]
    },
    {
        djd: +1.699950E+04,
        coords: [336.88148, -5.04905, 0.94329]
    },
    {
        djd: +1.999950E+04,
        coords: [266.43192, -1.18331, 0.91398]
    },
    {
        djd: +2.299950E+04,
        coords: [200.91657, 5.13843, 0.90354]
    },
    {
        djd: +2.599950E+04,
        coords: [134.05765, 0.87204, 0.90670]
    },
    {
        djd: +2.899950E+04,
        coords: [64.16216, -4.94147, 0.94934]
    },
    {
        djd: +3.199950E+04,
        coords: [354.53313, -0.77311, 0.99650]
    },
    {
        djd: +3.499950E+04,
        coords: [280.10165, 5.06817, 0.99501]
    },
    {
        djd: +3.799950E+04,
        coords: [201.62149, 2.25573, 0.97435]
    },
    {
        djd: +4.099950E+04,
        coords: [128.41649, -4.51661, 0.95591]
    },
    {
        djd: +4.399950E+04,
        coords: [61.54198, -2.45092, 0.92162]
    },
    {
        djd: +4.699950E+04,
        coords: [353.93133, 4.49791, 0.89930]
    }];

    for (let c of cases) {
        const got = moon.truePosition(c.djd);

        it(`longitude for DJD #${c.djd}`, () => {
            assert.approximately(mathutils.degrees(got[0]), c.coords[0], 1E-4);
        });

        it(`latitude for DJD #${c.djd}`, () => {
            assert.approximately(mathutils.degrees(got[1]), c.coords[1], 1E-4);
        });
        it(`parallax for DJD #${c.djd}`, () => {
            assert.approximately(got[3], c.coords[2], 1E-4);
        });
    }

});


describe('Moon apparent', () => {
    const cases = [{
        djd: 23772.99027777778,
        lng: 310.19998902960941
    },
    {
        djd: 30735.5, // 1984-2-25.0
        lng: 260.7128333333333
    },
    {
        djd: 16773.8121, // 1945-12-4.3121,
        lng: 246.94925
    }];

    for (let c of cases) {
        it(`longitude for DJD #${c.djd}`, () => {
            const got = new ephemeris.Ephemeris(c.djd, true).getPosition('Moon');
            assert.approximately(mathutils.degrees(got.l), c.lng, 1E-4);
        });


    }
});