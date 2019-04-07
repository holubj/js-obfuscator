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
var identifiers_1 = require("../identifiers");
var transformations_1 = require("../transformations");
var FunctionMerging = /** @class */ (function (_super) {
    __extends(FunctionMerging, _super);
    function FunctionMerging() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.UNDEFINED = -1;
        return _this;
    }
    /**
     * @returns {estree.Program}
     * @memberof FunctionMerging
     */
    FunctionMerging.prototype.apply = function () {
        var _this = this;
        estraverse.replace(this.ast, {
            enter: function (node) {
                if (node.type === 'Program' || node.type === 'BlockStatement') {
                    var firstDeclarationIndex = _this.UNDEFINED;
                    for (var i = 0; i < node.body.length; i++) {
                        if (node.body[i].type === 'FunctionDeclaration' && _this.isSuitable(node.body[i])) {
                            if (firstDeclarationIndex === _this.UNDEFINED) {
                                firstDeclarationIndex = i;
                            }
                            else {
                                var mergedDeclaration = _this.mergeDeclarations(node.body[firstDeclarationIndex], node.body[i]);
                                node.body[i] = mergedDeclaration;
                                _this.ast.body.splice(firstDeclarationIndex, 1);
                                i--;
                                firstDeclarationIndex = _this.UNDEFINED;
                            }
                        }
                    }
                    return node;
                }
            }
        });
        return this.ast;
    };
    /**
     * @protected
     * @param {estree.FunctionDeclaration} firstDeclaration
     * @param {estree.FunctionDeclaration} secondDeclaration
     * @returns {estree.FunctionDeclaration}
     * @memberof FunctionMerging
     */
    FunctionMerging.prototype.mergeDeclarations = function (firstDeclaration, secondDeclaration) {
        var ident = identifiers_1.Identifiers.generate();
        var max = Math.max(firstDeclaration.params.length, secondDeclaration.params.length);
        var unifiedParams = [];
        var decidingVariable = {
            type: 'Identifier',
            name: identifiers_1.Identifiers.generate()
        };
        unifiedParams.push(decidingVariable);
        for (var i = 0; i < max; i++) {
            unifiedParams.push({
                type: 'Identifier',
                name: identifiers_1.Identifiers.generate()
            });
        }
        firstDeclaration = this.mapNewParams(firstDeclaration, unifiedParams);
        secondDeclaration = this.mapNewParams(secondDeclaration, unifiedParams);
        var firstLiteral = this.extractLiteral(firstDeclaration, 0, decidingVariable);
        var secondLiteral = this.extractLiteral(secondDeclaration, 1, decidingVariable);
        this.updateFuncCalls(firstDeclaration, ident, firstLiteral);
        this.updateFuncCalls(secondDeclaration, ident, secondLiteral);
        // update also possible recursive calls
        firstDeclaration = this.updateRecursiveCalls(firstDeclaration, ident, firstDeclaration, firstLiteral);
        firstDeclaration = this.updateRecursiveCalls(firstDeclaration, ident, secondDeclaration, secondLiteral);
        secondDeclaration = this.updateRecursiveCalls(secondDeclaration, ident, secondDeclaration, secondLiteral);
        secondDeclaration = this.updateRecursiveCalls(secondDeclaration, ident, firstDeclaration, firstLiteral);
        return {
            type: 'FunctionDeclaration',
            id: {
                type: 'Identifier',
                name: ident
            },
            params: unifiedParams,
            generator: false,
            body: {
                type: 'BlockStatement',
                body: [
                    {
                        type: 'IfStatement',
                        test: {
                            type: 'BinaryExpression',
                            operator: '===',
                            left: decidingVariable,
                            right: firstLiteral
                        },
                        consequent: firstDeclaration.body,
                        alternate: secondDeclaration.body
                    }
                ]
            }
        };
    };
    /**
     * @protected
     * @param {estree.FunctionDeclaration} decl
     * @param {estree.Identifier[]} unifiedParams
     * @returns {estree.FunctionDeclaration}
     * @memberof FunctionMerging
     */
    FunctionMerging.prototype.mapNewParams = function (decl, unifiedParams) {
        var _loop_1 = function (i) {
            var originalName = decl.params[i].name;
            estraverse.replace(decl, {
                enter: function (node) {
                    if (node.type === 'Identifier' && node.name === originalName) {
                        return unifiedParams[i + 1];
                    }
                }
            });
        };
        for (var i = 0; i < decl.params.length; i++) {
            _loop_1(i);
        }
        return decl;
    };
    /**
     * @protected
     * @param {estree.FunctionDeclaration} decl
     * @param {number} defaultValue
     * @param {estree.Identifier} decidingVariable
     * @returns {estree.Literal}
     * @memberof FunctionMerging
     */
    FunctionMerging.prototype.extractLiteral = function (decl, defaultValue, decidingVariable) {
        var literal = {
            type: 'Literal',
            value: defaultValue
        };
        var extracted = false;
        estraverse.replace(decl, {
            enter: function (node) {
                if (node.type === 'Literal' && !extracted) {
                    literal = node;
                    extracted = true;
                    return decidingVariable;
                }
            }
        });
        return literal;
    };
    /**
     * @protected
     * @param {estree.FunctionDeclaration} decl
     * @param {string} mergedIdent
     * @param {estree.Literal} decidingLiteral
     * @memberof FunctionMerging
     */
    FunctionMerging.prototype.updateFuncCalls = function (decl, mergedIdent, decidingLiteral) {
        estraverse.replace(this.ast, {
            enter: function (node) {
                if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && decl.id !== null && node.callee.name === decl.id.name) {
                    node.callee.name = mergedIdent;
                    node.arguments.splice(0, 0, decidingLiteral);
                }
            }
        });
    };
    /**
     * @protected
     * @param {estree.FunctionDeclaration} scope
     * @param {string} mergedIdent
     * @param {estree.FunctionDeclaration} decl
     * @param {estree.Literal} decidingLiteral
     * @returns {estree.FunctionDeclaration}
     * @memberof FunctionMerging
     */
    FunctionMerging.prototype.updateRecursiveCalls = function (scope, mergedIdent, decl, decidingLiteral) {
        estraverse.replace(scope, {
            enter: function (node) {
                if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && decl.id !== null && node.callee.name === decl.id.name) {
                    node.callee.name = mergedIdent;
                    node.arguments.splice(0, 0, decidingLiteral);
                }
            }
        });
        return scope;
    };
    /**
     * @protected
     * @param {estree.FunctionDeclaration} funcDeclaration
     * @returns {boolean}
     * @memberof FunctionMerging
     */
    FunctionMerging.prototype.isSuitable = function (funcDeclaration) {
        var suitable = true;
        estraverse.traverse(funcDeclaration, {
            enter: function (node) {
                if (node.type === 'Identifier' && node.name === 'arguments') {
                    suitable = false;
                }
            }
        });
        estraverse.traverse(this.ast, {
            enter: function (node, parent) {
                if (node.type === 'Identifier' && funcDeclaration.id !== null && node.name === funcDeclaration.id.name) {
                    if (!parent ||
                        (!(parent.type === 'CallExpression' && parent.callee.type === 'Identifier' && parent.callee.name === funcDeclaration.id.name) &&
                            parent.type !== 'FunctionDeclaration')) {
                        suitable = false;
                    }
                }
            }
        });
        return suitable;
    };
    return FunctionMerging;
}(transformations_1.BaseTransformation));
module.exports = FunctionMerging;
//# sourceMappingURL=functionMerging.js.map