"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var escodegen_1 = __importDefault(require("escodegen"));
var esmangle_1 = __importDefault(require("esmangle"));
var espree_1 = __importDefault(require("espree"));
Error.stackTraceLimit = Infinity;
var p = espree_1.default.parse('function sum(alpha, beta){return alpha + beta;} console.log(sum(2, 3));');
p = esmangle_1.default.optimize(p, null);
p = esmangle_1.default.mangle(p);
var result = escodegen_1.default.generate(p, {
    format: {
        renumber: true,
        hexadecimal: true,
        escapeless: true,
        compact: true,
        semicolons: false,
        parentheses: false
    }
});
console.log(result);
//# sourceMappingURL=obfuscator.js.map