"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = __importStar(require("fs"));
var yaml = __importStar(require("js-yaml"));
exports.configuration = {};
try {
    exports.configuration = yaml.safeLoad(fs.readFileSync(__dirname + '/../config.yaml', 'utf8'));
}
catch (err) {
    process.exit(1);
}
var Verbose = /** @class */ (function () {
    function Verbose() {
    }
    /**
     * @static
     * @param {*} [message]
     * @memberof Verbose
     */
    Verbose.log = function (message) {
        if (this.isEnabled) {
            console.log(message);
        }
    };
    Verbose.isEnabled = false;
    return Verbose;
}());
exports.Verbose = Verbose;
Verbose.isEnabled = exports.configuration.verbose;
