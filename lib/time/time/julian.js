'use strict';

/************************************************************************************
Calendar and time routines.

Library of date/time manipulation routines for practical astronomy. The main
purpose is to convert between civil dates and Julian dates. Julian date (JD)
is the number of days elapsed since mean UT noon of January 1st 4713 BC. This
system of time measurement is widely adopted by the astronomers.

For better precision around the XX century, we use
the epoch 1900 January 0.5 (1989 December 31.5) as the starting point. See
"Astronomy With Your Personal Computer", p.14. This kind of Julian date is
referred as 'DJD'. To convert DJD to JD, add DJD_TO_JD constant to DJD.

The module contains some other usefull calendar-related functions, such as weekDay.

Civil year vs astronomical year

There is disagreement between astronomers and historians about how to count the
years preceding the year 1. Astronomers generally use zero-based system. The
year before the year +1, is the year zero, and the year preceding the latter is
the year -1. The year which the historians call 585 B.C. is actually the year
-584.

In this module all subroutines accepting year (L<is_leap_year>, L<date2djd>)
assume that B<there is no year zero>. Conversion from the civil to the
astronomical time scale is done internally. Thus, the sequence of years is:
C<BC -3, -2, -1, 1, 2, 3, AD>.

Date and Time

Time is represented by fractional part of a day. For example, 7h30m UT
is C<(7 + 30 / 60) / 24 = 0.3125>.


Zero day

Zero day is a special case of date: it indicates 12h UT of previous calendar
date. For instance, 1900 January 0.5 is often used instead of
1899 December 31.5 to designate start of the astronomical epoch.



References

Peter Duffett-Smith, "Astronomy With Your Personal Computer", Cambridge University Press, 1995.
Jean Meeus, "Astronomical Algorithms", Willmann-Bell, Inc., 1991

Cambridge University Press, 1986.


(с) Sergey Krushinsky, 2017

************************************************************************************/

const mathutils = require('../mathutils.js');

const self = module.exports = {

    DJD_TO_JD: 2415020,
    DAYS_PER_CENT: 36525,
    MIN_YEAR: -4713,
    MAX_YEAR: 9999,
    SEC_PER_DAY: 86400, // seconds per day


    _after_gregorian: function (y, m, d) {
        if (y < 1582) return false;
        if (y > 1582) return true;
        if (m < 10) return false;
        if (m > 10) return true;
        return d >= 15;
    },

    // Converts the date: ye (year), mo (month, 1-12), da (days)
    // into number of Julian days elapsed since 1900, Jan 0.5 (= 1899 Dec 31.5).
    // Count years 'before Christ' as negative, with no year zero; thus:
    // BC -3, -2, -1, 1, 2, 3 AD
    julDay: function (ye, mo, da) {
        // convert civil year to astronomical, zero-based
        let y = ye < 0 ? ye + 1 : ye;
        let m = mo;
        if (mo < 3) {
            m += 12;
            y--;
        }

        let b;
        if (self._after_gregorian(ye, mo, da)) {
            // after Gregorian calendar
            const a = Math.trunc(y / 100);
            b = 2 - a + Math.trunc(a / 4);
        } else {
            b = 0;
        }

        const f = 365.25 * y;
        const c = Math.trunc(y < 0 ? f - 0.75 : f) - 694025;
        const e = Math.trunc(30.6001 * (m + 1));

        return b + c + e + da - 0.5;
    },

    // Converts number of Julian days since 1900 Jan. 0.5 into the calendar date.
    // Returns an array with values same as in julDay input.
    calDay: function (djd) {
        const d = djd + 0.5;
        const f = mathutils.frac(d);
        let i = Math.trunc(d - f);

        if (i > -115860) {
            const a = Math.floor(i / 36524.25 + 9.9835726e-1) + 14;
            i += 1 + a - Math.floor(a / 4);
        }

        const b = Math.floor(i / 365.25 + 8.02601e-1);
        const c = i - Math.floor(365.25 * b + 7.50001e-1) + 416;
        const g = Math.floor(c / 30.6001);
        const da = c - Math.floor(30.6001 * g) + f;
        const mo = g - (g > 13.5 ? 13 : 1);
        let ye = b + (mo < 2.5 ? 1900 : 1899);
        // convert astronomical, zero-based year to civil
        if (ye < 1) {
            ye--;
        }

        return [ye, mo, da];
    },

    // Given DJD, returns DJD at Greenwich midnight.
    djdMidnight: function (djd) {
        const f = Math.floor(djd);
        return f + (Math.abs(djd - f) >= 0.5 ? 0.5 : -0.5);
    },

    // Given DJD, returns a number in range (0..6) corresponding to weekDay:
    // 0 for Sunday, 1 for Monday and so on.
    weekDay: function (djd) {
        const d0 = self.djdMidnight(djd);
        const j0 = d0 + self.DJD_TO_JD;
        return (j0 + 1.5) % 7;
    }

};