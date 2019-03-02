"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var escodegen_1 = __importDefault(require("escodegen"));
var result = escodegen_1.default.generate({
    type: 'BinaryExpression',
    operator: '+',
    left: {
        type: 'Literal',
        value: 40
    },
    right: {
        type: 'Literal',
        value: 3
    }
});
console.log(result);
//# sourceMappingURL=obfuscator.js.map