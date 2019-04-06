"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var estraverse = __importStar(require("estraverse"));
var BaseTransformation = /** @class */ (function () {
    function BaseTransformation(ast, settings) {
        if (settings === void 0) { settings = {}; }
        this.ast = ast;
        this.settings = settings;
    }
    return BaseTransformation;
}());
exports.BaseTransformation = BaseTransformation;
function isSuitable(ast) {
    var suitable = true;
    estraverse.traverse(ast, {
        enter: function (node) {
            if ((node.type === 'Identifier' && node.name === 'eval') || node.type === 'WithStatement') {
                suitable = false;
            }
        }
    });
    return suitable;
}
exports.isSuitable = isSuitable;
//# sourceMappingURL=transformations.js.map