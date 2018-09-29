'use strict'

const assert = require('chai').assert;
const { obliquity } = require('../src/ephem/obliquity.js');

// P.Duffett-Smith, "Astronomy With Your Personal Computer", p.54
describe('Mean Obliquity', _ => {
    const cases = [{
            djd: 29120.5, // 1979-09-24.0
            eps: 23.441916666666668
        },
        {
            djd: 36524.5, // 2000-01-01.0
            eps: 23.43927777777778
        }
    ];

    for (let c of cases) {
        it(`eps at DJD #${c.djd}`, () => {
            const got = obliquity(c.djd);
            assert.approximately(got, c.eps, 1E-4)
        });
    }
});


// Meeus, "Astronomical Algorithms", second edition, p.148.
describe('True Obliquity', _ => {
    const djd = 31875.5; // 1987-04-10.0
    const deps = 9.443;
    it(`eps at DJD #${djd} with deps ${deps}°`, () => {
        const got = obliquity(djd, deps / 3600);
        assert.approximately(got, 23.443569444444446, 1E-4)
    });

});
