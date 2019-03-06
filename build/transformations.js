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
exports.transformations = [];
try {
    exports.transformations = JSON.parse(fs.readFileSync(__dirname + '/../settings.json', 'utf8'));
}
catch (err) {
    exports.transformations = [];
}
var BaseTransformation = /** @class */ (function () {
    function BaseTransformation(p, settings) {
        if (settings === void 0) { settings = {}; }
        this.p = p;
        this.settings = settings;
    }
    return BaseTransformation;
}());
exports.BaseTransformation = BaseTransformation;
//# sourceMappingURL=transformations.js.map