'use strict';

const { resolve } = require('path')
const util = require('util')
const gd = require('node-gd')
const tmp = require('tmp')
const tmpName = util.promisify(tmp.tmpName)
const tempDir = require('temp-dir')
const createTrueColor = util.promisify(gd.createTrueColor)
const sprintf = require('sprintf-js').sprintf
//const util = require('util')
//const createImageAsync = util.promisify(gd.createTrueColor)
const aspects = require('./aspects.js')
const mathutils = require('./mathutils.js')

const PLANET_FONT_SCALE_RATIO = 1.4
const ROMAN_NUMBERS = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii']
const ZODIAC_SYMBOLS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l']
const ZODIAC_SYMBOLS_REG = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'v', 'x', 'c']
const ASC_SYMBOL = 'Z'
const MC_SYMBOL = 'X'
const RETRO_SYMBOL = '>'
const TRIPL_COLORS = [0xDC143C, 0x8B4513, 0x3691b0, 0x191970]

const INFLUENCE_COLORS = {
  Negative: 0x00008B, // DarkBlue
  Positive: 0xDC143C, // Crimson
  Neutral: 0x20B2AA // LightSeaGreen
}

const PLANET_SYMBOLS = {
    Moon: 'W',
    Sun: 'Q',
    Mercury: 'E',
    Venus: 'R',
    Mars: 'T',
    Jupiter: 'Y',
    Saturn: 'U',
    Uranus: 'I',
    Neptune: 'O',
    Pluto: 'P',
    Node: '{'
}
const ORDINALS = {
    Moon : 0,
    Sun : 1,
    Mercury: 2,
    Venus: 3,
    Mars: 4,
    Jupiter: 5,
    Saturn: 6,
    Uranus: 7,
    Neptune: 8,
    Pluto: 9,
    Node: 10
}

const ASPECT_SYMBOLS = {
    cnj: 'q',
    sxt: 't',
    sqr: 'r',
    tri: 'e',
    opp: 'w',
    qcx: 'o',
    ssx: 'i',
    ssq: 'y',
    sqq: 'u'
}

const STANDARD_WHEEL = Symbol.for('Standard')
const CLASSIC_WHEEL = Symbol.for('Classic')
const FONTS_PATH = `${__dirname}/../fonts`
const DEFAULT_OPTIONS = {
    size: [1000, 1000],
    style: Symbol.for("Standard"),
    aspectFlags: aspects.MAJOR,
}

// Provides essential data for wheel painting
class WheelModel {
    constructor(chart, aspectFlags=aspects.MAJOR) {
        this._chart = chart
        this._aspectFlags = aspectFlags
        this._planetGroups = null
    }

    get chart() {
        return this._chart
    }

    get planetGroups() {
        if (this._planetGroups === null) {
            const positions = new Array()
            Object.keys(this._chart.planets).forEach( key => {
                const val = this._chart.planets[key]
                positions.push({name: key, x: mathutils.degrees(val.coords.x)})
            });
            this._planetGroups = new Array()
            for(const group of aspects.iterStelliums(positions)) {
                this._planetGroups.push(group)
            }
        }
        return this._planetGroups
    }

    get aspectFlags() {
        return this._aspectFlags
    }

    set aspectFlags(f) {
        this._aspectFlags = f
    }

    get firstCusp() {
        return this.chart.cusps[0]
    }
}

// Wraps GD image, adding some usefull drawing and utility functions.
class Paper {
    constructor(image, bgColor=gd.trueColorAlpha(255, 255, 255, 127)) {
        this._image = image
        this._center = {x: image.width / 2, y: image.height / 2}
        this._fonts = {
            zodiac: resolve(`${FONTS_PATH}/ZodiacS.ttf`),
            planets: resolve(`${FONTS_PATH}/HamburgSymbols.ttf`),
            regular: resolve(`${FONTS_PATH}/RobotoCondensed-Regular.ttf`),
            bold: resolve(`${FONTS_PATH}/RobotoCondensed-Bold.ttf`)
        }
        this._bgColor = bgColor
    }

