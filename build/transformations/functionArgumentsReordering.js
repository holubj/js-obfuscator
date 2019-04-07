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
var shuffle_array_1 = __importDefault(require("shuffle-array"));
var configuration_1 = require("../configuration");
var transformations_1 = require("../transformations");
var FunctionArgumentReordering = /** @class */ (function (_super) {
    __extends(FunctionArgumentReordering, _super);
    function FunctionArgumentReordering() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * @returns {estree.Program}
     * @memberof FunctionDefinitonReordering
     */
    FunctionArgumentReordering.prototype.apply = function () {
        var _this = this;
        estraverse.traverse(this.ast, {
            enter: function (node) {
                if (node.type === 'FunctionDeclaration' && node.id !== null) {
                    if (_this.isSuitableFunc(node, node.id.name)) {
                        _this.reorderArguments(node.id.name, node.params.length);
                        configuration_1.Verbose.log(("Arguments of function '" + node.id.name + "' reordered").yellow);
                    }
                }
            }
        });
        return this.ast;
    };
    /**
     * @protected
     * @param {string} funcIdent
     * @param {number} paramsCount
     * @memberof FunctionArgumentReordering
     */
    FunctionArgumentReordering.prototype.reorderArguments = function (funcIdent, paramsCount) {
        var newOrder = Array.from({ length: paramsCount }, function (x, i) { return i; });
        newOrder = shuffle_array_1.default(newOrder);
        estraverse.replace(this.ast, {
            enter: function (node) {
                if (node.type === 'FunctionDeclaration' && node.id !== null && node.id.name === funcIdent) {
                    var newParams = [];
                    for (var _i = 0, newOrder_1 = newOrder; _i < newOrder_1.length; _i++) {
                        var orderIndex = newOrder_1[_i];
                        newParams.push(node.params[orderIndex]);
                    }
                    node.params = newParams;
                }
                else if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name === funcIdent) {
                    var newArguments = [];
                    for (var _a = 0, newOrder_2 = newOrder; _a < newOrder_2.length; _a++) {
                        var orderIndex = newOrder_2[_a];
                        newArguments.push(node.arguments[orderIndex]);
                    }
                    node.arguments = newArguments;
                }
                return node;
            }
        });
    };
    /**
     * @protected
     * @param {estree.FunctionDeclaration} funcDeclaration
     * @param {string} funcIdent
     * @returns {boolean}
     * @memberof FunctionArgumentReordering
     */
    FunctionArgumentReordering.prototype.isSuitableFunc = function (funcDeclaration, funcIdent) {
        return (funcDeclaration.params.length > 1 &&
            this.isUniqueFuncDeclaration(funcIdent) &&
            !this.usesArgumentsIdent(funcDeclaration) &&
            this.haveSimpleCalls(funcIdent, funcDeclaration.params.length));
    };
    /**
     * @protected
     * @param {string} funcIdent
     * @returns {boolean}
     * @memberof FunctionArgumentReordering
     */
    FunctionArgumentReordering.prototype.isUniqueFuncDeclaration = function (funcIdent) {
        var count = 0;
        estraverse.traverse(this.ast, {
            enter: function (node) {
                if (node.type === 'FunctionDeclaration' && node.id !== null && node.id.name === funcIdent) {
                    count++;
                }
            }
        });
        return count === 1;
    };
    /**
     * @protected
     * @param {estree.FunctionDeclaration} funcDeclaration
     * @returns {boolean}
     * @memberof FunctionArgumentReordering
     */
    FunctionArgumentReordering.prototype.usesArgumentsIdent = function (funcDeclaration) {
        var argumentsUsed = false;
        estraverse.traverse(funcDeclaration, {
            enter: function (node) {
                if (node.type === 'Identifier' && node.name === 'arguments') {
                    argumentsUsed = true;
                }
            }
        });
        return argumentsUsed;
    };
    /**
     * @protected
     * @param {string} funcIdent
     * @param {number} paramsCount
     * @returns {boolean}
     * @memberof FunctionArgumentReordering
     */
    FunctionArgumentReordering.prototype.haveSimpleCalls = function (funcIdent, paramsCount) {
        var _this = this;
        var simpleCalls = true;
        estraverse.traverse(this.ast, {
            enter: function (node, parent) {
                if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name === funcIdent) {
                    if (node.arguments.length !== paramsCount) {
                        simpleCalls = false;
                    }
                    for (var _i = 0, _a = node.arguments; _i < _a.length; _i++) {
                        var argument = _a[_i];
                        if (_this.containsAssignOrUpdateExpression(argument)) {
                            simpleCalls = false;
                        }
                    }
                }
                if (node.type === 'Identifier' && node.name === funcIdent) {
                    if (!parent ||
                        (!(parent.type === 'CallExpression' && parent.callee.type === 'Identifier' && parent.callee.name === funcIdent) &&
                            parent.type !== 'FunctionDeclaration')) {
                        simpleCalls = false;
                    }
                }
            }
        });
        return simpleCalls;
    };
    /**
     * @protected
     * @param {estree.Node} search
     * @returns {boolean}
     * @memberof FunctionArgumentReordering
     */
    FunctionArgumentReordering.prototype.containsAssignOrUpdateExpression = function (search) {
        var contains = false;
        estraverse.traverse(search, {
            enter: function (node) {
                if (node.type === 'AssignmentExpression' || node.type === 'UpdateExpression' || node.type === 'CallExpression') {
                    contains = true;
                }
            }
        });
        return contains;
    };
    return FunctionArgumentReordering;
}(transformations_1.BaseTransformation));
module.exports = FunctionArgumentReordering;
//# sourceMappingURL=functionArgumentsReordering.js.map