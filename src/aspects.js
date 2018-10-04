'use strict';
/************************************************************************************
Astrological aspects

(с) Sergey Krushinsky, 2018

************************************************************************************/

const { diffAngleDeg } = require('./mathutils.js');

class Aspect {
    constructor(name, briefName, value, influence, typeFlag) {
        this._name = name
        this._briefName = briefName
        this._value = value
        this._influence = influence
        this._typeFlag = typeFlag
    }

    get value() {
        return this._value
    }

    get name() {
        return this._name
    }

    get briefName() {
        return this._briefName
    }

    get influence() {
        return this._influence
    }

    get typeFlag() {
        return this._typeFlag
    }

}

const MAJOR = 0x1
const MINOR = MAJOR << 1
const KEPLER = MAJOR << 2
const ALL = MAJOR | MINOR | KEPLER

const CONJUNCTION = new Aspect("Conjunction", "cnj", 0, Symbol.for('Neutral'), MAJOR)
const VIGINTILE = new Aspect("Vigintile", "vgt", 18, Symbol.for('Neutral'), KEPLER)
const QUINDECILE = new Aspect("Quindecile", "qdc", 24, Symbol.for('Neutral'), KEPLER)
const SEMISEXTILE = new Aspect("Semisextile", "ssx", 30, Symbol.for('Positive'), MINOR)
const DECILE = new Aspect("Decile", "dcl", 36, Symbol.for('Neutral'), KEPLER)
const SEXTILE = new Aspect("Sextile", "sxt", 60, Symbol.for('Positive'), MAJOR)
const SEMISQUARE = new Aspect("Semisquare", "ssq", 45, Symbol.for('Negative'), MINOR)
const QUINTILE = new Aspect("Quintile", "qui", 72, Symbol.for('Neutral'), KEPLER)
const SQUARE = new Aspect("Square", "sqr", 90, Symbol.for('Negative'), MAJOR)
const TRIDECILE = new Aspect("Tridecile", "tdc", 108, Symbol.for('Positive'), MINOR)
const TRINE = new Aspect("Trine", "tri", 120, Symbol.for('Positive'), MAJOR)
const SESQUIQUADRATE = new Aspect("Sesquiquadrate", "sqq", 135, Symbol.for('Negative'), MINOR)
const BIQUINTILE = new Aspect("Biquintile", "bqu", 144, Symbol.for('Neutral'), KEPLER)
const QUINCUNX = new Aspect("Quincunx", "qcx", 150, Symbol.for('Negative'), MINOR)
const OPPOSITION = new Aspect("Opposition", "opp", 180, Symbol.for('Negative'), MAJOR)

const ASPECTS = new Set([
    CONJUNCTION, VIGINTILE, QUINDECILE, SEMISEXTILE, DECILE, SEXTILE,
    SEMISQUARE, QUINTILE, SQUARE, TRIDECILE, TRINE,
    SESQUIQUADRATE, BIQUINTILE, QUINCUNX, OPPOSITION
])


class OrbsMethod {
    // There are different ways to determine, whether two planets are in
    // aspect. Subclasses implement 'is_aspect' method which detects aspect
    // using specific rules.
    constructor(name) {
        this._name = name
        if (this.isAspect === undefined) {
            // or maybe test typeof this.method === "function"
            throw new TypeError("Must override isAspect method");
        }
    }

    get name() {
        return this._name
    }
}

class Dariot extends OrbsMethod {

    // Claude Dariot (1533-1594), introduced the so called 'moieties' (mean-values)
    // when calculating orbs. According to Dariot, Mercury and the Moon enter completion
    // (application) of any aspect at a  distance of 9½° degrees - the total of their
    // respective moieties (Mercury = 3½° + Moon = 6°). This method became the standard
    // for European Renaissance astrologers.
    // The method does not take into account the nature of aspects.

    static get DEFAULT_MOIETY() {
        return 4.0
    }

    static get MOIETIES() {
        return {
            Moon: 12.0,
            Sun: 15.0,
            Mercury: 7.0,
            Venus: 7.0,
            Mars: 8.0,
            Jupiter: 9.0,
            Saturn: 9.0,
            Uranus: 6.0,
            Neptune: 6.0,
            Pluto: 5.0
        }
    }

    constructor() {
        super('Classic (Claude Dariot)')
    }

    getMoiety(name) {
        return name in Dariot.MOIETIES ? Dariot.MOIETIES[name] : Dariot.DEFAULT_MOIETY
    }

    calculateOrb(srcName, dstName) {
        // Calculate mean orb for planets src and dst,
        const a = this.getMoiety(srcName)
        const b = this.getMoiety(dstName)
        return (a + b) / 2.0
    }

    isAspect(srcName, dstName, asp, arc) {
        const delta = Math.abs(arc - asp.value)
        const orb = this.calculateOrb(srcName, dstName)
        return delta <= orb
    }

}


