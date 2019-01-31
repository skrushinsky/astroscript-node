'use strict';

const assert = require('chai').assert;
const sun = require('../src/ephem/sun.js');


describe('Sun Geocentric position', () => {

    const cases = [{
        djd: 30916.5, // 24 Aug 1984 00:00
        l: 2.635675729656964,
        r: 1.010993800005251,
        ap: 151.0035132296576,
    },
    {
        djd: 30819.10833333333, // 18 May 1984 14:36
        l: 1.009348984801347,
        r: 1.011718488789592,
        ap: 57.82109236581925,
    },
    {
        djd: 28804.5, // 12 Nov 1978 00:00
        l: 4.00119704995796,
        r: 0.9898375,
        ap: 229.2450957063683,
    },
    {
        djd: 33888.5, // 1992, Oct. 13 0h
        l: 3.48901800235592,
        r: .9975999344847888,
        ap: 199.9047664927989, // Meeus: 199.90734722222223
    }];

    for (let c of cases) {
        const t = c.djd / 36525;
        const got = sun.trueGeocentric(t);
        it(`longitude for djd ${c.djd}`, () => {
            assert.approximately(got[0], c.l, 1E-4);
        });
        it(`r-vector for djd ${c.djd}`, () => {
            assert.approximately(got[1], c.r, 1E-4);
        });
    }
});