    get image() {
        return this._image
    }

    get bgColor() {
        return this._bgColor
    }

    get center() {
        return this._center
    }

    get width() {
        return this._image.width
    }

    get height() {
        return this._image.height
    }

    font(key) {
        if (key in this._fonts) {
            return this._fonts[key]
        }
        throw new TypeError(`Unknown font: ${key}`)
    }

    clear() {
        this._image.fill(0, 0, this.bgColor)
        this._image.alphaBlending(1)
    }

    pol2rect(a, r) {
        return {
            x: Math.trunc(this._center.x + Math.cos(a) * r),
            y: Math.trunc(this._center.y + Math.sin(a) * r)
        }
    }

    drawCircle(radius, attributes={}) {
        const d = radius * 2
        const {x, y} = this.center
        if (attributes.fill) {
            this._image.filledEllipse(x, y, d, d, attributes.fill)
        }
        if (attributes.stroke) {
            this._image.setAntiAliased(attributes.stroke)
            if (attributes.thickness) {
                this._image.setThickness(attributes.thickness)
            }
            this._image.ellipse(x, y, d, d, attributes.stroke)
            //this._image.ellipse(x, y, d, d, 0x000000)
            // TODO: restore thickness
        }
    }

    drawLine(p1, p2, color, attributes={}) {
        if (attributes.thickness) {
            this._image.setThickness(attributes.thickness)
        }
        this._image.setAntiAliased(color)
        if (attributes.dashed) {
            this._image.dashedLine(p1.x, p1.y, p2.x, p2.y, color)
        } else {
            this._image.line(p1.x, p1.y, p2.x, p2.y, color)
        }

    }

    drawRay(a, r1, r2, color, attributes={}) {
        this.drawLine(this.pol2rect(a, r1), this.pol2rect(a, r2), color, attributes)
    }

    drawText(pt, txt, font, size, color, angle=0) {
        let {x, y} = pt
        const box = this._image.stringFTBBox(color, font, size, angle, x, y, txt )
        const w = Math.abs( box[4] - box[6] )
        const h = Math.abs( box[1] - box[7] )
        x -= Math.trunc(w / 2)
        y += Math.trunc(h / 2)
        return this._image.stringFT(color, font, size, angle, x, y, txt)
    }

}


class Wheel {
    // Constructor.
    //
    // model - WheelModel instance
    // paper - Paper instance
    constructor(model, paper) {
        this._model = model
        this._paper = paper
        if (this.paint === undefined) {
            throw new TypeError('Must override paint() method')
        }
    }

    get paper() {
        return this._paper
    }

    get model() {
        return this._model
    }

    // Convert ecliptic longitude a (radians)
    // to screen angle at circle, which center is in the middle of the image
    zodiacToScreenAngle(lambda) {
        return mathutils.reduceRad(mathutils.PI2 - (lambda - Math.PI - this._model.firstCusp))
    }

    // Convert ecliptic longitude x (in radians) at radius r
    // to screen point {x, y}
    lonToPoint(x, r) {
        return this.paper.pol2rect(this.zodiacToScreenAngle(x), r)
    }

    // Draw ray at ecliptic longitude lambda (in radians),
    // connecting r1 and r2 radii
    drawRay(lambda, r1, r2, color) {
        this.paper.drawRay(this.zodiacToScreenAngle(lambda), r1, r2, color)
    }
}



class StandardWheel extends Wheel {

    constructor(model, paper) {
        super(model, paper)
        const circlePercents = [98, 85, 72, 40, 8]
        const sz = Math.min(this.paper.width, this.paper.height)
        //this._R = circlePercents.map( p => { return sz * p / 50 } )
        this._R = circlePercents.map( p => {
            return Math.trunc(sz * p / 100 / 2)
        })
    }

