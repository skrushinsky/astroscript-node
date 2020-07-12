'use strict';

const {
  radians,
  degrees,
  ddd
} = require('./mathutils.js');
const timeutils = require('./timeutils.js');
const {
  Ephemeris,
  PLANETS
} = require('./ephemeris.js');
const houses = require('./houses.js');
const points = require('./points.js');
const aspects = require('./aspects.js');

const DEFAULT_GEO = [55.75, -(37 + 35 / 60.0)];
const DEFAULT_OPT = {
  houses: 'Placidus',
  orbsMethod: new aspects.Dariot()
};

module.exports = {

  POINTS: ['Ascendant', 'Midheaven', 'Vertex', 'EastPoint'],

  // params =  {
  //   name: 'New Chart',
  //   date: new Date(),
  //   geo: DEFAULT_GEO,
  //   options: DEFAULT_OPT 
  // }

  BaseChart: class {
    constructor(params) {
      if (!params) {
        params = {}
      };

      this._name = params.name ? params.name : 'New Chart';
      this._date = params.date ? params.date : new Date();
      this._geo = params.geo ? params.geo : DEFAULT_GEO;
      this._options = params.options ? params.options : DEFAULT_OPT;
      // calculated properties
      this._lst = null;
      this._planets = null;
      this._points = null;
      this._cusps = null;
      this._ephemeris = null;
      this._djd = null;
      this._deltaT = null;
    }

    set name(newName) {
      this._name = newName;
    }

    get name() {
      return this._name;
    }

    _clearGeoRelated() {
      this._lst = null;
      this._points = null;
      this._cusps = null;
    }

    _clearTimeRelated() {
      this._planets = null;
      this._ephemeris = null;
      this._djd = null;
      this._deltaT = null;
      this._clearGeoRelated()
    }

    set date(newDate) {
      if (newDate !== this._date) {
        this._date = newDate;
        this._clearTimeRelated();
      }
    }

    get date() {
      return this._date;
    }

    set geo(newGeo) {
      if (newGeo[0] !== this._geo[0] || newGeo[1] !== this._geo[1]) {
        this._geo = newGeo;
        this._clearGeoRelated();
      }
    }

    get geo() {
      return this._geo;
    }

    set options(newOptions) {
      if (newOptions.houses !== this._options.houses) {
        this.options.houses = newOptions.houses;
        this._cusps = null;
      }

      if (newOptions.orbsMethod.name !== this._options.orbsMethod.name) {
        this._options.orbsMethod = newOptions.orbsMethod;
        // TODO: calculate aspects
      }
    }

    get opions() {
      return this._options;
    }

    get djd() {
      if (this._djd === null) {
        const date = this._date;
        const h = ddd(date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
        const d = date.getUTCDate() + h / 24.0;
        this._djd = timeutils.julDay(date.getUTCFullYear(), date.getUTCMonth() + 1, d);
      }
      return this._djd;
    }

    get deltaT() {
      if (this._deltaT === null) {
        this._deltaT = timeutils.deltaT(this.djd);
      }
      return this._deltaT;
    }

    get lst() {
      if (this._lst === null) {
        this._lst = timeutils.localSidereal(this.djd, this._geo[1]);
      }
      return this._lst;
    }

    get ephemeris() {
      if (this._ephemeris === null) {
        this._ephemeris = new Ephemeris(this.djd + this.deltaT / 86400.0, true);
      }
      return this._ephemeris;
    }

    get planets() {
      if (this._planets === null) {
        this._planets = {};
        const eph = this.ephemeris;
        for (let name of PLANETS) {
          let pos;
          switch (name) {
            case 'Sun':
            case 'Moon':
            case 'Node':
              pos = eph.getPosition(name);
              break;
            default:
              pos = eph.getPosition(name).geo;
          }

          this._planets[name] = {
            coords: {
              x: pos.l,
              y: pos.b,
              z: pos.d
            },
            motion: eph.getDailyMotion(name),
            house: houses.inHouse(pos.l, this.cusps)
          };
        }

        // aspects
        const all = PLANETS.map(name => {
          return {
            name: name,
            x: degrees(this._planets[name].coords.x)
          };
        });
        for (const plaName of PLANETS) {
          const source = all.filter(p => p.name === plaName)[0];
          const targets = all.filter(p => p.name !== plaName);
          let plaAspects = new Array();
          for (const data of aspects.iterAspects(source, targets, this._options.orbsMethod, aspects.ALL)) {
            plaAspects.push(data);
          }
          this._planets[plaName].aspects = plaAspects;
        }
      }
      return this._planets;
    }

    get points() {
      if (this._points === null) {
        const ramc = radians(this.lst * 15);
        const eps = this.ephemeris.obliquity;
        const theta = radians(this._geo[0]);

        this._points = {};
        this._points['Midheaven'] = points.midheaven(ramc, eps);
        this._points['Ascendant'] = points.ascendant(ramc, eps, theta);
        this._points['Vertex'] = points.vertex(ramc, eps, theta);
        this._points['EastPoint'] = points.eastpoint(ramc, eps);
      }
      return this._points;
    }

    get cusps() {
      if (this._cusps === null) {
        const sysname = this._options.houses;
        const s = (sysname === 'EqualAsc' || sysname === 'EqualMc') ? 'Equal' : sysname;
        const f = houses.housesFunction(Symbol.for(s));
        const ramc = radians(this.lst * 15);
        const eps = this.ephemeris.obliquity;

        switch (sysname) {
          case 'Placidus':
          case 'Koch':
          case 'Regiomontanus':
          case 'Campanus':
          case 'Topocentric':
            this._cusps = f(ramc, eps, radians(this._geo[0]), this.points['Ascendant'], this.points['Midheaven']);
            break;
          case 'Morinus':
            this._cusps = f(ramc, eps);
            break;
          case 'SignCusp':
            this._cusps = f();
            break;
          case 'EqualAsc':
            this._cusps = f(this.points['Ascendant']);
            break;
          case 'EqualMc':
            this._cusps = f(this.points['Midheaven'], 9);
            break;
          default:
            console.error('Unknown house system: %s', sysname);
        }
      }
      return this._cusps;
    }

    serialize() {
      const data = {
        name: this.name,
        date: this.date,
        djd: this.djd,
        deltaT: this.deltaT,
        lst: this.lst,
        geo: this.geo,
        options: this.options,
        obliquity: this.ephemeris.obliquity,
        nutation: {
          dpsi: this.ephemeris.dpsi,
          deps: this.ephemeris.deps
        },
        planets: this.planets,
        points: this.points,
        cusps: this.cusps
      };
      return JSON.stringify(data);
    }
  }
};
