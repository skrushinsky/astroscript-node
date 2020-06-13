'use strict';
/************************************************************************************
Year related routines

 (с) Sergey Krushinsky, 2019

************************************************************************************/

const self = module.exports = {
    isLeapYear: function(ye) {
        return ( ye % 4 == 0 ) && ( ( ye % 100 != 0 ) || ( ye % 400 == 0 ) );
    },
    dayOfYear: function(ye, mo, da) {
        const k = self.isLeapYear(ye) ? 1 : 2;
        return Math.floor(275 * mo / 9) - (k * Math.floor((mo + 9) / 12.0)) + Math.floor(da) - 30;
    }
};
