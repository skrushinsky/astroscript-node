'use strict';
/************************************************************************************
Astrological Houses.

Available house systems are:

    1. Quadrant-based systems: Placidus, Koch, Regiomontanus, Campanus, Topocentric.
    2. Morinus System.
    3. Equal Systems.

To calculate cusps:

    1. Obtain appropriate function: f = houses_function(hsystem)
    2. Call the function with required arguments.
    3. Iterate on results

Most of the Quadrant-based systems fail at high geographical latitudes. In such cases
cusps function will raise AssertionError.


 (с) Sergey Krushinsky, 2017

************************************************************************************/

const { radians, diffAngle, reduceRad } = require ('./mathutils.js');
const { ascendant } =  require('./points.js');

const HOUSES_PLACIDUS = Symbol.for('Placidus');
const HOUSES_KOCH = Symbol.for('Koch');
const HOUSES_REGIOMONTANUS = Symbol.for('Regiomontanus');
const HOUSES_CAMPANUS = Symbol.for('Campanus');
const HOUSES_TOPOCENTRIC = Symbol.for('Topocentric');
const HOUSES_MORINUS = Symbol.for('Morinus');
const HOUSES_EQUAL = Symbol.for('Equal');

const HALF_SECOND = 0.5 / 3600;

const [R30, R60, R90, R120, R150] = [30, 60, 90, 120, 150].map( x => radians(x) );

const abs = Math.abs;
const cos = Math.cos;
const tan = Math.tan;
const sin = Math.sin;
const asin = Math.asin;
const atan2 = Math.atan2;
const acos = Math.acos;
//const atan = Math.atan;
const PI = Math.PI;

//const _BASE_CUSPS = [10, 11, 1, 2];
const _PLAC_ARGS = [[10, 3.0, R30], [11, 1.5, R60], [1, 1.5, R120], [2, 3, R150]];
const _PLAC_DELTA = 1e-4;
const _TOPO_ARGS = [[-R60, 1], [-R30, 2], [R30, 2], [R60, 1]];

class QuadrantSystem {

    constructor(name, ramc, eps, theta, asc, mc) {
        if (abs(theta) > R90 - abs(eps)) {
            throw new Error('This system fails at high latitudes');
        }

        this.name = name;
        this.ramc = ramc;
        this.eps = eps;
        this.theta = theta;
        this.asc = asc;
        this.mc = mc;
    }


    initCusps(base) {
        // base are longitudes of cusps 11, 12, 2, 3, in radians
        return [
            this.asc,
            base[2],
            base[3],
            reduceRad(this.mc + PI),
            reduceRad(base[0] + PI),
            reduceRad(base[1] + PI),
            reduceRad(this.asc + PI),
            reduceRad(base[2] + PI),
            reduceRad(base[3] + PI),
            this.mc,
            base[0],
            base[1]
        ];
    }

}



class Placidus extends QuadrantSystem {

    constructor(ramc, eps, theta, asc, mc) {
        super('Placidus', ramc, eps, theta, asc, mc);
        this._cs_eps = cos(this.eps);
        this._tt = tan(theta) * tan(eps);
    }

    calcCusp(i, f, x0) {
        const [k, r] = (i === 10 || i === 11) ? [-1, this.ramc] : [1, this.ramc+PI];
        const tt = this._tt;
        const nextX = function(last_x) {
            const x = r - k * (acos(k * sin(last_x) * tt)) / f;
            if (abs(diffAngle(x, last_x)) > _PLAC_DELTA) {
                return nextX(x);
            } else {
                return x;
            }
        };

        const l = nextX(x0 + this.ramc);
        return reduceRad(atan2(sin(l), this._cs_eps * cos(l)));
    }


    get cusps() {
        const base = _PLAC_ARGS.map( _ => Placidus.prototype.calcCusp.apply(this, _ ) );
        return this.initCusps(base);
    }
}

class Koch extends QuadrantSystem {
    constructor(ramc, eps, theta, asc, mc) {
        super('Koch', ramc, eps, theta, asc, mc);

        const tn_the = tan(theta);
        const sn_eps = sin(eps);
        const sn_mc = sin(mc);
        const k = asin(tn_the * tan(asin(sn_mc * sn_eps)));
        const k1 = k / 3;
        const k2 = k1 * 2;
        this._offsets = [ -R60 - k2, -R30 - k1, R30 + k1, R60 + k2 ];

    }

    get cusps() {
        const base = this._offsets.map(
            x => ascendant(this.ramc + x, this.eps, this.theta)
        );
        return this.initCusps(base);
    }
}


class RegioMontanus extends QuadrantSystem {

    constructor(ramc, eps, theta, asc, mc) {
        super('RegioMontanus', ramc, eps, theta, asc, mc);
        this._tn_the = tan(theta);
    }

    calcCusp(h) {
        const rh = this.ramc + h;
        const r = atan2(sin(h) * this._tn_the, cos(rh));
        return reduceRad(atan2(cos(r) * tan(rh), cos(r + this.eps)));
    }

    get cusps() {
        const base = [R30, R60, R120, R150].map( x => this.calcCusp(x) );
        return this.initCusps(base);
    }

}


class Campanus extends QuadrantSystem {