    _drawHouses() {
        const r = this._R[0] - (this._R[0] - this._R[1]) / 4
        const fs = (this._R[2] - this._R[3]) / 6 * PLANET_FONT_SCALE_RATIO
        const cusps = this.model.chart.cusps
        const labelOffset = mathutils.radians(-5)
        const rNumber = this._R[0] - (this._R[0] - this._R[1]) / 4 - 12
        const angLblColor = gd.trueColorAlpha(0, 0, 0, 20)
        const plaFont = this._paper.font('planets')
        const regFont = this._paper.font('regular')
        const cuspColor = gd.trueColorAlpha(115, 115, 115, 0)
        const angleColor = gd.trueColorAlpha(102, 102, 102, 0)
        for (let i = 0; i < 12; i++) {
            const isAngular = i % 3 === 0
            const x = cusps[i]
            if (i == 0 || i == 9) {
                const lbl = i == 0 ? ASC_SYMBOL : MC_SYMBOL
                const pt = this.lonToPoint(mathutils.reduceRad(x + labelOffset), rNumber)
                this._paper.drawText(pt, lbl, plaFont, Math.trunc(fs*0.9), angLblColor)
            } else {
                const pt = this.lonToPoint(x + mathutils.radians(3), rNumber)
                this._paper.drawText(pt, ROMAN_NUMBERS[i], regFont, Math.trunc(fs*0.4), angLblColor)
            }
            this._paper.drawLine(
                this.lonToPoint(x, r),
                this.lonToPoint(x, this._R[3]),
                isAngular ? angleColor : cuspColor,
                { thickness: isAngular ? 4 : 1}
            )
        }
    }

    _drawZodiacScale(startLon, r1, r2) {
        const v = r1 - r2
        const rDec = [r1, r2] // for decans
        const rDeg = [r1, Math.trunc(r2 + v / 2)] // for degrees

        for (let i = 0; i < 30; i++) {
            const r = i % 10 == 0 ? rDec : rDeg
            this.drawRay(
                mathutils.radians(startLon + i), r[0], r[1],
                gd.trueColorAlpha(0, 0, 0, 20),
                { 'thickness': 1 }
            )
        }
    }


    _drawZodiac() {
        const v = this._R[1] - this._R[2]
        const hScale = Math.trunc(v / 4)
        const rInner = this._R[2] + hScale
        const rSymb = rInner + (this._R[1] - rInner) / 2 // for zodiac symbol
        this._paper.drawCircle(this._R[1], {
            thickness: 3,
            stroke: gd.trueColorAlpha(10, 10, 10, 50)
        })
        const r15 = mathutils.radians(15)
        const sz = Math.trunc((this._R[1] - rInner) * 0.6)
        const zodiacFont = this._paper.font('zodiac')

        for(let i = 0; i < 12; i++) {
            const deg = i * 30
            const ang = mathutils.radians(deg)
            this.drawRay(
                ang, this._R[1], this._R[2],
                gd.trueColorAlpha(10, 10, 10, 50),
                { 'thickness': 2 }
            )
            this._drawZodiacScale(deg, rInner, this._R[2])
            const a = this.zodiacToScreenAngle(ang + r15)
            const pt = this._paper.pol2rect(a, rSymb)
            const tripl = i % 4
            this._paper.drawText(pt, ZODIAC_SYMBOLS[i], zodiacFont, sz, TRIPL_COLORS[tripl])
        }
    }


