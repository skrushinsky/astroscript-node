'use strict';

const assert = require('chai').assert;
const {
    MAJOR,
    iterAspects,
    Dariot,
    DeVore,
    ClassicWithAspectRatio,
    iterStelliums
} = require('../src/aspects.js');
const {
    PLANETS
} = require('../src/ephemeris.js');

const planets = [{
    name: 'Moon',
    x: 310.211118039121
},
{
    name: 'Sun',
    x: 312.430798112358
},
{

    name: 'Mercury',
    x: 297.078430402921
},
{
    name: 'Venus',
    x: 295.209360003483
},
{
    name: 'Mars',
    x: 177.966202541024
},
{
    name: 'Jupiter',
    x: 46.9290328362618
},
{
    name: 'Saturn',
    x: 334.601965217279
},
{
    name: 'Uranus',
    x: 164.031950787664
},
{
    name: 'Neptune',
    x: 229.922411342362
},
{
    name: 'Pluto',
    x: 165.825418322174
}];

describe('Aspects', () => {
    const orbsMethods = [{
        method: new Dariot(),
        count: {
            Moon: 2,
            Sun: 3,
            Mercury: 2,
            Venus: 3,
            Mars: 2,
            Jupiter: 5,
            Saturn: 0,
            Uranus: 3,
            Neptune: 5,
            Pluto: 3
        }
    },
    {
        method: new DeVore(),
        count: {
            Moon: 1,
            Sun: 2,
            Mercury: 2,
            Venus: 2,
            Mars: 2,
            Jupiter: 4,
            Saturn: 0,
            Uranus: 2,
            Neptune: 1,
            Pluto: 2
        }
    },
    {
        method: new ClassicWithAspectRatio(),
        count: {
            Moon: 2,
            Sun: 3,
            Mercury: 2,
            Venus: 3,
            Mars: 2,
            Jupiter: 5,
            Saturn: 0,
            Uranus: 3,
            Neptune: 5,
            Pluto: 3
        }
    }];

    for (let plaName of PLANETS.slice(0, 9)) {
        const source = planets.filter(p => p.name === plaName)[0];
        const targets = planets.filter(p => p.name !== plaName);
        for (let arg of orbsMethods) {
            const {
                method,
                count
            } = arg;
            it(`${plaName} major Aspects with ${method.name} orbs method`, () => {
                let plaAspects = new Array();
                for (const data of iterAspects(source, targets, method, MAJOR)) {
                    plaAspects.push(data);
                }
                assert.equal(plaAspects.length, count[plaName]);
            });
        }
    }
});

describe('Stelliums', () => {

    it('Default gap', () => {
        const res = new Array();
        for (const group of iterStelliums(planets)) {
            res.push(group);
        }
        assert.equal(res.length, 7);
    });

    it('Large gap', () => {
        const res = new Array();
        for (const group of iterStelliums(planets, 15)) {
            res.push(group);
        }
        assert.equal(res.length, 5);
    });

    it('Zero gap', () => {
        const res = new Array();
        for (const group of iterStelliums(planets, 0)) {
            res.push(group);
        }
        assert.equal(res.length, planets.length);
    });

});