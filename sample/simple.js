'use strict';
var a = true;
console.log(a);
var s = 'ěščřžýáí@@`#$~{&^#{😀';
console.log(s);
var ss = '\x75\x73\x65';

if (s && ss) {
    console.log('test');
}

var isStrict = (function () {
    return !this;
})();
console.log(isStrict);
/*
function sum(alpha, beta) {
    return alpha + beta;
}
console.log(sum(2, 3));
var a = 1;
var b = -2;
a += a + 420 + b;

console.log(a + b);
console.log(a + b);
console.log(a - b);
console.log(a * b);
console.log(a / b);
console.log(a % b);
console.log(a >> b);
*/
