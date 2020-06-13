'use strict';

var assert = require('chai').assert;
const { NewMoon, FirstQuarter, FullMoon, LastQuarter } = require('../lib/lunation.js');

describe('Search Closest Quarter', () => {

    const cases = [{
        date: [1984, 9, 1],
        quarter: NewMoon,
        found: 30919.3097 //[1984, 8, 26, 19, 26]
    },
    {
        date: [1984, 9, 1],
        quarter: FullMoon,
        found: 30933.79236 //[1984, 9, 10, 7, 1]
    },
    {
        date: [1968, 12, 12],
        quarter: NewMoon,
        found: 25190.263194 // [1968, 12, 19, 18, 19]
    },
    {
        date: [1968, 12, 12],
        quarter: FullMoon,
        found: 25205.26944 // [1969, 1, 3, 18, 28]
    },
    {
        date: [1974, 4, 1],
        quarter: NewMoon,
        found: 27110.39166 // [1974, 3, 23, 21, 24]
    },
    {
        date: [1974, 4, 1],
        quarter: FullMoon,
        found: 27124.375 //[1974, 4, 6, 21, 0]
    },
    {
        date: [1977, 2, 15],
        quarter: NewMoon,
        found: 28172.65118
    },
    {
        date: [1965, 2,  1],
        quarter: FirstQuarter,
        found: 23780.87026
    },
    {
        date: [1965, 2,  1],
        quarter: FullMoon,
        found: 23787.52007
    },
    {
        date: [2044, 1,  1],
        quarter: LastQuarter,
        found: 52616.49186
    },
    {
        date: [2019, 8, 21],
        quarter: NewMoon,
        found: 43705.94287
    },
    {
        date: [2019, 8, 21],
        quarter: FirstQuarter,
        found: 43712.63302
    },
    {
        date: [2019, 8, 21],
        quarter: FullMoon,
        found: 43720.69049
    },
    {
        date: [2019, 8, 21],
        quarter: LastQuarter,
        found: 43728.61252
    }
    ];

    for (let c of cases) {
        const [ye, mo, da] = c.date;
        const quarter = c.quarter;
        it(`${c.quarter.name} near ${ye}-${mo}-${da}`, () => {
            const got = quarter.findClosest(...c.date);
            assert.approximately(got, c.found, 1E-2);
        });
    }
});
