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
var espree_1 = __importDefault(require("espree"));
var fs = __importStar(require("fs"));
var configuration_1 = require("./configuration");
var identifiers_1 = require("./identifiers");
var insertPosition_1 = require("./insertPosition");
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
// p = esmangle.optimize(p, null);
// p = esmangle.mangle(p);
identifiers_1.Identifiers.init(p);
insertPosition_1.InsertPosition.init(p);
for (var _i = 0, _a = configuration_1.configuration.stream; _i < _a.length; _i++) {
    var item = _a[_i];
    if (item.enabled) {
        var transformationClass = require(item.file);
        var transformation = new transformationClass(p, item.settings);
        configuration_1.Verbose.log(("Running transformation '" + item.name + "'").green.bold);
        p = transformation.apply();
    }
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