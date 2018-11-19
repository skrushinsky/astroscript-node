'use strict';

/************************************************************************************
Main module
This module wrapps functions exported by other modules.
(с) Sergey Krushinsky, 2018

************************************************************************************/

const aspects = require('./aspects.js')
const chart = require('./chart.js')
const coco = require('./coco.js')
const ephemeris = require('./ephemeris.js')
const houses = require('./houses.js')
const mathutils = require('./mathutils.js')
const points = require('./points.js')
const timeutils = require('./timeutils.js')
const graphics = require('./graphics.js')

module.exports = {
    aspects,
    chart,
    coco,
    ephemeris,
    houses,
    mathutils,
    points,
    timeutils,
    graphics
}