    _drawPlanet(pos, displayedLambda, r, planetFont, fontHeight) {
        const lambda = mathutils.radians(displayedLambda)
        const a = this.zodiacToScreenAngle(lambda)
        const regFont = this.paper.font('regular')
        const textColor = gd.trueColorAlpha(10, 10, 10, 20)
        const h1 = Math.trunc(fontHeight*0.9)
        const h2 = Math.trunc(fontHeight*0.4)

        this._paper.drawText(
            this._paper.pol2rect(a, r[0]),
            PLANET_SYMBOLS[pos.name],
            planetFont,
            h1,
            textColor
        )
        const [z, d, m] = mathutils.zdms(pos.x)

        // degrees
        this._paper.drawText(
            this._paper.pol2rect(a, r[1]),
            sprintf('%02d', d),
            regFont,
            h2,
            textColor)
        // zodiac sign
        this._paper.drawText(
            this._paper.pol2rect(a, r[2]),
            ZODIAC_SYMBOLS_REG[z],
            planetFont,
            h2,
            textColor)
        // minutes
        this._paper.drawText(
            this._paper.pol2rect(a, r[3]),
            sprintf('%02d', m),
            regFont,
            h2,
            textColor)

        const motion = this.model.chart.planets[pos.name].motion
        if (motion < 0) {
            this._paper.drawText(
                this._paper.pol2rect(a, r[4]),
                RETRO_SYMBOL,
                planetFont,
                h2,
                textColor)
        }
    }

    _distributePlanets(group, r, w) {
        const sz = group.length
        const startLon = group[0].x
        const res = new Array()
        if (sz < 2) {
            res.push(startLon)
            return res
        }

        const c = 2 * Math.PI * r // circle length
        const d = 360 * w / c // degrees per symbol width
        const ms = d * sz // min. size of displayed span, degrees
        // size of real span, degrees
        const rs = mathutils.diffAngleDeg(startLon, group[sz-1].x)
        const span = Math.max(ms, rs)
        // start of displayed span
        const spanStart = mathutils.reduceDeg(startLon + rs / 2) - span / 2
        const cut = span / sz
        //const dh = cut / 2
        for(let i = 0; i < sz; i++) {
            res.push(spanStart + i * cut)
        }
        return res

    }

    _drawAspect(pos, asp) {
        const pt0 = this.lonToPoint(mathutils.radians(pos.x), this._R[3])
        const pt1 = this.lonToPoint(this.model.chart.planets[asp.target].coords.x, this._R[3])

        const attr = {}
        switch(asp.aspect.typeFlag) {
            case aspects.MAJOR:
                attr.thickness = 2
                break
            case aspects.MINOR:
                attr.dashed = true
                attr.thickness = 1
                break
            case aspects.KEPLER:
                attr.thickness = 1
        }
        this._paper.drawLine(pt0, pt1, INFLUENCE_COLORS[asp.aspect.influence], attr)
    }

    _drawPlanets() {
        const scaleH = (this._R[1] - this._R[2]) / 10
        const rMark = Math.trunc(this._R[2] - scaleH)
        const rOut = Math.trunc(this._R[2] - scaleH)
        const rInn = Math.trunc(this._R[3] + scaleH)
        const v = rOut - rInn
        const textHeight = Math.trunc(v / 5 * PLANET_FONT_SCALE_RATIO)
        const plaFont = this.paper.font('planets')

        const r = [
            Math.trunc(rOut - textHeight / 2),
            0,
            0,
            0,
            0
        ]
        let h = Math.trunc((Math.trunc(rInn + textHeight / 2) - r[0]) / 4)
        r[1] = Math.trunc(r[0] + h + h / 2)
        r[2] = r[1] + h
        r[3] = r[2] + h
        r[4] = r[3] + h

        // ---- For debugging
        // for(let radius of r) {
        //     this._paper.drawCircle(radius, {
        //         stroke: gd.trueColorAlpha(38, 115, 38, 0),
        //     })
        // }

        const lastAspectIdx = ORDINALS['Pluto']
        const chartPlanets = this.model.chart.planets
        for (let st of this.model.planetGroups) {
            const fakeX = this._distributePlanets(st, r[0], textHeight)
            for(let i = 0; i < st.length; i++) {
                const pos = st[i]
                this._drawPlanet(pos, fakeX[i], r, plaFont, textHeight)
                // mark
                this.drawRay(
                    mathutils.radians(pos.x), rMark, this._R[2],
                    gd.trueColorAlpha(10, 10, 10, 20),
                    { 'thickness': 3 }
                )
                // aspects
                const sourceIdx = ORDINALS[pos.name]
                const aspects = chartPlanets[pos.name].aspects
                //console.log('aspects: %s', JSON.stringify(aspects, null, 2))
                for(let asp of aspects) {
                    const targetIdx = ORDINALS[asp.target]
                    if (sourceIdx < targetIdx
                    &&  asp.aspect.value !== 0
                    &&  this.model.aspectFlags & asp.aspect.typeFlag
                    &&  sourceIdx <= lastAspectIdx
                    &&  targetIdx <= lastAspectIdx)
                    {
                        this._drawAspect(pos, asp)
                    }
                }
            }
        }
    }


