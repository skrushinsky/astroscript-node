'use strict'

const assert = require('chai').assert;
const {
  BaseChart
} = require('../src/chart.js')
const {
  PLANETS, Ephemeris
} = require('../src/ephemeris.js')


describe('Base Chart', _ => {
  const chart = new BaseChart({
    date: new Date(1965, 1, 1, 14, 46, 0)
  })

  it(`DJD`, () => {
    assert.approximately(chart.djd, 23772.990277, 1E-6);
  })

  it(`DeltaT`, () => {
    assert.approximately(chart.deltaT, 35.8, 0.1);
  })

  it(`Sidereal Time`, () => {
    assert.approximately(chart.lst, 23.037266761536, 1E-4);
  })

  it('Ephemeris', () => {
    assert.instanceOf(chart.ephemeris, Ephemeris)
  })

  const exp_house = {
    'Moon': 7,
    'Sun': 7,
    'Mercury': 6,
    'Venus': 6,
    'Mars': 3,
    'Jupiter': 10,
    'Saturn': 8,
    'Uranus': 2,
    'Neptune': 4,
    'Pluto': 3,
    'Node': 11
  }

  for (let name of PLANETS) {
    const pla = chart.planets[name]
    it(`${name} data`, () => {
      assert.hasAllKeys(pla, ['coords', 'motion', 'house', 'aspects'])
      assert.hasAllKeys(pla.coords, ['x', 'y', 'z'])
    })

    it(`${name} house`, () => {
      assert.equal(pla.house, exp_house[name])
    })
  }

  it('Sensitive Points', () => {
    assert.hasAllKeys(chart.points, ['Ascendant', 'Midheaven', 'Vertex', 'EastPoint'])
  })

  it ('House cusps', () => {
    assert.equal(chart.cusps.length, 12)
  })


})