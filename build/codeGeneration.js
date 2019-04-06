"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var escodegen_1 = __importDefault(require("escodegen"));
var CodeGeneration = /** @class */ (function () {
    function CodeGeneration() {
    }
    /**
     * @static
     * @returns {string}
     * @memberof CodeGeneration
     */
    CodeGeneration.generate = function (p) {
        return escodegen_1.default.generate(p, {
            format: {
                renumber: true,
                hexadecimal: true,
                escapeless: true,
                compact: true,
                semicolons: false,
                parentheses: false
            },
            verbatim: 'x-verbatim-property'
        });
    };
    return CodeGeneration;
}());
exports.CodeGeneration = CodeGeneration;
//# sourceMappingURL=codeGeneration.js.map