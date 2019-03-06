"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var escodegen_1 = __importDefault(require("escodegen"));
var esmangle_1 = __importDefault(require("esmangle"));
var espree_1 = __importDefault(require("espree"));
var fs = __importStar(require("fs"));
var transformations_1 = require("./transformations");
Error.stackTraceLimit = Infinity;
if (process.argv.length < 3) {
    console.log('Usage: node ' + process.argv[1] + ' FILENAME');
    process.exit(1);
}
var code = '';
var inputFile = process.argv[2];
try {
    code = fs.readFileSync(inputFile).toString('utf8');
}
catch (err) {
    console.log("Unable to read input file " + inputFile);
    process.exit(1);
}
var p = espree_1.default.parse(code);
p = esmangle_1.default.optimize(p, null);
p = esmangle_1.default.mangle(p);
for (var _i = 0, transformations_2 = transformations_1.transformations; _i < transformations_2.length; _i++) {
    var definition = transformations_2[_i];
    var transformationClass = require(definition.file);
    var transformation = new transformationClass(p);
    p = transformation.apply();
}
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
//# sourceMappingURL=obfuscation.js.map