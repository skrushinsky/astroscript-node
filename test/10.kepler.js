'use strict'

const assert = require('chai').assert;
const orbits = require('../src/ephem/kepler.js');


describe('True anomaly', _ => {
    const cases = [
        {m: 3.5208387374141448, s: 0.016718, e: 3.5147440476661806, ta: -2.774497552017826},
        {m: 0.763009079752865, s: 0.965, e: 1.7176273861066755, ta: 2.9122563898777387},
    ];

    for(let c of cases) {
        it(`Kepler equation for s: ${c.s} and m: ${c.m})`, () => {
          const got = orbits.kepler(c.s, c.m);
          assert.approximately(got, c.e, 1E-4);
        });
        it(`True anomaly for e ${c.s} and ${c.e}`, () => {
          const got = orbits.trueAnomaly(c.s, c.e);
          assert.approximately(got, c.ta, 1E-4);
        });
    }

});
