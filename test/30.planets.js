'use strict'

const assert = require('chai').assert;

const mathutils = require('../src/mathutils.js');
const planets = require('../src/ephem/planets.js');
const sun = require('../src/ephem/sun.js');

describe('Perturbations', _ => {
    // dl, dr, dml, ds, dm, da, dhl
    const cases = [{
            planet: 'Mercury',
            values: {
                dl: -0.00137,
                dr: -0.00001,
                dml: 0.00000,
                ds: 0.00000,
                dm: 0.00000,
                da: 0.00000,
                dhl: 0.00000
            },
        }, {
            planet: 'Venus',
            values: {
                dl: -0.00296,
                dr: -0.00002,
                dml: 0.00000,
                ds: 0.00000,
                dm: 0.00000,
                da: 0.00000,
                dhl: 0.00000
            },
        }, {
            planet: 'Mars',
            values: {
                dl: 0.00559,
                dr: -0.00002,
                dml: 0.00023,
                ds: 0.00000,
                dm: 0.00023,
                da: 0.00000,
                dhl: 0.00000
            },
        }, {
            planet: 'Jupiter',
            values: {
                dl: 0.00000,
                dr: 0.00000,
                dml: 0.00069,
                ds: -0.00044,
                dm: -0.02062,
                da: 0.00020,
                dhl: 0.00000
            },
        }, {
            planet: 'Saturn',
            values: {
                dl: 0.00000,
                dr: 0.00000,
                dml: -0.00004,
                ds: -0.00469,
                dm: -0.02854,
                da: 0.01638,
                dhl: -0.00005
            },
        }, {
            planet: 'Uranus',
            values: {
                dl: -0.03708,
                dr: -0.02201,
                dml: -0.01396,
                ds: 0.00097,
                dm: 0.02726,
                da: -0.00138,
                dhl: 0.00002
            },
        }, {
            planet: 'Neptune',
            values: {
                dl: -0.00004,
                dr: -0.03142,
                dml: 0.00953,
                ds: -0.00041,
                dm: 0.07023,
                da: 0.00314,
                dhl: -0.00000
            },
        }, {
            planet: 'Pluto',
            values: {
                dl: 0.00000,
                dr: 0.00000,
                dml: 0.00000,
                ds: 0.00000,
                dm: 0.00000,
                da: 0.00000,
                dhl: 0.00000
            },
        }
    ];

    const t = 30700.5 / 36525;
    const ma = planets.meanAnomalies(t);
    const ms = mathutils.radians(sun.meanAnomaly(t));
    for (let c of cases) {
        const pla = planets.forName(c.planet);
        // dispatch arguments
        let args;
        switch(pla.name) {
            case 'Mercury':
                args = [ma.get('Mercury'), ma.get('Venus'), ma.get('Jupiter')];
                break
            case 'Venus':
                args = [t, ms, ma.get('Venus'), ma.get('Jupiter')];
                break;
            case 'Mars':
                args = [ms, ma.get('Venus'), ma.get('Mars'), ma.get('Jupiter')];
                break;
            case 'Jupiter':
            case 'Saturn':
            case 'Uranus':
            case 'Neptune':
                args = [t, pla.orbit.assembleTerms(t, 'EC')];
                break;
            default:
                args = [];
        }
        const got = pla.calculatePerturbations.apply(this, args);
        //const got = pla.calculatePerturbations(args);
        for (let k of ['dl', 'dr', 'dml', 'ds', 'dm', 'da', 'dhl']) {
            it(`${pla.name} ${k}`, () => {
                assert.approximately(got[k], c.values[k], 1E-4);
            });
        }
    }
});


describe('Orbit class', _ => {

    const t = 30700.5 / 36525; // 1984 Jan 21

    const cases = [
        { name: 'Mercury', ML: 176.191, DM: 4.09238, PH: 77.2073, EC: .205631, IN: 7.00443, ND: 48.1423, SA: .387099, DI: 6.74, MG: -0.42 },
        { name: 'Mars', ML: 182.982, DM: .524071, PH: 335.766, EC: 9.33903e-02, IN: 1.84977, ND: 49.4345, SA: 1.52369, DI: 9.36, MG: -1.52 },
        { name: 'Jupiter', ML: 270.164, DM: 8.31294e-02, PH: 14.0749, EC: 4.84724e-02, IN: 1.30395, ND: 100.293, SA: 5.20256, DI: 196.74, MG: -9.4 }
    ];

    for (let c of cases) {
        const o = planets.forName(c.name).orbit;
        for (let e of ['ML', 'DM', 'PH', 'EC', 'IN', 'ND', 'SA', 'DI', 'MG']) {
            it(`${c.name}.${e}`, () => {
                let got;
                switch (e) {
                    case 'DM':
                    case 'SA':
                    case 'DI':
                    case 'MG':
                        got = o.getTerms(e);
                        break;
                    default:
                        got = o.assembleTerms(t, e);
                }
                assert.approximately(got, c[e], 1E-2);
            });
        }
    }


});
