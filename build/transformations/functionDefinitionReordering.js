"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var estraverse = __importStar(require("estraverse"));
var shuffle_array_1 = __importDefault(require("shuffle-array"));
var transformations_1 = require("../transformations");
var FunctionDefinitonReordering = /** @class */ (function (_super) {
    __extends(FunctionDefinitonReordering, _super);
    function FunctionDefinitonReordering() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * @returns {estree.Program}
     * @memberof FunctionDefinitonReordering
     */
    FunctionDefinitonReordering.prototype.apply = function () {
        estraverse.replace(this.ast, {
            enter: function (node) {
                if (node.type === 'Program' || node.type === 'BlockStatement') {
                    var declarations = [];
                    var insertIndex = -1;
                    for (var i = 0; i < node.body.length; i++) {
                        // @ts-ignore
                        if (insertIndex === -1 && !node.body[i].directive) {
                            insertIndex = i;
                        }
                        if (node.body[i].type === 'FunctionDeclaration') {
                            declarations.push(node.body[i]);
                            node.body.splice(i, 1);
                            i--;
                        }
                    }
                    if (declarations.length > 0) {
                        declarations = shuffle_array_1.default(declarations);
                        for (var _i = 0, declarations_1 = declarations; _i < declarations_1.length; _i++) {
                            var declaration = declarations_1[_i];
                            node.body.splice(insertIndex, 0, declaration);
                        }
                    }
                }
            }
        });
        return this.ast;
    };
    return FunctionDefinitonReordering;
}(transformations_1.BaseTransformation));
module.exports = FunctionDefinitonReordering;
//# sourceMappingURL=functionDefinitionReordering.js.map