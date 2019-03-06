"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// TODO: nacitat z externiho configu v JSON formatu
exports.transformations = [
    {
        name: 'test',
        file: './transformations/test.js',
        settings: {}
    }
];
var BaseTransformation = /** @class */ (function () {
    function BaseTransformation(p, settings) {
        if (settings === void 0) { settings = {}; }
        this.p = p;
        this.settings = settings;
    }
    return BaseTransformation;
}());
exports.BaseTransformation = BaseTransformation;
//# sourceMappingURL=transformation.js.map