class DeVore extends OrbsMethod {
    // Some modern astrologers believe that orbs are based on aspects.
    // The values are from "Encyclopaedia of Astrology" by Nicholas deVore.

    static get RANGES() {
        return {
            Conjunction: [-10.0, 6.0],
            Vigintile: [17.5, 18.5],
            Quindecile: [23.5, 24.5],
            Semisextile: [28.0, 31.0],
            Decile: [35.5, 36.5],
            Sextile: [56, 63],
            Semisquare: [42.0, 49.0],
            Quintile: [71.5, 72.5],
            Square: [84.0, 96.0],
            Tridecile: [107.5, 108.5],
            Trine: [113.0, 125.0],
            Sesquiquadrate: [132.0, 137.0],
            Biquintile: [143.5, 144.5],
            Quincunx: [148.0, 151.0],
            Opposition: [174, 186]
        }

    }

    constructor() {
        super('By Aspect (Nicholas deVore)')
    }

    isAspect(src, dst, asp, arc) {
        const aspRange = DeVore.RANGES[asp.name]
        return aspRange[0] <= arc && aspRange[1] >= arc
    }
}

class ClassicWithAspectRatio extends OrbsMethod {
    // Combined approach. For major aspects classic (Dariot) method is applied.
    // For minor and kepler aspects we apply to the classic orb value a
    // special coefficient: by default, 0.6 (60%) for minor and 0.4 (40%) for keplerian.

    constructor(minorCoeff = 0.6, keplerCoeff = 0.4) {
        super('Classic with regard to Aspect type')
        this._minorCoeff = minorCoeff
        this._keplerCoeff = keplerCoeff

        this._classic = new Dariot()
    }

    isAspect(src, dst, asp, arc) {
        let orb = this._classic.calculateOrb(src, dst)
        if (asp.type === MINOR) {
            orb *= this._minorCoeff
        } else if (asp.type === KEPLER) {
            orb *= this._keplerCoeff
        }
        const delta = Math.abs(arc - asp.value)
        return delta <= orb
    }
}


// Given two planetary ppositions, find closest aspect between them
// or null, if there are no aspects.
//
// source: planet name (String)
// target: planet name (String)
// orbsMethod: OrbsMethod instance
// typeFlags: Integer, a combination of MAJOR, MINOR and KEPLER constants
//
function findClosest(sourceName, targetName, arc, orbsMethod, typeFlags) {
    let closest = null
    for (let asp of ASPECTS) {
        if (typeFlags & asp.typeFlag) {
            if (orbsMethod.isAspect(sourceName, targetName, asp, arc)) {
                const delta = Math.abs(asp.value - arc)
                if (closest === null || closest.delta > delta) {
                    closest = {
                        aspect: asp,
                        delta: delta
                    }
                }
            }
        }
    }
    return closest
}


const self = module.exports = {
    MAJOR, MINOR, KEPLER, ALL,
    Dariot, DeVore, ClassicWithAspectRatio,

    // Given a planetary position, search its aspects to range of planetary positions.
    //
    // source: Object of {x: longitude in radians, name: planet identifier }
    // targets: array of other bodies, each element represented by an object similar to source argiument
    // orbsMethod: OrbsMethod instance
    // typeFlags: Integer, a combination of MAJOR, MINOR and KEPLER constants
    //
    // When aspect is found, yield an object containing:
    // target: name of aspected planet (String)
    // aspect: Aspect instance
    // arc: angular distance between planets (degrees)
    // delta: difference between actual distance and exact aspect value
    * iterAspects(source, targets, orbsMethod, typeFlags=ALL) {
        for (let target of targets) {
            let arc = Math.abs(source.x - target.x)
            if (arc > 180) {
                arc = 360 - arc
            }
            if (arc < 0) {
                arc += 360
            }
            const closest = findClosest(source.name, target.name, arc, orbsMethod, typeFlags)
            if (closest !== null) {
                yield {
                    target: target.name,
                    aspect: closest.aspect,
                    arc: arc,
                    delta: closest.delta
                }
            }
        }
    },

    // Given array of planetary positions [{ name: String, x: degrees }...], yield each stellium
    // or a single planet in case there are no other planets closer than the gap (10° by default).
    // Technicaly that means partitioning of planetary positions with regard to their angular
    // distances.
    * iterStelliums(positions, gap=10.0) {
        let sorted = positions.slice()
        sorted.sort( (a, b) => {return a.x - b.x} )
        const lastIndex = sorted.length - 1
        let group = null
        let index = 0

        while (index <= lastIndex) {
            const curr = sorted[index]
            if (null === group) {
                group = new Array()
            }
            group.push(curr)
            if (index < lastIndex) {
                const next = sorted[index+1]
                if (diffAngleDeg(curr.x, next.x) > gap) {
                    yield group
                    group = null
                }
            } else {
                yield group
                group = null
            }

            index++
        }
    }
}