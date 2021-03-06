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
require("colors");
var esmangle_1 = __importDefault(require("esmangle"));
var espree_1 = __importDefault(require("espree"));
var fs = __importStar(require("fs"));
var codeGeneration_1 = require("./codeGeneration");
var configuration_1 = require("./configuration");
var identifiers_1 = require("./identifiers");
var insertPosition_1 = require("./insertPosition");
var transformations_1 = require("./transformations");
var identifierRenaming_1 = __importDefault(require("./transformations/identifierRenaming"));
Error.stackTraceLimit = Infinity;
if (process.argv.length < 3) {
    console.log('Usage: npm run inputFile [outputFile]');
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
var outputFile = inputFile + '.obf';
if (process.argv.length > 3) {
    outputFile = process.argv[3];
}
var p = espree_1.default.parse(code, {
    ecmaVersion: configuration_1.configuration.ecmaVersion
});
if (configuration_1.configuration.optimizeInput) {
    p = esmangle_1.default.optimize(p);
}
if (transformations_1.canBeObfuscated(p)) {
    identifiers_1.Identifiers.init(p);
    insertPosition_1.InsertPosition.init(p);
    if (configuration_1.configuration.identifiers.rename) {
        p = new identifierRenaming_1.default(p, {
            renameGlobals: configuration_1.configuration.identifiers.renameGlobals
        }).apply();
    }
    for (var _i = 0, _a = configuration_1.configuration.stream; _i < _a.length; _i++) {
        var item = _a[_i];
        if (item.enabled) {
            var transformationClass = require(item.file);
            var transformation = new transformationClass(p, item.settings);
            configuration_1.Verbose.log(("Transformation '" + item.name + "' ").green + 'started'.green.bold);
            p = transformation.apply();
            configuration_1.Verbose.log(("Transformation '" + item.name + "' ").green + 'finished'.green.bold);
            configuration_1.Verbose.log('---------------------');
        }
    }
    if (configuration_1.configuration.optimizeOutput) {
        p = esmangle_1.default.optimize(p);
    }
    var result = codeGeneration_1.CodeGeneration.generate(p);
    fs.writeFileSync(outputFile, result);
}
else {
    console.log("Program with 'eval' or 'with' command cannot be obfuscated".red);
}
