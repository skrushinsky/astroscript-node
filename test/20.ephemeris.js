'use strict';

const assert = require('chai').assert;
const ephemeris = require('../lib/ephemeris.js');
const mathutils = require('../lib/mathutils.js');
const Ephemeris = ephemeris.Ephemeris;

describe('True geocentric', () => {
    const cases = [{
        planet: 'Mercury',
        geo: [275.88530, 1.47425, 0.98587]
    },
    {
        planet: 'Venus',
        geo: [264.15699, 1.42582, 1.22905]
    },
    {
        planet: 'Mars',
        geo: [214.98173, 1.67762, 1.41366]
    },
    {
        planet: 'Jupiter',
        geo: [270.30024, 0.29758, 6.10966]
    },
    {
        planet: 'Saturn',
        geo: [225.37862, 2.33550, 10.04942]
    },
    {
        planet: 'Uranus',
        geo: [252.17354, 0.05160, 19.63393]
    },
    {
        planet: 'Neptune',
        geo: [270.07638, 1.16314, 31.11160]
    },
    {
        planet: 'Pluto',
        geo: [212.07989, 16.88244, 29.86118]
    }];

    const eph = new Ephemeris(30700.5);
    for (let c of cases) {
        let pos = eph.getPosition(c.planet);
        it(`${c.planet} lambda.`, () => {
            assert.approximately(mathutils.degrees(pos.geo.l), c.geo[0], 1E-4);
        });
        it(`${c.planet} beta`, () => {
            assert.approximately(mathutils.degrees(pos.geo.b), c.geo[1], 1E-4);
        });
        it(`${c.planet} delta`, () => {
            assert.approximately(pos.geo.d, c.geo[2], 1E-4);
        });
    }
});


describe('True geometric positions, Duffett-Smith examples', () => {
    const djd = 30830.5; // 1984 May 30
    const eph = new Ephemeris(djd);
    const cases = [{
        name: 'Mercury',
        helio: {
            l: mathutils.radians(-34.7722),
            b: mathutils.radians(-6.95147),
            r: 0.401741
        },
        geo: {
            l: mathutils.radians(45.9319),
            b: mathutils.radians(-2.78797),
            d: 0.999897
        }
    },
    {
        name: 'Saturn',
        helio: {
            l: mathutils.radians(223.9315),
            b: mathutils.radians(2.33025),
            r: 9.865601
        },
        geo: {
            l: mathutils.radians(221.2009),
            b: mathutils.radians(2.56691),
            d: 8.956587
        }
    }];

    for (let c of cases) {
        const got = eph.getPosition(c.name);
        for (let k of ['l', 'b', 'r']) {
            it(`${c.name}: helio.${k}`, () => {
                assert.approximately(got.helio[k], c.helio[k], 1E-4);
            });
        }

        for (let k of ['l', 'b', 'd']) {
            it(`${c.name}: geo.${k}`, () => {
                assert.approximately(got.geo[k], c.geo[k], 1E-3);
            });
        }
    }

});

describe('Sun position', () => {
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
        const got = new Ephemeris(c.djd).getPosition('Sun');
        it(`DJD #${c.djd} true longitude`, () => {
            assert.approximately(mathutils.degrees(got.l), mathutils.degrees(c.l), 1E-3);
        });
    }
});


describe('Daily motion', () => {
    const cases = [{
        name: 'Moon',
        motion: 14.0721
    },
    {
        name: 'Sun',
        motion: 0.9560
    },
    {
        name: 'Mercury',
        motion: 0.0344
    },
    {
        name: 'Venus',
        motion: 0.9132
    },
    {
        name: 'Mars',
        motion: 0.6832
    },
    {
        name: 'Jupiter',
        motion: 0.1600
    },
    {
        name: 'Saturn',
        motion: -0.0669
    },
    {
        name: 'Uranus',
        motion: 0.0336
    },
    {
        name: 'Neptune',
        motion: -0.0001
    },
    {
        name: 'Pluto',
        motion: -0.0223
    }];

    const eph = new Ephemeris(42165.900896222796); // 2015 Jun, 12.400896222796291
    for (let c of cases) {
        const got = eph.getDailyMotion(c.name);
        it(`${c.name}`, () => {
            assert.approximately(got, c.motion, 1E-4);
        });
    }
});


describe('Lunar Node', () => {
    let res = [true, false].map(f => new Ephemeris(23772.990277, false, f).getPosition('Node'))
        .map(x => mathutils.degrees(x.l));
    let tn = res[0];
    let mn = res[1];
    it('Mean', () => {
        assert.approximately(mn, 80.3117, 1E-4);
    });
    it('True', () => {
        assert.approximately(tn, 78.5948, 1E-4);
    });

    it('Compare True and Mean lunar nodes', () => {
        assert.isAtMost(Math.abs(tn - mn), 3);
    });

});