'use strict';
/************************************************************************************
Positions of Sun, Moon and the major planets.

--
Peter Duffett-Smith,
"Astronomy With Your Personal Computer", Cambridge University Press, 1995.



(с) Sergey Krushinsky, 2017

************************************************************************************/

const {
    PI2,
    radians,
    degrees,
    reduceRad
} = require('./mathutils.js');
const {
    kepler,
    trueAnomaly
} = require('./ephem/kepler.js');
const {
    nutation
} = require('./ephem/nutation.js');
const {
    obliquity
} = require('./ephem/obliquity.js');
const planets = require('./ephem/planets.js');
const sun = require('./ephem/sun.js');
const moon = require('./ephem/moon.js');

const cos = Math.cos;
const sin = Math.sin;
const asin = Math.asin;
const atan2 = Math.atan2;
const atan = Math.atan;
const sqrt = Math.sqrt;
const floor = Math.floor;

const self = module.exports = {
    PLANETS: [
        'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn',
        'Uranus', 'Neptune', 'Pluto', 'Node'
    ],

    Ephemeris: class {
        constructor(djd, apparent = false, trueNode = true) {
            this._djd = djd;
            this._t = djd / 36525;
            this._ms = sun.meanAnomaly(this._t); // TODO: Sun mean anomaly in degrees
            this._positions = new WeakMap();
            this._apparent = apparent;
            this._trueNode = trueNode;
            const nu = nutation(this._t);
            this._dpsi = radians(nu[0]);
            this._deps = radians(nu[1]);
            this._obliquity = null;
            this._sun = null;
            this._prev = null;
            this._next = null;
        }

        // Julian days since 1900.0
        get djd() {
            return this._djd;
        }

        // Julian days in centuries since 1900.0
        get t() {
            return this._t;
        }

        // Apparent flag
        get apparent() {
            return this._apparent;
        }

        // Nutation in longitude, radians
        get dpsi() {
            return this._dpsi;
        }

        // Nutation in obliquity, radians
        get deps() {
            return this._deps;
        }

        // Ecliptic obliquity
        get obliquity() {
            if (this._obliquity === null) {
                this._obliquity = radians(obliquity(this.djd, degrees(this._deps)))
            }
            return this._obliquity
        }

        // Sun true coordinates
        get trueSun() {
            if (this._sun === null) {
                this._sun = sun.trueGeocentric(this._t, this._ms);
            }
            return this._sun;
        }

        // Ephemeris instance 12h before
        get prev() {
            if (this._prev === null) {
                this._prev = new self.Ephemeris(this._djd - 0.5, this._apparent);
            }
            return this._prev;
        }

        // Ephemeris instance 12h ahead
        get next() {
            if (this._next === null) {
                this._next = new self.Ephemeris(this._djd + 0.5, this._apparent);
            }
            return this._next;
        }


        // Calculate perturbations for planet [name],
        // given map of mean anomalie, ma, and eccentricity, s
        getPerturbations(name, ma, s) {
            const pla = planets.forName(name);
            // dispatch arguments
            let args;
            switch (pla.name) {
                case 'Mercury':
                    args = [ma.get('Mercury'), ma.get('Venus'), ma.get('Jupiter')];
                    break;
                case 'Venus':
                    args = [this._t, radians(this._ms), ma.get('Venus'), ma.get('Jupiter')];
                    break;
                case 'Mars':
                    args = [radians(this._ms), ma.get('Venus'), ma.get('Mars'), ma.get('Jupiter')];
                    break;
                case 'Jupiter':
                case 'Saturn':
                case 'Uranus':
                case 'Neptune':
                    args = [this._t, s];
                    break;
                default:
                    args = [];
            }
            return pla.calculatePerturbations.apply(this, args);
        }

        _earth() {
            const [lsn, re] = this.trueSun;
            return [lsn + Math.PI, re];
        }


        _helio(name, s, sa, ph, inc, nd, lg, re, dt = 0) {
            // calculate mean anomalies of all planets with respect to light-time (dt)
            const manom = planets.meanAnomalies(this._t, dt);
            const pert = this.getPerturbations(name, manom, s);
            s += pert.ds; // eccentricity corrected
            const ma = manom.get(name) + pert.dm; // mean anomaly corrected
            const ea = kepler(s, ma - PI2 * floor(ma / PI2)); // eccentric anomaly
            const nu = trueAnomaly(s, ea); // true anomaly
            const rp = (sa + pert.da) * (1 - s * s) / (1 + s * cos(nu)) + pert.dr; // radius-vector
            const lp = nu + ph + (pert.dml - pert.dm); // planet's orbital longitude
            const lo = lp - nd;
            const sin_lo = sin(lo);
            const spsi = sin_lo * sin(inc);
            const y = sin_lo * cos(inc);
            const psi = asin(spsi) + pert.dhl; // heliocentric latitude
            const lpd = atan2(y, cos(lo)) + nd + radians(pert.dl);
            const cpsi = cos(psi);
            const rpd = rp * cpsi;
            const ll = lpd - lg;
            const rho = sqrt(re * re + rp * rp - 2 * re * rp * cpsi * cos(ll)); // distance from the Earth

            return [ll, rpd, lpd, sin(psi), cpsi, rho, lp, psi, rp];
        }


        _calculatePlanet(name) {
            // Earth
            let [lg, re] = this._earth();

            // Heliocentric
            const pla = planets.forName(name);
            const o = pla.orbit.instantiate(this._t);
            const h = [];
            h[0] = this._helio(name, o.s, o.sa, o.ph, o.inc, o.nd, lg, re);
            h[1] = this._helio(name, o.s, o.sa, o.ph, o.inc, o.nd, lg, re, h[0][5] * 5.775518e-3);

            // Geocentric
            const sll = sin(h[1][0]);
            const cll = cos(h[1][0]);

            let lam; // geocentric ecliptic longitude
            if (name === 'Mercury' || name === 'Venus') {
                // inner planets
                lam = atan2(-1 * h[1][1] * sll, re - h[1][1] * cll) + lg + Math.PI;
            } else {
                // outer planets
                lam = atan2(re * sll, h[1][1] - re * cll) + h[1][2];
            }
            // geocentric latitude
            let bet = atan(h[1][1] * h[1][3] * sin(lam - h[1][2]) / (h[1][4] * re * sll));

            if (this._apparent) {
                lam += this._dpsi; // nutation
                // aberration
                const a = lg + Math.PI - lam;
                const ca = cos(a);
                const sa = sin(a);
                lam -= (9.9387e-5 * ca / cos(bet));
                bet -= (9.9387e-5 * sa * sin(bet));
            }
            lam = reduceRad(lam);

            return {
                helio: {
                    l: h[0][2],
                    b: h[0][7],
                    r: h[0][8]
                },
                geo: {
                    l: lam,
                    b: bet,
                    d: h[0][5]
                }
            };

        }

        _calculateSun() {
            let [lsn, re] = this.trueSun;
            if (this._apparent) {
                // nutation and aberration
                lsn += this._dpsi - radians(5.69e-3);
                // light travel
                const lt = 1.365 * re; // seconds
                lsn -= radians(lt * 15 / 3600); // convert to radians and subtract
            }
            return {
                l: reduceRad(lsn),
                b: 0,
                d: re
            };
        }

        _calculateMoon() {
            let [lam, bet, del, hp, dm] = moon.truePosition(this._djd);
            if (this._apparent) {
                lam = reduceRad(lam + this._dpsi);
            }
            return {
                l: lam,
                b: bet,
                d: del,
                hp: hp,
                dm: dm
            };
        }

        _calculateNode() {
            const tn = moon.node(this._djd, this._trueNode);
            return {
                l: tn,
                b: 0,
                d: 0
            };
        }

        ///////////////////////////////////////////////////////////////////////
        // Given a planet name, returns object representing  its heliocentric and
        // geocentric position:
        //
        // The 'helio' keys contains:
        // l : heliocentric longitude
        // b : heliocentric latitude
        // r : radius-vector
        // The 'geo' part:
        // l : geocentric ecliptic longitude
        // b : geocentric ecliptic latitude
        // d : distance from the Earth, AU
        //
        // All angles in radians.
        //
        // The geocentric latitide and longitude are corrected for light time.
        // These are the apparent values as seen from the center of the Earth
        // at the given instant. If Ephemeris instance 'apparent' flag is set
        // to 'true', then corrections for nutation and aberration are also
        // applied.
        ///////////////////////////////////////////////////////////////////////
        getPosition(name) {
            const k = {
                name: name
            };
            if (!this._positions.has(k)) {
                let pos;
                switch (name) {
                    case 'Sun':
                        pos = this._calculateSun();
                        break;
                    case 'Moon':
                        pos = this._calculateMoon();
                        break;
                    case 'Node':
                        pos = this._calculateNode();
                        break;
                    default:
                        pos = this._calculatePlanet(name);
                }
                this._positions.set(k, pos);
            }
            return this._positions.get(k);
        }

        getDailyMotion(name) {
            if (name === 'Moon') {
                return this.getPosition(name)['dm'];
            } else {
                const prev = this.prev.getPosition(name);
                const next = this.next.getPosition(name);
                const x0 = (name === 'Sun' || name === 'Node') ? prev.l : prev.geo.l;
                const x1 = (name === 'Sun' || name === 'Node') ? next.l : next.geo.l;
                return degrees(x1 - x0);
            }

        }

    }
};