'use strict';

const assert = require('chai').assert;
const nutation = require('../src/ephem/nutation.js');

describe('Nutation', () => {
    const cases = [{
        djd: -15804.5, // 1856 Sept. 23
        dpsi: -0.00127601021242336,
        deps: 0.00256293723137559,
    },
    {
        djd: 36524.5, // 2000 Jan. 1
        dpsi: -0.00387728730373955,
        deps: -0.00159919822661103,
    },
    {
        djd: 28805.69, // 1978 Nov 17
        dpsi: -9.195562346652888e-04,
        deps: -2.635113483663831e-03,
    }];

    for (let c of cases) {
        const t = c.djd / 36525;
        let nu = nutation.nutation(t);
        const dpsi = nu[0];
        const deps = nu[1];
        it(`dpsi at DJD #${c.djd}`, () => {
            assert.approximately(dpsi, c.dpsi, 1E-4);
        });
        it(`deps at DJD #${c.djd}`, () => {
            assert.approximately(deps, c.deps, 1E-4);
        });
    }
});