    constructor(ramc, eps, theta, asc, mc) {
        super('Campanus', ramc, eps, theta, asc, mc);
        this._sn_the = sin(theta);
        this._cs_the = cos(theta);
        this._rm90 = ramc + R90;
    }

    calcCusp(h) {
        const sn_h = sin(h);
        const d = this._rm90 - atan2(cos(h), sn_h * this._cs_the);
        const c = atan2(tan(asin(this._sn_the * sn_h)), cos(d));
        return reduceRad(atan2(tan(d) * cos(c), cos(c + this.eps)));
    }

    get cusps() {
        const base = [R30, R60, R120, R150].map( x => this.calcCusp(x) );
        return this.initCusps(base);
    }
}


class Topocentric extends QuadrantSystem {

    constructor(ramc, eps, theta, asc, mc) {
        super('Topocentric', ramc, eps, theta, asc, mc);
        this._tn_the = tan(theta);
    }

    get cusps() {
        const base = _TOPO_ARGS.map(
            _ => ascendant(this.ramc + _[0], this.eps, atan2(_[1] * this._tn_the, 3))
        );
        return this.initCusps(base);
    }
}


class Morinus {
    constructor(ramc, eps) {
        this.ramc = ramc;
        this.eps = eps;
        this.cs_eps = cos(eps);
    }

    get cusps() {
        const cusps = [];
        for (let i = 0; i < 12; i++) {
            const r = this.ramc + R60 + R30 * (i + 1);
            cusps.push(reduceRad(atan2(sin(r) * this.cs_eps, cos(r))));
        }
        return cusps;
    }
}


class Equal {
    constructor(startx=0.0, startn=0) {
        this.startx = startx;
        this.startn = startn;
    }

    get cusps() {
        const cusps = [];
        for (let i = 0; i < 12; i++) {
            const n = (this.startn + i) % 12;
            cusps[n] = reduceRad(this.startx + R30 * i);
        }
        return cusps;
    }
}

module.exports = {
    QUADRANT_SYSTEMS: new Set([HOUSES_PLACIDUS, HOUSES_KOCH, HOUSES_REGIOMONTANUS, HOUSES_CAMPANUS, HOUSES_TOPOCENTRIC]),


    // Given a House System symbol, return function for calculating cusps.
    //
    // Functions for Quadrant-based systems (Placidus, Koch, Regiomontanus, Campanus, Topocentric)
    // accept common set of named arguments: f(ramc=None, eps=None, theta=None, asc=None, mc=None)
    //
    // ramc - Right ascension of the Midheaven
    // eps - Obliquity of the Ecliptic
    // theta - Geographical latitude
    // asc - Ascendant
    // mc - Midheaven
    //
    // Function for Morinus System: f(ramc=None, eps=None)
    //
    // Function for Equal System: f(startx=0, startn=0), where startx is longitude of the starting cusp startn.
    // Some examples:
    // f() gives so-called WholeSign cusps (0, 30, 60, 90...)
    // f(asc) - Equal from the Ascendant (asc, asc+30, asc+60, asc+90...)
    // f(mc, 9) - Equal from Mid-heaven (mc-90, mc-120, mc-150, mc-180...)
    //
    // Each function returns array of longitudes [0..11] in radians.
    //
    // All angles are in radians.
    housesFunction(hsystem) {
        switch(hsystem) {
        case HOUSES_PLACIDUS:
            return function(ramc, eps, theta, asc, mc) {
                return new Placidus(ramc, eps, theta, asc, mc).cusps;
            };
        case HOUSES_KOCH:
            return function(ramc, eps, theta, asc, mc) {
                return new Koch(ramc, eps, theta, asc, mc).cusps;
            };
        case HOUSES_REGIOMONTANUS:
            return function(ramc, eps, theta, asc, mc) {
                return new RegioMontanus(ramc, eps, theta, asc, mc).cusps;
            };
        case HOUSES_CAMPANUS:
            return function(ramc, eps, theta, asc, mc) {
                return new Campanus(ramc, eps, theta, asc, mc).cusps;
            };
        case HOUSES_TOPOCENTRIC:
            return function(ramc, eps, theta, asc, mc) {
                return new Topocentric(ramc, eps, theta, asc, mc).cusps;
            };
        case HOUSES_MORINUS:
            return function(ramc, eps) {
                return new Morinus(ramc, eps).cusps;
            };
        case HOUSES_EQUAL:
            return function(startx=0, startn=0) {
                return new Equal(startx, startn).cusps;
            };
        default:
            throw new Error(`Unknown houses system: "${String(hsystem)}"`);
        }
    },


    // Given a longitude, return which of the twelve houses it falls in.
    // Remember that a special check has to be done for the house that spans 0 degrees Aries.
    //
    // Arguments:
    // longitude, in radians
    // cusps 0..11, in radians
    //
    // Returns:
    // house number (zero-based), or -1 if not found
    inHouse(x, cusps) {
        const r = reduceRad(x + radians(HALF_SECOND));
        for(let i = 0; i < 12; i++) {
            const a = cusps[i];
            const b = cusps[(i + 1) % 12];
            if (((a <= r) && (r < b)) || (a > b && (r >= a || r < b))) {
                return i;
            }
        }
    }


};
