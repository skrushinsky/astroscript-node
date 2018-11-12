'use strict'
/************************************************************************************
 Chart wheel.

 (с) Sergey Krushinsky, 2018

************************************************************************************/
const resolve = require('path').resolve
const convert = require('simple-hex-to-rgb')
const gd = require('node-gd')
const sprintf = require('sprintf-js').sprintf
const {aspects, mathutils} = require('astroscript')
const {PI2, degrees, radians, reduceRad, reduceDeg, diffAngleDeg, zdms} = mathutils

const STANDARD_WHEEL = Symbol.for('Standard')
const CLASSIC_WHEEL = Symbol.for('Classic')

const PLANET_FONT_SCALE_RATIO = 1.4
const ROMAN_NUMBERS = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii']
const ZODIAC_SYMBOLS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l']
const ZODIAC_SYMBOLS_REG = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'v', 'x', 'c']
const ASC_SYMBOL = 'Z'
const MC_SYMBOL = 'X'
const RETRO_SYMBOL = '>'
const TRIPL_COLORS = ["#DC143C", "#8B4513", "#ADD8E6", "#191970"]
const TRIPL_OPACITIES = [0.7, 0.7, 1, 0.7]

const INFLUENCE_COLORS = {
  Negative: '#00008B', // DarkBlue
  Positive: '#DC143C', // Crimson
  Neutral: '#20B2AA' // LightSeaGreen
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

const FONT_PATH = '../fonts'

class Painter {
    constructor(wheel, paper) {
        this.wheel = wheel
        //this.paper = gd.createTrueColor(width, height)
        //this.paper.saveAlpha(1)

        this.cx = this.paper.width / 2
        this.cy = this.paper.height / 2
        this.zodiacFont = resolve(`${FONTS_PATH}/ZodiacS.ttf`)
        this.planetsFont = resolve(`${FONTS_PATH}/HamburgSymbols.ttf`)
        this.regFont = resolve(`${FONTS_PATH}/Roboto-Regular.ttf`)
        this.boldFont = resolve(`${FONTS_PATH}/Roboto-Bold.ttf`)

        if (this.paint === undefined) {
            // or maybe test typeof this.method === 'function'
            throw new TypeError('Must override paint() method')
        }
    }

    pol2rect(a, r) {
        return {
            x: this.cx + Math.cos(a) * r,
            y: this.cy + Math.sin(a) * r
        }
    }

    // withForeground(color, func, args) {
    //     const rgb = convert(color)
    //     return function() {
    //         const fg = this.paper.colorAllocate(rgb)
    //         this.paper.setAntiAliased(fg)
    //         const res = func.apply(fg, args)
    //         this.paper.colorDeallocate(fg)
    //         return res
    //     }
    // }

    clear() {
        console.debug('Clearing...')
        img.alphaBlending(0)
        const color = gd.trueColorAlpha(255, 255, 255, 127)
        this.paper.filledRectangle(0, 0, this.paper.width, this.paper.height, color)
    }

    zodiacToScreenAngle(a) {
        const firstCusp = this.wheel.chart.cusps[0]
        return reduceRad(PI2 - (a - Math.PI - firstCusp))
    }

    lonToPoint(x, r) {
        return this.pol2rect(this.zodiacToScreenAngle(x), r)
    }

    drawCircle(radius, attributes={}) {
        const d = radius * 2
        if (attributes.fill) {
            this.paper.filledEllipse(this.cx, this.cy, d, d, attributes.fill)
        }
        if (attributes.stroke) {
            this.paper.ellipse(this.cx, this.cy, d, d, attributes.stroke)
        }
    }

    drawLine(p1, p2, color) {
        this.paper.line(p1.x, p1.y, p2.x, p2.y, color)
        //this.paper.path( ['M', p1.x, p1.y, 'L', p2.x, p2.y ] ).attr(attributes)
    }

    drawRay(x, r1, r2, attributes={}) {
        const a = this.zodiacToScreenAngle(x)
        this.drawLine(this.pol2rect(a, r1), this.pol2rect(a, r2), attributes)
    }


//   drawSymbol(font, angle, radius, s, size, color, strAngle=0) {
//
//         let {x, y}  = this.pol2rec( radius, angle )
//         const b = this.withForeground(
//             color,
//             () => { return this.paper.stringFTBBox( font, size, strAngle, x, y, s ) }
//         )
//
//         const w = Math.abs( b[4] - b[6] )
//         const h = Math.abs( b[1] - b[7] )
//         x -= w / 2
//         y += h / 2
//         this.withForeground(
//             color,
//             () => { return this.paper.stringFT( font, size, strAngle, x, y, s ) }
//         )
//     }

    drawText(pt, txt, font, size, color) {
        let {x, y} = pt
        const box = this.paper.stringFTBBox(color, font, size, 0, x, y, txt )
        const w = Math.abs( box[4] - box[6] )
        const h = Math.abs( box[1] - box[7] )
        x -= w / 2
        y += h / 2
        return this.paper.stringFT( font, size, strAngle, x, y, s )
    }

}


class StandardPainter extends Painter {

    constructor(wheel, paper) {
        super(wheel, paper)
        this.circlePercents = [98, 85, 72, 40, 8]
        const sz = Math.min(this.paper.width, this.paper.height)
        this.R = this.circlePercents.map( p => {
            return sz * p / 100 / 2
        })
        //console.log('cusps: %s', JSON.stringify(this.wheel.chart.cusps))
    }

    drawAngleLabel(x, lbl, offset, r, sz, color) {
        const pt = this.lonToPoint(reduceRad(x + offset), r)
        this.drawText(pt, lbl, this.planetsFont, sz, color)
    }

    drawCuspNumber(i, x, r, sz, color) {
        const pt = this.lonToPoint(x + radians(3), r)
        this.drawText(pt, ROMAN_NUMBERS[i], this.regFont, sz, color)
    }

    drawHouses() {
        console.debug('Drawing houses...')
        const r = this.R[0] - (this.R[0] - this.R[1]) / 4
        const fs = (this.R[2] - this.R[3]) / 6 * PLANET_FONT_SCALE_RATIO
        const cusps = this.wheel.chart.cusps
        const labelOffset = radians(-5)
        const rNumber = this.R[0] - (this.R[0] - this.R[1]) / 4 - 12
        const angLblColor = this.paper.colorAllocate([0, 0, 0, 80])

        for (let i = 0; i < 12; i++) {
            const isAngular = i % 3 == 0
            const x = cusps[i]
            const attrs = {
                'stroke-width': isAngular ? 3 : 2,
                'stroke': '#000000',
                'stroke-opacity': isAngular ? 0.4 : 0.2,
                'fill': '#000000',
                'fill-opacity': isAngular ? 0.4 : 0.2
            }
            if (i == 0 || i == 9) {
                attrs['arrow-start'] = 'block-midium'
                this.drawAngleLabel(x, i == 0 ? ASC_SYMBOL : MC_SYMBOL, labelOffset, rNumber, fs*0.9, angLblColor)
            } else {
                this.drawCuspNumber(i, x, rNumber, fs*0.4)
            }
            this.drawLine(this.lonToPoint(x, r), this.lonToPoint(x, this.R[3]), attrs)
        }

        this.paper.colorDeallocate(angLblColor)
    }


    drawZodiacScale(startLon, r1, r2) {
        const v = r1 - r2
        const rDec = [r1, r2] // for decans
        const rDeg = [r1, r2 + v / 2] // for degrees

        for (let i = 0; i < 30; i++) {
            const r = i % 10 == 0 ? rDec : rDeg
            this.drawRay(radians(startLon + i), r[0], r[1], {
                'stroke-width': 1,
                'stroke': '#000000',
                'stroke-opacity': 0.7
            })
        }
    }

    drawZodiac() {
        console.debug('Drawing zodiac...')
        const v = this.R[1] - this.R[2]
        const hScale = v / 4
        const rInner = this.R[2] + hScale
        const rSymb = rInner + (this.R[1] - rInner) / 2 // for zodiac symbol
        this.drawCircle(rInner, {
            'stroke': 'rgb(0.1, 0.1, 0.1)',
            'stroke-opacity': 0.2,
            'stroke-width': 2
        })
        const r15 = radians(15)
        const sz = (this.R[1] - rInner) * 0.6

        for(let i=0; i < 12; i++) {
            const deg = i * 30
            const ang = radians(deg)
            this.drawRay(ang, this.R[1], this.R[2], {
                'stroke-width': 2,
                'stroke': '#000000',
                'stroke-opacity': 0.2,
                'fill': '#FFFFFF',
                'fill-opacity': 0.9
            })
            this.drawZodiacScale(deg, rInner, this.R[2])
            const a = this.zodiacToScreenAngle(ang + r15)
            const pt = this.pol2rect(a, rSymb)
            const tripl = i % 4
            this.drawText(pt, ZODIAC_SYMBOLS[i], this.zodiacFont, sz).attr({
                'stroke-width': 1,
                'fill': TRIPL_COLORS[tripl],
                'fill-opacity': TRIPL_OPACITIES[tripl]
            })
        }
    }



    distributePlanets(stellium, r, w) {
        const sz = stellium.length
        const startLon = stellium[0].x
        const res = new Array()
        if (sz < 2) {
            res.push(startLon)
            return res
        }

        const c = 2 * Math.PI * r // circle length
        const d = 360 * w / c // degrees per symbol width
        const ms = d * sz // min. size of displayed span, degrees
        // size of real span, degrees
        const rs = diffAngleDeg(startLon, stellium[sz-1].x)
        const span = Math.max(ms, rs)
        // start of displayed span
        const spanStart = reduceDeg(startLon + rs / 2) - span / 2
        const cut = span / sz
        //const dh = cut / 2
        for(let i = 0; i < sz; i++) {
            res.push(spanStart + i * cut)
        }
        return res

    }


    drawPlanet(pos, displayedLambda, r, fontHeight) {
        const lambda = radians(displayedLambda)
        const a = this.zodiacToScreenAngle(lambda)

        const txtAttr = {
            'fill': '#000000',
            'fill-opacity': 0.8
        }
        this.drawText(
            this.pol2rect(a, r[0]),
            PLANET_SYMBOLS[pos.name],
            this.planetsFont,
            fontHeight).attr(txtAttr)
        const [z, d, m] = zdms(pos.x)
        // degrees
        this.drawText(
            this.pol2rect(a, r[1]),
            sprintf('%02d', d),
            this.regFont,
            fontHeight*0.5).attr(txtAttr)
        // zodiac sign
        this.drawText(
            this.pol2rect(a, r[2]),
            ZODIAC_SYMBOLS_REG[z],
            this.planetsFont,
            fontHeight*0.6).attr(txtAttr)
        // minutes
        this.drawText(
            this.pol2rect(a, r[3]),
            sprintf('%02d', m),
            this.regFont,
            fontHeight*0.5).attr(txtAttr)

        const motion = this.wheel.chart.planets[pos.name].motion
        if (motion < 0) {
            this.drawText(
                this.pol2rect(a, r[4]),
                RETRO_SYMBOL,
                this.planetsFont,
                fontHeight*0.6).attr(txtAttr)
        }
    }

    drawAspect(pos, asp) {
        const pt0 = this.lonToPoint(radians(pos.x), this.R[3])
        const pt1 = this.lonToPoint(this.wheel.chart.planets[asp.target].coords.x, this.R[3])
        const color = INFLUENCE_COLORS[asp.aspect.influence]

        let pattern
        let width
        switch(asp.aspect.typeFlag) {
            case aspects.MAJOR:
                pattern = ''
                width = 2
                break
            case aspects.MINOR:
                pattern = '--'
                width = 1
                break
            case aspects.KEPLER:
                pattern = '. '
                width = 1
        }
        this.drawLine(pt0, pt1, {
            'stroke': color,
            'stroke-opacity': 0.5,
            'stroke-width': width,
            'stroke-dasharray': pattern
        })
    }

    drawPlanets() {
        console.debug('Drawing planets...')
        const scaleH = (this.R[1] - this.R[2]) / 10
        const rMark = this.R[2] - scaleH
        const rOut = this.R[2] - scaleH
        const rInn = this.R[3] + scaleH
        const v = rOut - rInn
        const textHeight = v / 5 * PLANET_FONT_SCALE_RATIO

        const r = [rOut - textHeight / 2]
        const coeffs = [0.7, 0.6, 0.5, 0.6];
        for(let i = 0; i < coeffs.length; i++) {
            r.push(r[i] - textHeight * coeffs[i])
        }

        // Measure width of Mars symbol, which is the widest.
        var txt = this.paper.text(-100, -100, "T", this.planetsFont, textHeight)
        const textWidth = txt.getBBox().width * 3.0
        const lastAspectIdx = ORDINALS['Pluto']

        for (let st of this.wheel.stelliums) {
            const fakeX = this.distributePlanets(st, r[0], textWidth)
            for(let i = 0; i < st.length; i++) {
                const pos = st[i]
                this.drawPlanet(pos, fakeX[i], r, textHeight)
                // mark
                this.drawRay(radians(pos.x), rMark, this.R[2], {
                    'stroke-width': 3,
                    'stroke': '#000000',
                    'stroke-opacity': 0.9
                })
                // aspects
                const sourceIdx = ORDINALS[pos.name]
                const aspects = this.wheel.chart.planets[pos.name].aspects
                //console.log('aspects: %s', JSON.stringify(aspects, null, 2))
                for(let asp of aspects) {
                    const targetIdx = ORDINALS[asp.target]
                    if (sourceIdx < targetIdx
                    &&  asp.aspect.value !== 0
                    &&  this.wheel.aspectFlags & asp.aspect.typeFlag
                    &&  sourceIdx <= lastAspectIdx
                    &&  targetIdx <= lastAspectIdx)
                    {
                        this.drawAspect(pos, asp)
                    }

                }

            }

        }

    }

    paint() {
        console.debug('Painting Standard Wheel...')
        this.clear()
        this.drawCircle(this.R[1], {
            'stroke-width': 4,
            'stroke': '#000000',
            'fill': '#FFF5E6',
            'stroke-opacity': 0.1,
            'fill-opacity': 0.9
        })
        this.drawCircle(this.R[2], {
            'fill-opacity': 0,
            'stroke': 'rgb(0.1, 0.1, 0.1)',
            'stroke-opacity': 0.2,
            'stroke-width': 2
        })
        this.drawHouses()
        this.drawCircle(this.R[3], {
            'stroke-width': 4,
            'stroke': '#000000',
            'fill': '#FFFFFF',
            'stroke-opacity': 0.1,
            'fill-opacity': 0.9
        })
        this.drawZodiac()
        this.drawPlanets()
    }
}

class ClassicPainter extends Painter {

    paint() {
        console.debug('Painting Classic Wheel...')
        this.clear()
    }
}


module.exports = {
    ZODIAC_SYMBOLS_REG,
    PLANET_SYMBOLS,
    INFLUENCE_COLORS,
    ORDINALS,
    ASPECT_SYMBOLS,

    createPainter(wheel, gd, style=Symbol.for("Standard")) {
        switch (style) {
            case STANDARD_WHEEL:
                return new StandardPainter(wheel, gd)
            case CLASSIC_WHEEL:
                return new ClassicPainter(wheel, gd)
            default:
                throw new Error(`Unknown wheel style: ${style}`)
        }
    },

    Wheel: class {
        constructor(chart, aspectFlags=aspects.MAJOR) {
            this._chart = chart
            this._stelliums = null
            this._aspectFlags = aspectFlags
        }

        get chart() {
            return this._chart
        }

        get stelliums() {
            if (this._stelliums === null) {
                const positions = new Array()
                Object.keys(this._chart.planets).forEach( key => {
                    const val = this._chart.planets[key]
                    positions.push({name: key, x: degrees(val.coords.x)})
                });
                this._stelliums = new Array()
                for(const group of aspects.iterStelliums(positions)) {
                    this._stelliums.push(group)
                }
            }
            return this._stelliums
        }

        get aspectFlags() {
            return this._aspectFlags
        }

        set aspectFlags(f) {
            console.log("Setting aspect flags: %d", f)
            this._aspectFlags = f
        }

    },



}