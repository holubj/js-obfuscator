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
require("colors");
var escodegen_1 = __importDefault(require("escodegen"));
var estraverse = __importStar(require("estraverse"));
var configuration_1 = require("../configuration");
var transformations_1 = require("../transformations");
var NumberObfuscation = /** @class */ (function (_super) {
    __extends(NumberObfuscation, _super);
    function NumberObfuscation() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.zero = {
            type: 'UnaryExpression',
            operator: '+',
            prefix: true,
            argument: {
                type: 'ArrayExpression',
                elements: []
            }
        };
        _this.one = {
            type: 'UnaryExpression',
            operator: '+',
            prefix: true,
            argument: {
                type: 'UnaryExpression',
                operator: '!',
                prefix: true,
                argument: _this.zero
            }
        };
        return _this;
    }
    /**
     * @returns {estree.Program}
     * @memberof NumberObfuscation
     */
    NumberObfuscation.prototype.apply = function () {
        var _this = this;
        var count = 0;
        estraverse.replace(this.ast, {
            enter: function (node, parent) {
                if (node.type === 'Literal' && typeof node.value === 'number' && Number.isInteger(node.value) && !_this.isProperty(node, parent)) {
                    if (node.value >= 0 && node.value < 10) {
                        if (Math.random() <= _this.settings.chance) {
                            count++;
                            return _this.getNumberExpression(node.value);
                        }
                    }
                    var numeralSystem = Math.floor(Math.random() * 3) + 1;
                    var value = '';
                    switch (numeralSystem) {
                        case 1:
                            value = '0x' + node.value.toString(16);
                            break;
                        case 2:
                            value = '0o' + node.value.toString(8);
                            break;
                        case 3:
                            value = '0b' + node.value.toString(2);
                            break;
                    }
                    // @ts-ignore
                    node['x-verbatim-property'] = {
                        content: value,
                        precedence: escodegen_1.default.Precedence.Primary
                    };
                }
            }
        });
        configuration_1.Verbose.log((count + " numbers obfuscated").yellow);
        return this.ast;
    };
    /**
     * @protected
     * @param {number} value
     * @returns {(estree.UnaryExpression | estree.BinaryExpression)}
     * @memberof NumberObfuscation
     */
    NumberObfuscation.prototype.getNumberExpression = function (value) {
        if (value > 1) {
            return {
                type: 'BinaryExpression',
                operator: '+',
                left: this.one,
                right: this.getNumberExpression(value - 1)
            };
        }
        else if (value === 1) {
            return this.one;
        }
        else {
            return this.zero;
        }
    };
    /**
     * @protected
     * @param {estree.Node} node
     * @param {(estree.Node | null)} parent
     * @returns {boolean}
     * @memberof NumberObfuscation
     */
    NumberObfuscation.prototype.isProperty = function (node, parent) {
        if (parent === null) {
            return false;
        }
        else {
            return parent.type === 'Property' && parent.key === node;
        }
    };
    return NumberObfuscation;
}(transformations_1.BaseTransformation));
module.exports = NumberObfuscation;
