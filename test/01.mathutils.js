'use strict';

var assert = require('chai').assert;
const mathutils = require('../src/mathutils.js');

describe('Fractional part of a number', () => {
    it('frac(5.5) should be 0.5', () => {
        assert.equal(mathutils.frac(5.5), 0.5);
    });
    it('frac() with a negative argument should be negative', () => {
        assert.equal(mathutils.frac(-5.5), -0.5);
    });
});


describe('frac360', () => {
    const k = 23772.99 / 36525;
    const cases = [
        [31.7842235930254, 1.000021358E2 * k],
        [30.6653235575305, 9.999736056E1 * k],
        [42.3428797768338, 1.336855231E3 * k],
        [273.934866366267, 1.325552359E3 * k],
        [178.873057561472, 5.37261666700 * k]
    ];

    for (let c of cases) {
        const exp = c[0];
        const arg = c[1];
        it(`${arg} should be reduced to ${exp}`, () => {
            const got = mathutils.frac360(arg);
            assert.approximately(got, exp, 1E-6);
        });
    }

});


describe('Sexadecimal', () => {
    let common_cases = [
        [-(37 + 35 / 60.0), [-37, 35, 0]],
        [55 + 45 / 60.0, [55, 45, 0]],
        [-(0 + 10 / 60.0), [0, -10, 0]],
        [-(10 / 3600.0), [0, 0, -10]],
        [0, [0, 0, 0]]
    ];

    for (let c of common_cases) {
        const x = c[0];
        const d = c[1][0];
        const m = c[1][1];
        const s = c[1][2];

        it(`${x} to ${d}, ${m}, ${s}`, () => {
            const dms = mathutils.dms(x);
            assert.equal(dms[0], d);
            assert.equal(dms[1], m);
            assert.approximately(dms[2], s, 1E-6);
        });

        it(`${d}, ${m}, ${s} to ${x}`, () => {
            assert.approximately(mathutils.ddd(d, m, s), x, 1E-6);
        });
    }

    let opt_arg_cases = [
        [37, [37, 0, 0]],
        [37, [37, 0]],
        [37, [37]],
    ];

    for (let c of opt_arg_cases) {
        let x = c[0];
        let count = c[1].length;
        it(`Passing ${count} arguments to ddd`, () => {
            assert.approximately(mathutils.ddd.apply(this, c[1]), x, 1E-6);
        });
    }

    it('Duplicate negative sign', () => {
        assert.approximately(mathutils.ddd(-55, -45, 0), -55.75, 1E-6);
    });

});


describe('Polynome', () => {

    let cases = [
        [321.0, [10.0, 1.0, 2.0, 3.0]],
        [0.411961500152426, [-0.127296372347707, 0.409092804222329, -0.0226937890431606,
            -7.51461205719781e-06, 0.0096926375195824, -0.00024909726935408,
            -0.00121043431762618, -0.000189319742473274, 3.4518734094999e-05,
            0.000135117572925228, 2.80707121362421e-05, 1.18779351871836e-05
        ]]
    ];

    for (let c of cases) {
        let x = c[0];
        let terms = c[1];
        let count = terms.length;
        it(`with ${count} terms`, () => {
            assert.approximately(mathutils.polynome.apply(this, terms), x, 1E-6);
        });
    }

});


describe('Ranges', () => {

    let deg_cases = [
        [20, -700],
        [0, 0],
        [345, 345],
        [340, 700],
        [0, 360],
        [70.45, 324070.45]
    ];

    for (let c of deg_cases) {
        let exp = c[0];
        let arg = c[1];
        it(`reduceDeg(${arg}) should be ${exp}`, () => {
            assert.approximately(mathutils.reduceDeg(arg), exp, 1E-6);
        });
    }

    let rad_cases = [
        [0.323629385640829, 12.89],
        [5.95955592153876, -12.89],
        [0, 0],
        [3.71681469282041, 10.0],
        [Math.PI, Math.PI],
        [0, mathutils.PI2]
    ];

    for (let c of rad_cases) {
        let exp = c[0];
        let arg = c[1];
        it(`reduceRad(${arg}) should be ${exp}`, () => {
            assert.approximately(mathutils.reduceRad(arg), exp, 1E-6);
        });
    }
});