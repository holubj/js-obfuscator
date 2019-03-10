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
var identifiers_1 = require("../identifiers");
var insertPosition_1 = require("../insertPosition");
var transformations_1 = require("../transformations");
var ConsoleReplacement = /** @class */ (function (_super) {
    __extends(ConsoleReplacement, _super);
    function ConsoleReplacement() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.consoleMethods = ['log', 'warn', 'debug', 'info', 'error', 'exception', 'trace'];
        return _this;
    }
    /**
     * @returns {estree.Program}
     * @memberof ConsoleReplacement
     */
    ConsoleReplacement.prototype.apply = function () {
        var _a;
        var statements = [];
        statements.push(this.generateConsoleDeclaration());
        var dummyFuncIdentifier = identifiers_1.Identifiers.generate();
        statements.push(this.generateDummyFunction(dummyFuncIdentifier));
        for (var _i = 0, _b = this.consoleMethods; _i < _b.length; _i++) {
            var method = _b[_i];
            statements.push(this.generateAssignment(method, dummyFuncIdentifier));
        }
        (_a = this.ast.body).splice.apply(_a, [insertPosition_1.InsertPosition.get(), 0].concat(statements));
        return this.ast;
    };
    /**
     * @protected
     * @returns {estree.VariableDeclaration}
     * @memberof ConsoleReplacement
     */
    ConsoleReplacement.prototype.generateConsoleDeclaration = function () {
        return {
            type: 'VariableDeclaration',
            declarations: [
                {
                    type: 'VariableDeclarator',
                    id: { type: 'Identifier', name: 'console' },
                    init: { type: 'ObjectExpression', properties: [] }
                }
            ],
            kind: 'var'
        };
    };
    /**
     * @protected
     * @param {string} identifier
     * @returns {estree.VariableDeclaration}
     * @memberof ConsoleReplacement
     */
    ConsoleReplacement.prototype.generateDummyFunction = function (identifier) {
        return {
            type: 'VariableDeclaration',
            declarations: [
                {
                    type: 'VariableDeclarator',
                    id: { type: 'Identifier', name: identifier },
                    init: {
                        type: 'FunctionExpression',
                        id: null,
                        params: [],
                        body: { type: 'BlockStatement', body: [] },
                        generator: false
                    }
                }
            ],
            kind: 'var'
        };
    };
    /**
     * @protected
     * @param {string} method
     * @param {string} funcIdentifier
     * @returns {estree.ExpressionStatement}
     * @memberof ConsoleReplacement
     */
    ConsoleReplacement.prototype.generateAssignment = function (method, funcIdentifier) {
        return {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'MemberExpression',
                    object: { type: 'Identifier', name: 'console' },
                    property: { type: 'Identifier', name: method },
                    computed: false
                },
                right: { type: 'Identifier', name: funcIdentifier }
            }
        };
    };
    return ConsoleReplacement;
}(transformations_1.BaseTransformation));
module.exports = ConsoleReplacement;
//# sourceMappingURL=consoleReplacement.js.map