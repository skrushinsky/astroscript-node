'use strict';

const assert = require('chai').assert;
const mathutils = require('../lib/mathutils.js');
const houses = require('../lib/houses.js');

const radians = mathutils.radians;
const degrees = mathutils.degrees;

describe('Quadrant systems', () => {
    const cases = [
        ['Placidus', [83.21, 116.42, 167.08, 194.39]],
        ['Koch', [87.50, 117.46, 172.43, 200.09]],
        ['Regiomontanus', [86.55, 119.56, 167.79, 193.66]],
        ['Campanus', [77.90, 111.82, 174.04, 200.48]],
        ['Topocentric', [83.04, 116.25, 167.04, 194.43]]
    ];

    const ramc = radians(45.0);
    const mc = radians(47.47);
    const asc = radians(144.92);
    const theta = radians(42.0);
    const eps = radians(23.4523);
    const base_cusps = [10, 11, 1, 2];

    for (let c of cases) {
        const sysname = c[0];
        const f = houses.housesFunction(Symbol.for(sysname));
        const all = f(ramc, eps, theta, asc, mc);
        for (let i = 0; i < 4; i++) {
            const n = base_cusps[i];
            it(`${sysname} cusp #${n+1}`, () => {
                assert.approximately(degrees(all[n]), c[1][i], 1E-1);
            });
        }
    }
});

describe('Morinus System', () => {
    const exp = [74.321099, 106.882333, 138.021622, 166.706990,
        194.329719, 223.092245, 254.321099, 286.882333,
        318.021622, 346.706990, 14.329719, 43.092245
    ];
    const ramc = radians(345.559001);
    const eps = radians(23.430827);
    const got = houses.housesFunction(Symbol.for('Morinus'))(ramc, eps);
    for (let i = 0; i < 12; i++) {
        it(`cusp #${i+1}`, () => {
            assert.approximately(degrees(got[i]), exp[i], 1E-2);
        });
    }
});

describe('Sign-Cusp System', () => {
    const got = houses.housesFunction(Symbol.for('Equal'))();
    const exp = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
    for (let i = 0; i < 12; i++) {
        it(`cusp #${i+1}`, () => {
            assert.approximately(degrees(got[i]), exp[i], 1E-5);
        });
    }
});

describe('Equal from Asc', () => {
    const got = houses.housesFunction(Symbol.for('Equal'))(radians(110.0));
    const exp = [110.0, 140.0, 170.0, 200.0, 230.0, 260.0, 290.0, 320.0, 350.0, 20.0, 50.0, 80.0];
    for (let i = 0; i < 12; i++) {
        it(`cusp #${i+1}`, () => {
            assert.approximately(degrees(got[i]), exp[i], 1E-5);
        });
    }
});

describe('Equal from MC', () => {
    const got = houses.housesFunction(Symbol.for('Equal'))(radians(20.0), 9);
    const exp = [110.0, 140.0, 170.0, 200.0, 230.0, 260.0, 290.0, 320.0, 350.0, 20.0, 50.0, 80.0];
    for (let i = 0; i < 12; i++) {
        it(`cusp #${i+1}`, () => {
            assert.approximately(degrees(got[i]), exp[i], 1E-5);
        });
    }
});


describe('inHouse', () => {

    const cases = [
        // Placidus
        {
            cusps: [110.1572788, 123.8606431, 140.6604438, 164.3171029, 201.3030337, 251.6072499,
                290.1572788, 303.8606431, 320.6604438, 344.3171029, 21.3030337, 71.6072499
            ],
            positions: [
                [312.4208864, 7],
                [310.2063276, 7],
                [297.0782202, 6],
                [295.2089981, 6],
                [177.9665740, 3],
                [46.9285345, 10],
                [334.6014315, 8],
                [164.0317672, 2],
                [229.9100725, 4],
                [165.8252621, 3]
            ]
        },
        // Koch
        {
            cusps: [110.1572788, 128.7319594, 146.5218115, 164.3171029, 233.9641006, 268.2927967,
                290.1572788, 308.7319594, 326.5218115, 344.3171029, 53.9641006, 88.2927967
            ],
            positions: [
                [312.4208864, 7],
                [310.2063276, 7],
                [297.0782202, 6],
                [295.2089981, 6],
                [177.9665740, 3],
                [46.9285345, 9],
                [334.6014315, 8],
                [164.0317672, 2],
                [229.9100725, 3],
                [165.8252621, 3]
            ]
        }
    ];

    for (let c of cases) {
        const cusps = c.cusps.map( _ => radians(_));

        for (let p of c.positions) {
            const got = houses.inHouse(radians(p[0]), cusps);
            it(`x: ${p[0]} => ${p[1]+1}`, () => {
                assert.equal(got, p[1]);
            });
        }
    }
});