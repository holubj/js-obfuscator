"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var estraverse = __importStar(require("estraverse"));
/**
 * @export
 * @abstract
 * @class BaseTransformation
 */
var BaseTransformation = /** @class */ (function () {
    function BaseTransformation(ast, settings) {
        if (settings === void 0) { settings = {}; }
        this.ast = ast;
        this.settings = settings;
    }
    return BaseTransformation;
}());
exports.BaseTransformation = BaseTransformation;
/**
 * @export
 * @param {estree.Program} ast
 * @returns {boolean}
 */
function canBeObfuscated(ast) {
    var result = true;
    estraverse.traverse(ast, {
        enter: function (node) {
            if ((node.type === 'Identifier' && node.name === 'eval') || node.type === 'WithStatement') {
                result = false;
            }
        }
    });
    return result;
}
exports.canBeObfuscated = canBeObfuscated;
exports.forbiddenEvalStatements = [
    'ReturnStatement',
    'BreakStatement',
    'ContinueStatement',
    'VariableDeclaration',
    'FunctionDeclaration',
    'FunctionExpression',
    'ArrowFunctionExpression'
];
exports.loopStatements = ['ForStatement', 'ForOfStatement', 'ForInStatement', 'WhileStatement', 'DoWhileStatement'];
/**
 * @export
 * @param {estree.Node} node
 * @param {(estree.Node | null)} parent
 * @returns {boolean}
 */
function isProperty(node, parent) {
    if (parent === null) {
        return false;
    }
    else {
        return parent.type === 'Property' && parent.key === node;
    }
}
exports.isProperty = isProperty;
