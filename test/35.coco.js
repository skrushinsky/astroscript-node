'use strict'

const assert = require('chai').assert;
const mathutils = require('../src/mathutils.js');
const coco = require('../src/coco.js');

const ddd = mathutils.ddd;
const radians = mathutils.radians;
const degrees = mathutils.degrees;

const EQUECL = [
    {
        ob : 23.44574451788568,
        ra : ddd(14, 26, 57) * 15,
        de : ddd(32, 21, 5),
        lo : ddd(200, 19, 6.66),
        la : ddd(43, 47, 13.83)
    },
    {
        ob : 23.43871898795463,
        ra : ddd(0, 0, 5.5) * 15,
        de : ddd(-87, 12, 12),
        lo : ddd(277, 0, 6.26),
        la : ddd(-66, 24, 19.75)
    }
];

const EQUHOR = [
    {
        gl : ddd(51, 15, 0),
        ha : ddd(8, 37, 20),
        de : ddd(14, 23, 55),
        az : ddd(310, 15, 33.6),
        al : ddd(-10, 58, 20.8)
    },
    {
        gl : ddd(-20, 31, 13),
        ha : ddd(23, 19, 0),
        de : ddd(-43, 0, 0),
        az : ddd(161, 23, 19),
        al : ddd(65, 56, 6.1)
    }
];

describe('Equatorial -> Ecliptical', _ => {
    for (let c of EQUECL) {
        const coo = coco.equ2ecl(radians(c.ra), radians(c.de), radians(c.ob));
        it(`longitude`, () => {
          assert.approximately(degrees(coo[0]), c.lo, 1E-4);
        });
        it(`latitude`, () => {
          assert.approximately(degrees(coo[1]), c.la, 1E-4);
        });
    }
});

describe('Ecliptical-> Equatorial', _ => {
    for (let c of EQUECL) {
        const coo = coco.ecl2equ(radians(c.lo), radians(c.la), radians(c.ob));
        it(`right ascension`, () => {
          assert.approximately(degrees(coo[0]), c.ra, 1E-4);
        });
        it(`declination`, () => {
          assert.approximately(degrees(coo[1]), c.de, 1E-4);
        });
    }
});


describe('Equatorial -> Horizontal', _ => {
    for (let c of EQUHOR) {
        const coo = coco.equ2hor(radians(c.ha * 15), radians(c.de), radians(c.gl));
        it(`azimuth`, () => {
          assert.approximately(degrees(coo[0]), c.az, 1E-4);
        });
        it(`altitude`, () => {
          assert.approximately(degrees(coo[1]), c.al, 1E-4);
        });
    }
});



describe('Horizontal => Equatorial', _ => {
    for (let c of EQUHOR) {
        const coo = coco.hor2equ(radians(c.az), radians(c.al), radians(c.gl));
        it(`hour angle`, () => {
          assert.approximately(degrees(coo[0]) / 15, c.ha, 1E-4);
        });
        it(`declination`, () => {
          assert.approximately(degrees(coo[1]), c.de, 1E-4);
        });
    }
});