    paint() {
        //this._paper.image.alphaBlending(1)
        this._paper.clear()
        this._paper.drawCircle(this._R[1], {
            thickness: 4,
            stroke: gd.trueColorAlpha(0, 0, 0, 80),
            fill: gd.trueColorAlpha(255, 245, 230, 20)
        })
        this._paper.drawCircle(this._R[2], {
            fill: gd.trueColorAlpha(255, 255, 255, 63)
        })
        this._drawHouses()
        this._paper.drawCircle(this._R[3], {
            thickness: 4,
            stroke: gd.trueColorAlpha(0, 0, 0, 80),
            fill: gd.trueColorAlpha(255, 255, 255, 20)
        })
        this._drawZodiac()
        this._drawPlanets()
    }
}


class ClassicWheel extends Wheel {
    paint() {
        console.debug('Painting Classic Wheel...')
        this.paper.clear()
    }
}

function processOptions(options) {
    if (!options) {
        options = {}
    }
    if (!options.size) {
        options.size = DEFAULT_OPTIONS.size
    }
    if (!options.aspectFlags) {
        options.aspectFlags = DEFAULT_OPTIONS.aspectFlags
    }
    if (!options.style) {
        options.style = DEFAULT_OPTIONS.style
    }
    return options
}


const self = module.exports = {
    ZODIAC_SYMBOLS_REG,
    PLANET_SYMBOLS,
    INFLUENCE_COLORS,
    ORDINALS,
    ASPECT_SYMBOLS,

    WheelModel,
    Paper,

    // Factory function for wheel class
    createWheel(model, paper, style=Symbol.for("Standard")) {
        switch (style) {
            case STANDARD_WHEEL:
                return new StandardWheel(model, paper)
            case CLASSIC_WHEEL:
                return new ClassicWheel(model, paper)
            default:
                throw new Error(`Unknown wheel style: ${style}`)
        }
    },

    // size=[1000, 1000], style=Symbol.for("Standard"), aspectFlags=aspects.MAJOR
    // Handy high-level function for drawing a chart asynchroneously and saving result
    // to a temporary file.

    paintAndSaveWheel(chart, options) {
        const opts = processOptions(options)
        const [w, h] = opts.size

        return new Promise((resolve, reject) => {
            createTrueColor(w, h).then(img => {
                try {
                    const model = new WheelModel(chart, opts.aspectFlags)
                    const paper = new Paper(img)
                    const wheel = self.createWheel(model, paper, opts.style)
                    wheel.paint()
                    tmpName({ template: `${tempDir}/XXXXXXX.png` }).then(fileName => {
                        img.savePng(fileName, 0, err => {
                            if (err) {
                                reject(err)
                            } else {
                                resolve(fileName)
                            }
                            img.destroy()
                        })
                    })
                } catch (err) {
                    img.destroy()
                    reject(err)
                }
            }).catch( err => {
                reject(err)
            })
        })
    }
}
