'use strict'

const fs = require('fs')
const path = require('path')
const gd = require('node-gd')
const assert = require('chai').assert
const { Paper, WheelModel, createWheel, paintWheel } = require('../src/graphics.js')
const { BaseChart } = require('../src/chart.js')

describe('Paper', _ => {

    let img, paper

    before( () => {
        img = gd.createTrueColorSync(100, 100)
        paper = new Paper(img)    
    })

    after( () => {
        img.destroy()
    })

    it('Constructor', () => {
        assert.isDefined(paper)
    })

    it('Center', () => {
        assert.deepEqual(paper.center, {x: 50, y: 50} );
    })

    it('Clearing', () => {
        paper.clear()
    }) 

    for( let k of ['zodiac', 'planets', 'regular', 'bold']) {
        it(`"${k}" font`, () => {
            assert.isNotNull(paper.font(k))
        })
    }
    
    it('pol2rect', () => {
        const coords = paper.pol2rect(0, 45)
        assert.deepEqual(coords, {x: 95, y: 50} );
    })     

})


describe('WheelModel', _ => {
    const chart = new BaseChart({date: new Date(1965, 1, 1, 14, 46, 0)})
    const model = new WheelModel(chart)

    it('Default aspect flags', () => {
        assert.equal(model.aspectFlags, 0x1)
    })

    it('Planet groups', () => {
        assert.equal(model.planetGroups.length, 8)
    })

    it('1-st cusp', () => {
        const x = model.firstCusp
        assert.approximately(model.firstCusp, 1.922656, 1E-4)
    })
})

describe('Wheel', _ => {
    const chart = new BaseChart({date: new Date(1965, 1, 1, 14, 46, 0)})
    const model = new WheelModel(chart)

    let img, paper, wheel
    before( () => {
        img = gd.createTrueColorSync(100, 100)
        paper = new Paper(img)    
        wheel = createWheel(model, paper)
    })

    after( () => {
        img.destroy()
    })    

    it('Factory function', () => {      
        assert.isDefined(wheel)
    })    

    it('zodiacToScreenAngle', () => {
        assert.approximately(5.06424, wheel.zodiacToScreenAngle(0), 1E-4)
    })

    it('lonToPoint X', () => {
        const point = wheel.lonToPoint(0, 100)
        assert.equal(84, point.x)
    })

    it('lonToPoint Y', () => {
        const point = wheel.lonToPoint(0, 100)
        assert.equal(-43, point.y)
    })     

})

describe('paintWheel', _ => {
    const chart = new BaseChart({date: new Date(1965, 1, 1, 14, 46, 0)})
    const imgFile = path.resolve('./wheel.png')

    // it('Callback', () => {      
    //     paintWheel(chart, (err, img) => {
    //         if (err) {
    //             assert.assert(false, err)
    //         } else {
    //             assert.isDefined(img)
    //         }
    //     })
    // })      

    it(`Saving image to ${imgFile}`, (done) => {      
        paintWheel(chart, (err0, img) => {     
            if (err0) {
                assert.isOk(false, err0)
                done()
            } else {
                img.savePng(imgFile, 0, (err1) => {
                    if (err1) {
                        assert.isOk(false, err1)
                    } else {
                        assert.isOk(fs.existsSync(imgFile), `file ${imgFile} not found`)
                    }
                    done()
                })
            }
        }, [1500, 1500])
    })       
})