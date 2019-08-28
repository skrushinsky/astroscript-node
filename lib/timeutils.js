'use strict';

/************************************************************************************
Calendar and time routines.
This module wrapps functions defined in time subdirectory

(с) Sergey Krushinsky, 2017

************************************************************************************/

const julian = require('./time/julian.js');
const deltat = require('./time/deltat.js').deltaT;
const sidereal = require('./time/sidereal.js');

module.exports = {
    julDay(ye, mo, da) {
        return julian.julDay(ye, mo, da);
    },
    calDay(djd) {
        return julian.calDay(djd);
    },
    djdMidnight(djd) {
        return julian.djdMidnight(djd);
    },
    weekDay(djd) {
        return julian.weekDay(djd);
    },
    deltaT(djd) {
        return deltat(djd);
    },
    localSidereal(djd, lng = 0) {
        return sidereal.localSidereal(djd, lng);
    },
    siderealToUTC: function siderealToUTC(djd, lst, lng = 0) {
        return sidereal.siderealToUTC(djd, lst, lng);
    }
};