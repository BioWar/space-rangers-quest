"use strict";
// https://github.com/coverslide/node-alea/blob/master/alea.js
// http://baagoe.com/en/RandomMusings/javascript/
// https://github.com/dworthen/prng
Object.defineProperty(exports, "__esModule", { value: true });
var Alea = /** @class */ (function () {
    function Alea(args) {
        var _this = this;
        this.s0 = 0;
        this.s1 = 0;
        this.s2 = 0;
        this.c = 1;
        this.random = function (decimal) {
            var t = 2091639 * _this.s0 + _this.c * 2.3283064365386963e-10; // 2^-32
            _this.s0 = _this.s1;
            _this.s1 = _this.s2;
            _this.c = t | 0;
            _this.s2 = t - _this.c;
            var random = _this.s2;
            return decimal !== undefined ? Math.floor(random * decimal) : random;
        };
        if (typeof (args) === 'string') {
            var mash = Mash();
            this.s0 = mash(" ");
            this.s1 = mash(" ");
            this.s2 = mash(" ");
            for (var i = 0; i < args.length; i++) {
                this.s0 -= mash(args[i]);
                if (this.s0 < 0) {
                    this.s0 += 1;
                }
                this.s1 -= mash(args[i]);
                if (this.s1 < 0) {
                    this.s1 += 1;
                }
                this.s2 -= mash(args[i]);
                if (this.s2 < 0) {
                    this.s2 += 1;
                }
            }
        }
        else {
            this.importState(args);
        }
    }
    /*
    uint32() {
        return this.random() * 0x100000000; // 2^32
    }

    fract53() {
        return (
            this.random() +
            ((this.random() * 0x200000) | 0) * 1.1102230246251565e-16
        ); // 2^-53
    }
    */
    Alea.prototype.exportState = function () {
        return [this.s0, this.s1, this.s2, this.c];
    };
    Alea.prototype.importState = function (params) {
        this.s0 = +params[0] || 0;
        this.s1 = +params[1] || 0;
        this.s2 = +params[2] || 0;
        this.c = +params[3] || 0;
    };
    return Alea;
}());
exports.Alea = Alea;
function Mash() {
    var n = 0xefc8249d;
    var mash = function (data) {
        // data = data.toString();
        for (var i = 0; i < data.length; i++) {
            n += data.charCodeAt(i);
            var h = 0.02519603282416938 * n;
            n = h >>> 0;
            h -= n;
            h *= n;
            n = h >>> 0;
            h -= n;
            n += h * 0x100000000; // 2^32
        }
        return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
    };
    // mash.version = 'Mash 0.9';
    return mash;
}
/*
const a = new Alea('');
console.info(a.random(100));
console.info(a.random(100));
console.info(a.random(100));
console.info(a.random(100));
*/ 
