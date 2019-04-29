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
require("colors");
var estraverse = __importStar(require("estraverse"));
var codeGeneration_1 = require("../codeGeneration");
var configuration_1 = require("../configuration");
var transformations_1 = require("../transformations");
var expressionObfuscation_1 = __importDefault(require("./expressionObfuscation"));
var literalObfuscation_1 = __importDefault(require("./literalObfuscation"));
var numberObfuscation_1 = __importDefault(require("./numberObfuscation"));
var EvalOutlining = /** @class */ (function (_super) {
    __extends(EvalOutlining, _super);
    function EvalOutlining() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * @returns {estree.Program}
     * @memberof EvalOutlining
     */
    EvalOutlining.prototype.apply = function () {
        var _this = this;
        var count = 0;
        estraverse.replace(this.ast, {
            leave: function (node) {
                if (transformations_1.loopStatements.includes(node.type)) {
                    return estraverse.VisitorOption.Skip;
                }
                if (node.type === 'BlockStatement') {
                    if (!_this.isSuitable(node)) {
                        return;
                    }
                    if (Math.random() <= _this.settings.chance) {
                        count++;
                        var block = {
                            type: 'BlockStatement',
                            body: [
                                {
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
                                }
                            ]
                        };
                        var program = {
                            type: 'Program',
                            body: [block],
                            sourceType: 'script'
                        };
                        var originalVerboseState = configuration_1.Verbose.isEnabled;
                        configuration_1.Verbose.isEnabled = false;
                        new literalObfuscation_1.default(program, {
                            splitChance: 0.8,
                            arrayChance: 0,
                            base64Chance: 0.8,
                            unicodeChance: 1
                        }).apply();
                        new expressionObfuscation_1.default(program, {
                            booleanChance: 0.8,
                            undefinedChance: 0.8
                        }).apply();
                        new numberObfuscation_1.default(program, {
                            chance: 0.5
                        }).apply();
                        configuration_1.Verbose.isEnabled = originalVerboseState;
                        return program.body[0];
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
        var suitable = true;
        estraverse.traverse(expression, {
            enter: function (node) {
                if (transformations_1.forbiddenEvalStatements.includes(node.type)) {
                    suitable = false;
                }
            }
        });
        return suitable;
    };
    return EvalOutlining;
}(transformations_1.BaseTransformation));
module.exports = EvalOutlining;
