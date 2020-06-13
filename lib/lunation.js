'use strict';
/************************************************************************************
Lunar phases & eclipses.

 (с) Sergey Krushinsky, 2019

************************************************************************************/
const {
    isLeapYear,
    dayOfYear
} = require('./timeutils.js');
const {
    radians,
    reduceDeg,
    //toRange
} = require('./mathutils.js');



const sin = Math.sin;
const cos = Math.cos;

function nf_delta(t, ms, mm, f) {
    const [tms, tmm, tf] = [ms, mm, f].map(x => {
        return x * 2;
    });
    return (1.734e-1 - 3.93e-4 * t) * sin(ms) +
        2.1e-3 * sin(tms) -
        4.068e-1 * sin(mm) +
        1.61e-2 * sin(tmm) -
        4e-4 * sin(mm + tmm) +
        1.04e-2 * sin(tf) -
        5.1e-3 * sin(ms + mm) -
        7.4e-3 * sin(ms - mm) +
        4e-4 * sin(tf + ms) -
        4e-4 * sin(tf - ms) -
        6e-4 * sin(tf + mm) +
        1e-3 * sin(tf - mm) +
        5e-4 * sin(ms + tmm);
}

function fl_delta(t, ms, mm, f) {
    const [tms, tmm, tf] = [ms, mm, f].map(x => {
        return x * 2;
    });
    return (0.1721 - 0.0004 * t) * sin(ms) +
        0.0021 * sin(tms) -
        0.6280 * sin(mm) +
        0.0089 * sin(tmm) -
        0.0004 * sin(tmm + mm) +
        0.0079 * sin(tf) -
        0.0119 * sin(ms + mm) -
        0.0047 * sin(ms - mm) +
        0.0003 * sin(tf + ms) -
        0.0004 * sin(tf - ms) -
        0.0006 * sin(tf + mm) +
        0.0021 * sin(tf - mm) +
        0.0003 * sin(ms + tmm) +
        0.0004 * sin(ms - tmm) -
        0.0003 * sin(tms + mm);
}

class QuarterQuery {
    constructor(ye, mo, da, quarter) {
        this.quarter = quarter;
        const n = isLeapYear(ye) ? 366 : 365;
        const y  = ye + dayOfYear(ye, mo, da) / n;
        this.k  = Math.round(( y - 1900 ) * 12.3685) + quarter.coeff;
    }

    search() {
        const t = this.k / 1236.85;
        const t2 = t * t;
        const t3 = t2 * t;

        const c = radians(166.56 + (132.87 - 9.173e-3 * t) * t);
        const j = 0.75933 +
            29.53058868 * this.k +
            0.0001178 * t2 -
            1.55e-07 * t3 +
            3.3e-4 * sin(c); // mean lunar phase

        const [ms, mm, f] = [
            [359.2242, 29.105356080, -0.0000333, -0.00000347],
            [306.0253, 385.81691806, 0.0107306, 0.00001236],
            [21.2964, 390.67050646, -0.0016528, -0.00000239]
        ].map(args => {
            return radians(
                reduceDeg(args[0] + args[1] * this.k + args[2] * t2 + args[3] * t3)
            );
        });

        return j + this.quarter.calculateDelta(t, ms, mm, f);
    }
}

class Quarter {
    constructor(name, coeff) {
        this.name = name;
        this.coeff = coeff;
    }

    findClosest(ye, mo, da) {
        const qq = new QuarterQuery(ye, mo, da, this);
        return qq.search();
    }
}

class NewMoon extends Quarter {
    constructor() {
        super('New Moon', 0);
    }

    calculateDelta(t, ms, mm, f) {
        return nf_delta(t, ms, mm, f);
    }
}

class FirstQuarter extends Quarter {
    constructor() {
        super('First Quarter', 0.25);
    }

    calculateDelta(t, ms, mm, f) {
        const delta = fl_delta(t, ms, mm, f);
        const w = 0.0028 - 0.0004 * cos(ms) + 0.0003 * cos(ms);
        return delta + w;
    }
}

class FullMoon extends Quarter {
    constructor() {
        super('Full Moon', 0.5);
    }

    calculateDelta(t, ms, mm, f) {
        return nf_delta(t, ms, mm, f);
    }
}

class LastQuarter extends Quarter {
    constructor() {
        super('Last Quarter', 0.75);
    }

    calculateDelta(t, ms, mm, f) {
        const delta = fl_delta(t, ms, mm, f);
        const w = 0.0028 - 0.0004 * cos(ms) + 0.0003 * cos(ms);
        return delta - w;

    }
}


module.exports = {
    NewMoon: new NewMoon(),
    FirstQuarter: new FirstQuarter(),
    FullMoon: new FullMoon(),
    LastQuarter: new LastQuarter()
};
