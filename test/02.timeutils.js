'use strict';

var assert = require('chai').assert;
const timeutils = require('../src/timeutils.js');


describe('Julian Day', () => {

    const cases = [{
        year: 1984,
        month: 8,
        day: 29,
        djd: 30921.5
    },
    {
        year: 1899,
        month: 12,
        day: 31.5,
        djd: 0
    },
    {
        year: 1938,
        month: 8,
        day: 17,
        djd: 14107.5
    },
    {
        year: 1,
        month: 1,
        day: 1,
        djd: -693596.5
    },
    {
        year: -4713,
        month: 7,
        day: 12,
        djd: -2414827.5
    },
    {
        year: -4713,
        month: 1,
        day: 1.5,
        djd: -2415020
    }];

    for (let c of cases) {
        it(`Date ${c.year}.${c.month}.${c.day} --> DJD ${c.djd}`, () => {
            assert.approximately(timeutils.julDay(c.year, c.month, c.day), c.djd, 1E-6);
        });
        it(`DJD ${c.djd} --> Date ${c.year}.${c.month}.${c.day}`, () => {
            let ymd = timeutils.calDay(c.djd);
            assert.equal(ymd[0], c.year, 'year');
            assert.equal(ymd[1], c.month, 'month');
            assert.approximately(ymd[2], c.day, 1E-6, 'day');
        });
    }
    it('Zero date (Jan 0.5, 1900)', () => {
        assert.approximately(timeutils.julDay(1900, 1, 0.5), 0, 1E-6);
    });

});


describe('Weekdays', () => {

    const cases = [
        [30921.5, 3],
        [0, 0],
        [14107.5, 3],
        [-693596.5, 6],

        // Not sure about weekDays of the next two dates; there are controverses;
        // Perl  DateTime module gives weekDays 5 and 4 respectively
        [-2414827.5, 5],
        [-2415020, 1],
        [23772.99, 1],
    ];

    for (let c of cases) {
        it(`${c[0]} should be weekDay ${c[1]}`, () => {
            assert.equal(timeutils.weekDay(c[0]), c[1]);
        });
    }

});


describe('Delta-T', () => {
    const cases = [
        [-102146.5, 119.51, 'historical start'], // 1620-05-01
        [-346701.5, 1820.325, 'after 948'], // # 950-10-01
        [44020.5, 93.81, 'after 2010'], // 2020-07-10
        [109582.5, 407.2, 'after 2100'], // ?
    ];

    for (let c of cases) {
        it(`${c[2]} - DJD ${c[0]} should be ${c[1]}`, () => {
            assert.approximately(timeutils.deltaT(c[0]), c[1], 1e-2);
        });
    }

});

describe('Sidereal Time', () => {
    const cases = [{
        djd: 30923.851053,
        lst: 7.072111,
        utc: 8.425278,
        ok: true
    }, // 1984-08-31.4
    {
        djd: 683.498611,
        lst: 3.525306,
        utc: 23.966667,
        ok: false
    }, // 1901-11-15.0
    {
        djd: 682.501389,
        lst: 3.526444,
        utc: 0.033333,
        ok: false
    }, // 1901-11-14.0
    {
        djd: 29332.108931,
        lst: 4.668119,
        utc: 14.614353,
        ok: true
    }]; // 1980-04-22.6

    for (let c of cases) {
        it(`DJD ${c.djd} to LST`, () => {
            assert.approximately(timeutils.localSidereal(c.djd), c.lst, 1e-4);
        });
        it(`LST ${c.lst} to UTC, non-ambiguous: ${c.ok}`, () => {
            let got = timeutils.siderealToUTC(c.djd, c.lst);
            if (got[1]) {
                // non-ambiguous
                assert.approximately(got[0], c.utc, 1e-4, `utc: ${got[0]}, ok: ${got[1]}`);
            } else {
                // ambiguous
                assert.equal(got[1], c.ok, `utc: ${got[0]}, ok: ${got[1]}`);
            }
        });

    }

});