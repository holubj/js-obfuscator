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
require("colors");
var estraverse = __importStar(require("estraverse"));
var codeGeneration_1 = require("../codeGeneration");
var configuration_1 = require("../configuration");
var transformations_1 = require("../transformations");
var EvalOutlining = /** @class */ (function (_super) {
    __extends(EvalOutlining, _super);
    function EvalOutlining() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.forbiddenStatements = ['ReturnStatement', 'BreakStatement', 'ContinueStatement', 'VariableDeclaration', 'FunctionDeclaration'];
        return _this;
    }
    /**
     * @returns {estree.Program}
     * @memberof EvalOutlining
     */
    EvalOutlining.prototype.apply = function () {
        var _this = this;
        var count = 0;
        estraverse.replace(this.ast, {
            enter: function (node, parent) {
                if (parent !== null && parent.type === 'BlockStatement') {
                    if (!_this.isSuitable(node)) {
                        return;
                    }
                    if (Math.random() <= _this.settings.chance) {
                        count++;
                        return {
                            type: 'ExpressionStatement',
                            expression: {
                                type: 'CallExpression',
                                callee: {
                                    type: 'Identifier',
                                    name: 'eval'
                                },
                                arguments: [
                                    {
                                        type: 'Literal',
                                        value: codeGeneration_1.CodeGeneration.generate(node)
                                    }
                                ]
                            }
                        };
                    }
                }
            }
        });
        configuration_1.Verbose.log((count + " expressions outlined to eval").yellow);
        return this.ast;
    };
    /**
     * @protected
     * @param {estree.Node} expression
     * @returns {boolean}
     * @memberof EvalOutlining
     */
    EvalOutlining.prototype.isSuitable = function (expression) {
        var _this = this;
        var suitable = true;
        estraverse.traverse(expression, {
            enter: function (node) {
                if (_this.forbiddenStatements.includes(node.type)) {
                    suitable = false;
                }
            }
        });
        return suitable;
    };
    return EvalOutlining;
}(transformations_1.BaseTransformation));
module.exports = EvalOutlining;
//# sourceMappingURL=evalOutlining.js.map