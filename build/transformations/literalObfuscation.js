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
var shuffle_array_1 = __importDefault(require("shuffle-array"));
var configuration_1 = require("../configuration");
var identifiers_1 = require("../identifiers");
var insertPosition_1 = require("../insertPosition");
var transformations_1 = require("../transformations");
var estemplate = require('estemplate');
var LiteralObfuscation = /** @class */ (function (_super) {
    __extends(LiteralObfuscation, _super);
    function LiteralObfuscation() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.literals = [];
        return _this;
    }
    /**
     * @returns {estree.Program}
     * @memberof LiteralObfuscation
     */
    LiteralObfuscation.prototype.apply = function () {
        this.splitLiterals();
        this.fetchLiterals();
        this.moveLiteralsToLiteralArray();
        this.base64EncodeLiterals();
        this.unicodeEscapeLiterals();
        return this.ast;
    };
    /**
     * @protected
     * @returns {void}
     * @memberof LiteralObfuscation
     */
    LiteralObfuscation.prototype.splitLiterals = function () {
        var _this = this;
        var count = 0;
        estraverse.replace(this.ast, {
            leave: function (node, parent) {
                if (node.type === 'Literal' && typeof node.value === 'string' && node.value !== 'use strict' && !transformations_1.isProperty(node, parent)) {
                    if (Math.random() <= _this.settings.splitChance) {
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
     * @memberof LiteralObfuscation
     */
    LiteralObfuscation.prototype.fetchLiterals = function () {
        var _this = this;
        estraverse.replace(this.ast, {
            enter: function (node, parent) {
                if (node.type === 'Literal' && typeof node.value === 'string' && node.value !== 'use strict' && !transformations_1.isProperty(node, parent)) {
                    if (Math.random() <= _this.settings.arrayChance) {
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
     * @memberof LiteralObfuscation
     */
    LiteralObfuscation.prototype.moveLiteralsToLiteralArray = function () {
        var _this = this;
        if (this.literals.length === 0) {
            return;
        }
        var count = 0;
        var shift = Math.floor(Math.random() * 100);
        var literalArrayIdentifier = identifiers_1.Identifiers.generate();
        var accessFuncIdentifier = identifiers_1.Identifiers.generate();
        estraverse.replace(this.ast, {
            enter: function (node, parent) {
                if (node.type === 'Literal' && typeof node.value === 'string' && node.value !== 'use strict' && !transformations_1.isProperty(node, parent)) {
                    // some literals might be omitted based on chance settings
                    if (_this.literals.includes(node.value)) {
                        count++;
                        var index = _this.literals.findIndex(function (literal) { return literal === node.value; });
                        return _this.generateAccessFuncCall(accessFuncIdentifier, index, shift);
                    }
                }
            }
        });
        this.ast.body.splice(insertPosition_1.InsertPosition.get(), 0, this.generateAccessFuncDeclaration(accessFuncIdentifier, literalArrayIdentifier, shift));
        this.ast.body.splice(insertPosition_1.InsertPosition.get(), 0, this.generateLiteralArray(literalArrayIdentifier));
        configuration_1.Verbose.log((count + " literals moved to literal array.").yellow);
    };
    LiteralObfuscation.prototype.base64EncodeLiterals = function () {
        var _this = this;
        var count = 0;
        estraverse.replace(this.ast, {
            leave: function (node, parent) {
                if (node.type === 'Literal' && typeof node.value === 'string' && node.value !== 'use strict' && !transformations_1.isProperty(node, parent)) {
                    if (Math.random() <= _this.settings.base64Chance && !/[^A-Za-z0-9 ]/.test(node.value)) {
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
    LiteralObfuscation.prototype.unicodeEscapeLiterals = function () {
        var _this = this;
        var count = 0;
        estraverse.replace(this.ast, {
            enter: function (node) {
                if (node.type === 'Literal') {
                    if (typeof node.value === 'string') {
                        if (node.value === 'use strict') {
                            return;
                        }
                        if (Math.random() <= _this.settings.unicodeChance) {
                            // @ts-ignore
                            node['x-verbatim-property'] = {
                                content: "'" + _this.unicodeEscape(node.value) + "'",
                                precedence: escodegen_1.default.Precedence.Primary
                            };
                            count++;
                            return node;
                        }
                    }
                }
            }
        });
        configuration_1.Verbose.log((count + " literals converted to unicode escape sequence").yellow);
    };
    /**
     * @protected
     * @param {string} ident
     * @returns {estree.VariableDeclaration}
     * @memberof LiteralObfuscation
     */
    LiteralObfuscation.prototype.generateLiteralArray = function (ident) {
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
     * @memberof LiteralObfuscation
     */
    LiteralObfuscation.prototype.generateAccessFuncDeclaration = function (accessFuncIdentifier, literalArrayIdentifier, shift) {
        var template = 'function <%= func %>(<%= index %>, <%= power %>){return <%= literalArray %>[<%= index %> - <%= shiftLiteral %> >> <%= power %>]}';
        return estemplate(template, {
            func: { type: 'Identifier', name: accessFuncIdentifier },
            index: { type: 'Identifier', name: identifiers_1.Identifiers.generate() },
            power: { type: 'Identifier', name: identifiers_1.Identifiers.generate() },
            literalArray: { type: 'Identifier', name: literalArrayIdentifier },
            shiftLiteral: { type: 'Literal', value: shift }
        }).body[0];
    };
    /**
     * @protected
     * @param {string} accessFuncIdentifier
     * @param {number} index
     * @returns {estree.CallExpression}
     * @memberof LiteralObfuscation
     */
    LiteralObfuscation.prototype.generateAccessFuncCall = function (accessFuncIdentifier, index, shift) {
        var power = Math.floor(Math.random() * 9) + 1;
        return {
            type: 'CallExpression',
            callee: {
                type: 'Identifier',
                name: accessFuncIdentifier
            },
            arguments: [
                {
                    type: 'Literal',
                    value: (index << power) + shift
                },
                {
                    type: 'Literal',
                    value: power
                }
            ]
        };
    };
    /**
     * https://gist.github.com/mathiasbynens/1243213
     * @protected
     * @param {string} str
     * @returns {string}
     * @memberof UnicodeLiteral
     */
    LiteralObfuscation.prototype.unicodeEscape = function (str) {
        return str.replace(/[\s\S]/g, function (character) {
            var escape = character.charCodeAt(0).toString(16);
            var longhand = escape.length > 2;
            return '\\' + (longhand ? 'u' : 'x') + ('0000' + escape).slice(longhand ? -4 : -2);
        });
    };
    return LiteralObfuscation;
}(transformations_1.BaseTransformation));
module.exports = LiteralObfuscation;
