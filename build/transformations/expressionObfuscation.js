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
var estraverse = __importStar(require("estraverse"));
var configuration_1 = require("../configuration");
var transformations_1 = require("../transformations");
var ExpressionObfuscation = /** @class */ (function (_super) {
    __extends(ExpressionObfuscation, _super);
    function ExpressionObfuscation() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.falseExpression = {
            type: 'UnaryExpression',
            operator: '!',
            prefix: true,
            argument: {
                type: 'ArrayExpression',
                elements: []
            }
        };
        _this.trueExpression = {
            type: 'UnaryExpression',
            operator: '!',
            prefix: true,
            argument: _this.falseExpression
        };
        _this.undefinedExpression = {
            type: 'MemberExpression',
            object: {
                type: 'ArrayExpression',
                elements: []
            },
            property: {
                type: 'ArrayExpression',
                elements: []
            },
            computed: true
        };
        return _this;
    }
    /**
     * @returns {estree.Program}
     * @memberof ExpressionObfuscation
     */
    ExpressionObfuscation.prototype.apply = function () {
        var _this = this;
        var booleanCount = 0;
        var undefinedCount = 0;
        estraverse.replace(this.ast, {
            enter: function (node) {
                if (node.type === 'Literal' && typeof node.value === 'boolean') {
                    if (Math.random() <= _this.settings.booleanChance) {
                        booleanCount++;
                        if (node.value === true) {
                            return _this.trueExpression;
                        }
                        else if (node.value === false) {
                            return _this.falseExpression;
                        }
                    }
                }
                else if (node.type === 'Identifier' && node.name === 'undefined') {
                    var rand = Math.random();
                    if (rand <= _this.settings.undefinedChance) {
                        undefinedCount++;
                        return _this.undefinedExpression;
                    }
                }
            }
        });
        configuration_1.Verbose.log((booleanCount + " booleans obfuscated").yellow);
        configuration_1.Verbose.log((undefinedCount + " 'undefined' expression obfuscated").yellow);
        return this.ast;
    };
    return ExpressionObfuscation;
}(transformations_1.BaseTransformation));
module.exports = ExpressionObfuscation;
//# sourceMappingURL=expressionObfuscation.js.map