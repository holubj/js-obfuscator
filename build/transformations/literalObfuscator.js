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
var configuration_1 = require("../configuration");
var identifiers_1 = require("../identifiers");
var insertPosition_1 = require("../insertPosition");
var transformations_1 = require("../transformations");
var LiteralObfuscator = /** @class */ (function (_super) {
    __extends(LiteralObfuscator, _super);
    function LiteralObfuscator() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.literals = [];
        return _this;
    }
    /**
     * @returns {estree.Program}
     * @memberof LiteralObfuscator
     */
    LiteralObfuscator.prototype.apply = function () {
        this.splitLiterals();
        this.fetchLiterals();
        this.moveLiteralsToLiteralArray();
        this.base64EncodeLiterals();
        return this.ast;
    };
    /**
     * @protected
     * @returns {void}
     * @memberof LiteralObfuscator
     */
    LiteralObfuscator.prototype.splitLiterals = function () {
        var _this = this;
        if (this.settings.splitThreshold === 0) {
            return;
        }
        var count = 0;
        estraverse.replace(this.ast, {
            leave: function (node) {
                if (node.type === 'Literal' && typeof node.value === 'string' && node.value !== 'use strict') {
                    if (Math.random() <= _this.settings.splitThreshold) {
                        if (node.value.length >= 2) {
                            count++;
                            var cut = Math.floor(Math.random() * (node.value.length - 1)) + 1;
                            return {
                                type: 'BinaryExpression',
                                operator: '+',
                                left: {
                                    type: 'Literal',
                                    value: node.value.substring(0, cut)
                                },
                                right: {
                                    type: 'Literal',
                                    value: node.value.substring(cut)
                                }
                            };
                        }
                    }
                }
            }
        });
        configuration_1.Verbose.log((count + " literals splitted.").yellow);
    };
    /**
     * @protected
     * @memberof LiteralObfuscator
     */
    LiteralObfuscator.prototype.fetchLiterals = function () {
        var _this = this;
        estraverse.replace(this.ast, {
            enter: function (node) {
                if (node.type === 'Literal' && typeof node.value === 'string' && node.value !== 'use strict') {
                    if (Math.random() <= _this.settings.arrayThreshold) {
                        if (!_this.literals.find(function (literal) { return literal === node.value; })) {
                            _this.literals.push(node.value);
                        }
                    }
                }
            }
        });
        this.literals = shuffle_array_1.default(this.literals);
    };
    /**
     * @protected
     * @memberof LiteralObfuscator
     */
    LiteralObfuscator.prototype.moveLiteralsToLiteralArray = function () {
        var _this = this;
        var count = 0;
        var shift = Math.floor(Math.random() * 100);
        var literalArrayIdentifier = identifiers_1.Identifiers.generate();
        var accessFuncIdentifier = identifiers_1.Identifiers.generate();
        estraverse.replace(this.ast, {
            enter: function (node) {
                if (node.type === 'Literal' && typeof node.value === 'string' && node.value !== 'use strict') {
                    // some literals may be omitted based on threshold settings
                    if (_this.literals.indexOf(node.value) > -1) {
                        count++;
                        var index = _this.literals.findIndex(function (literal) { return literal === node.value; });
                        return _this.generateAccessFuncCall(accessFuncIdentifier, index + shift);
                    }
                }
            }
        });
        this.ast.body.splice(insertPosition_1.InsertPosition.get(), 0, this.generateAccessFuncDeclaration(accessFuncIdentifier, literalArrayIdentifier, shift));
        this.ast.body.splice(insertPosition_1.InsertPosition.get(), 0, this.generateLiteralArray(literalArrayIdentifier));
        configuration_1.Verbose.log((count + " literals moved to literal array.").yellow);
    };
    LiteralObfuscator.prototype.base64EncodeLiterals = function () {
        var _this = this;
        var count = 0;
        estraverse.replace(this.ast, {
            leave: function (node) {
                if (node.type === 'Literal' && typeof node.value === 'string' && node.value !== 'use strict') {
                    if (Math.random() <= _this.settings.base64Threshold && !/[^A-Za-z0-9 ]/.test(node.value)) {
                        count++;
                        return {
                            type: 'CallExpression',
                            callee: {
                                type: 'Identifier',
                                name: 'atob'
                            },
                            arguments: [
                                {
                                    type: 'Literal',
                                    value: Buffer.from(node.value, 'binary').toString('base64')
                                }
                            ]
                        };
                    }
                }
            }
        });
        configuration_1.Verbose.log((count + " literals encoded to base64.").yellow);
    };
    /**
     * @protected
     * @param {string} ident
     * @returns {estree.VariableDeclaration}
     * @memberof LiteralObfuscator
     */
    LiteralObfuscator.prototype.generateLiteralArray = function (ident) {
        var elements = [];
        for (var _i = 0, _a = this.literals; _i < _a.length; _i++) {
            var literal = _a[_i];
            elements.push({
                type: 'Literal',
                value: literal
            });
        }
        return {
            type: 'VariableDeclaration',
            kind: 'var',
            declarations: [
                {
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: ident
                    },
                    init: {
                        type: 'ArrayExpression',
                        elements: elements
                    }
                }
            ]
        };
    };
    /**
     * @protected
     * @param {string} accessFuncIdentifier
     * @param {string} literalArrayIdentifier
     * @returns {estree.FunctionDeclaration}
     * @memberof LiteralObfuscator
     */
    LiteralObfuscator.prototype.generateAccessFuncDeclaration = function (accessFuncIdentifier, literalArrayIdentifier, shift) {
        var argumentIdent = identifiers_1.Identifiers.generate();
        return {
            type: 'FunctionDeclaration',
            id: { type: 'Identifier', name: accessFuncIdentifier },
            generator: false,
            params: [{ type: 'Identifier', name: argumentIdent }],
            body: {
                type: 'BlockStatement',
                body: [
                    {
                        type: 'ReturnStatement',
                        argument: {
                            type: 'MemberExpression',
                            object: {
                                type: 'Identifier',
                                name: literalArrayIdentifier
                            },
                            property: {
                                type: 'BinaryExpression',
                                operator: '-',
                                left: { type: 'Identifier', name: argumentIdent },
                                right: { type: 'Literal', value: shift }
                            },
                            computed: true
                        }
                    }
                ]
            }
        };
    };
    /**
     * @protected
     * @param {string} accessFuncIdentifier
     * @param {number} index
     * @returns {estree.CallExpression}
     * @memberof LiteralObfuscator
     */
    LiteralObfuscator.prototype.generateAccessFuncCall = function (accessFuncIdentifier, index) {
        return {
            type: 'CallExpression',
            callee: {
                type: 'Identifier',
                name: accessFuncIdentifier
            },
            arguments: [
                {
                    type: 'Literal',
                    value: index
                }
            ]
        };
    };
    return LiteralObfuscator;
}(transformations_1.BaseTransformation));
module.exports = LiteralObfuscator;
//# sourceMappingURL=literalObfuscator.js.map