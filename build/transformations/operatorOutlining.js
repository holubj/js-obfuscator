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
var configuration_1 = require("../configuration");
var identifiers_1 = require("../identifiers");
var insertPosition_1 = require("../insertPosition");
var transformations_1 = require("../transformations");
/**
 * Unary Operators "-" | "+" | "!" | "~" | "typeof" | "void"
 * Binary Operators "==" | "!=" | "===" | "!==" | "<" | "<=" | ">" | ">=" | "<<" | ">>" | ">>>" | "+" | "-" | "*" | "/" | "%" | "**" | "|" | "^" | "&" | "in" | "instanceof"
 * Assignment Operators (only when left side is identifier) +=" | "-=" | "*=" | "/=" | "%=" | "**=" | "<<=" | ">>=" | ">>>=" | "|=" | "^=" | "&="
 *
 * @class OperatorOutlining
 * @extends {BaseTransformation}
 */
var OperatorOutlining = /** @class */ (function (_super) {
    __extends(OperatorOutlining, _super);
    function OperatorOutlining() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.unaryPrefix = 'unary ';
        _this.funcIdentifiers = {};
        _this.usedIdentifiers = new Set();
        _this.doLookup = true;
        return _this;
    }
    /**
     * @returns {estree.Program}
     * @memberof OperatorOutlining
     */
    OperatorOutlining.prototype.apply = function () {
        if (this.settings.unaryOperators) {
            this.outlineUnaryOperators();
        }
        if (this.settings.assigmentOperators) {
            this.replaceAssignmentOperators();
        }
        if (this.settings.binaryOperators) {
            this.outlineBinaryOperators();
        }
        return this.ast;
    };
    /**
     * @protected
     * @param {(estree.UnaryExpression | estree.BinaryExpression)} node
     * @returns {string}
     * @memberof OperatorOutlining
     */
    OperatorOutlining.prototype.getOperatorFuncIdentifier = function (node) {
        var operator = node.operator;
        if (node.type === 'UnaryExpression') {
            operator = this.unaryPrefix + operator;
        }
        if (!(operator in this.funcIdentifiers)) {
            var funcIdentifier = identifiers_1.Identifiers.generate();
            this.funcIdentifiers[operator] = funcIdentifier;
            if (node.type === 'UnaryExpression') {
                this.registerUnaryOperatorFunc(node, funcIdentifier);
            }
            else {
                this.registerBinaryOperatorFunc(node, funcIdentifier);
            }
        }
        return this.funcIdentifiers[operator];
    };
    /**
     * @protected
     * @param {string} operatorKey
     * @param {string} generatedIdentifier
     * @param {estree.FunctionDeclaration} operatorFunc
     * @memberof OperatorOutlining
     */
    OperatorOutlining.prototype.registerFunc = function (operatorKey, generatedIdentifier, operatorFunc) {
        this.funcIdentifiers[operatorKey] = generatedIdentifier;
        this.ast.body.splice(insertPosition_1.InsertPosition.get(), 0, operatorFunc);
        configuration_1.Verbose.log(("Operator '" + operatorKey + "' outlined").yellow);
    };
    /**
     * @protected
     * @memberof OperatorOutlining
     */
    OperatorOutlining.prototype.outlineUnaryOperators = function () {
        var _this = this;
        estraverse.replace(this.ast, {
            enter: function (node) {
                if (node.type === 'UnaryExpression' && node.operator !== 'delete') {
                    var callExpression = {
                        type: 'CallExpression',
                        callee: {
                            type: 'Identifier',
                            name: _this.getOperatorFuncIdentifier(node)
                        },
                        arguments: [node.argument]
                    };
                    return callExpression;
                }
            }
        });
    };
    /**
     * @protected
     * @param {estree.UnaryExpression} node
     * @param {string} funcIdentifier
     * @memberof OperatorOutlining
     */
    OperatorOutlining.prototype.registerUnaryOperatorFunc = function (node, funcIdentifier) {
        var value = 'value';
        var operatorFunc = {
            type: 'FunctionDeclaration',
            id: { type: 'Identifier', name: funcIdentifier },
            generator: false,
            params: [{ type: 'Identifier', name: value }],
            body: {
                type: 'BlockStatement',
                body: [
                    {
                        type: 'ReturnStatement',
                        argument: {
                            type: node.type,
                            operator: node.operator,
                            prefix: node.prefix,
                            argument: { type: 'Identifier', name: value }
                        }
                    }
                ]
            }
        };
        this.registerFunc(this.unaryPrefix + node.operator, funcIdentifier, operatorFunc);
    };
    /**
     * @protected
     * @memberof OperatorOutlining
     */
    OperatorOutlining.prototype.replaceAssignmentOperators = function () {
        estraverse.replace(this.ast, {
            enter: function (node) {
                if (node.type === 'AssignmentExpression') {
                    if (node.operator !== '=' && node.left.type === 'Identifier') {
                        var replacement = {
                            type: 'AssignmentExpression',
                            operator: '=',
                            left: node.left,
                            right: {
                                type: 'BinaryExpression',
                                operator: '+',
                                left: node.left,
                                right: node.right
                            }
                        };
                        return replacement;
                    }
                }
            }
        });
    };
    /**
     * @protected
     * @memberof OperatorOutlining
     */
    OperatorOutlining.prototype.outlineBinaryOperators = function () {
        var _this = this;
        estraverse.replace(this.ast, {
            enter: function (node) {
                if (node.type === 'BinaryExpression') {
                    var callExpression = {
                        type: 'CallExpression',
                        callee: {
                            type: 'Identifier',
                            name: _this.getOperatorFuncIdentifier(node)
                        },
                        arguments: [node.left, node.right]
                    };
                    return callExpression;
                }
            }
        });
    };
    /**
     * @protected
     * @param {estree.BinaryExpression} node
     * @param {string} funcIdentifier
     * @memberof OperatorOutlining
     */
    OperatorOutlining.prototype.registerBinaryOperatorFunc = function (node, funcIdentifier) {
        var leftIdentifier = identifiers_1.Identifiers.generate();
        var rightIdentifier = identifiers_1.Identifiers.generate();
        var operatorFunc = {
            type: 'FunctionDeclaration',
            id: { type: 'Identifier', name: funcIdentifier },
            generator: false,
            params: [{ type: 'Identifier', name: leftIdentifier }, { type: 'Identifier', name: rightIdentifier }],
            body: {
                type: 'BlockStatement',
                body: [
                    {
                        type: 'ReturnStatement',
                        argument: {
                            type: node.type,
                            operator: node.operator,
                            left: { type: 'Identifier', name: leftIdentifier },
                            right: { type: 'Identifier', name: rightIdentifier }
                        }
                    }
                ]
            }
        };
        this.registerFunc(node.operator, funcIdentifier, operatorFunc);
    };
    return OperatorOutlining;
}(transformations_1.BaseTransformation));
module.exports = OperatorOutlining;
//# sourceMappingURL=operatorOutlining.js.map