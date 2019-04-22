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
var transformations_1 = require("../transformations");
var DeclarationsReordering = /** @class */ (function (_super) {
    __extends(DeclarationsReordering, _super);
    function DeclarationsReordering() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * @returns {estree.Program}
     * @memberof DeclarationsReordering
     */
    DeclarationsReordering.prototype.apply = function () {
        var _this = this;
        this.splitDeclarations();
        estraverse.replace(this.ast, {
            enter: function (node) {
                if (/Function/.test(node.type) || node.type === 'Program') {
                    var declarations = _this.removeDeclarations(node);
                    for (var _i = 0, declarations_1 = declarations; _i < declarations_1.length; _i++) {
                        var declaration = declarations_1[_i];
                        _this.placeDeclaration(node, declaration);
                    }
                }
            }
        });
        return this.ast;
    };
    /**
     * @protected
     * @memberof DeclarationsReordering
     */
    DeclarationsReordering.prototype.splitDeclarations = function () {
        estraverse.replace(this.ast, {
            enter: function (node) {
                if (node.type === 'Program' || node.type === 'BlockStatement') {
                    for (var i = 0; i < node.body.length; i++) {
                        if (node.body[i].type === 'VariableDeclaration') {
                            var declarationStatement = node.body[i];
                            if (declarationStatement.kind !== 'var') {
                                continue;
                            }
                            // remove original declaration
                            node.body.splice(i, 1);
                            for (var _i = 0, _a = declarationStatement.declarations.reverse(); _i < _a.length; _i++) {
                                var declaration = _a[_i];
                                if (declaration.init) {
                                    var assignment = {
                                        type: 'ExpressionStatement',
                                        expression: {
                                            type: 'AssignmentExpression',
                                            left: declaration.id,
                                            operator: '=',
                                            right: declaration.init
                                        }
                                    };
                                    node.body.splice(i, 0, assignment);
                                }
                                declaration.init = null;
                                var separatedDeclaration = {
                                    type: 'VariableDeclaration',
                                    declarations: [declaration],
                                    kind: declarationStatement.kind
                                };
                                node.body.splice(i, 0, separatedDeclaration);
                            }
                        }
                    }
                }
            }
        });
    };
    /**
     * @protected
     * @param {estree.Node} scope
     * @returns {estree.VariableDeclaration[]}
     * @memberof DeclarationsReordering
     */
    DeclarationsReordering.prototype.removeDeclarations = function (scope) {
        var declarations = [];
        estraverse.replace(scope, {
            enter: function (node, parent) {
                if (/Function/.test(node.type) && node !== scope) {
                    return estraverse.VisitorOption.Skip;
                }
                if (parent && ((parent.type === 'ForInStatement' && parent.left === node) || (parent.type === 'ForStatement' && parent.init === node))) {
                    return;
                }
                if (node.type === 'VariableDeclaration') {
                    declarations.push(node);
                    return estraverse.VisitorOption.Remove;
                }
            }
        });
        return declarations;
    };
    /**
     * @protected
     * @param {estree.Node} scope
     * @param {estree.VariableDeclaration} declaration
     * @memberof DeclarationsReordering
     */
    DeclarationsReordering.prototype.placeDeclaration = function (scope, declaration) {
        var _this = this;
        var placed = false;
        estraverse.replace(scope, {
            enter: function (node, parent) {
                if (/Function/.test(node.type) && scope !== node) {
                    return estraverse.VisitorOption.Skip;
                }
                if (node.type === 'BlockStatement') {
                    // Initial function block
                    // @ts-ignore
                    if (parent && /Function/.test(parent.type) && parent.body === node) {
                        _this.placeDeclarationDeeper(node, declaration);
                        placed = true;
                        return estraverse.VisitorOption.Break;
                    }
                    // Program scope blocks
                    if (Math.random() <= _this.settings.deeperBlockChance) {
                        placed = _this.placeDeclarationDeeper(node, declaration);
                        placed = true;
                        return estraverse.VisitorOption.Break;
                    }
                }
            }
        });
        if (!placed && scope.type === 'Program') {
            var index = Math.floor(Math.random() * (scope.body.length + 1));
            scope.body.splice(index, 0, declaration);
        }
    };
    /**
     * @protected
     * @param {estree.BlockStatement} block
     * @param {estree.VariableDeclaration} declaration
     * @returns {boolean}
     * @memberof DeclarationsReordering
     */
    DeclarationsReordering.prototype.placeDeclarationDeeper = function (block, declaration) {
        var _this = this;
        var placed = false;
        estraverse.replace(block, {
            enter: function (node) {
                if (/Function/.test(node.type)) {
                    return estraverse.VisitorOption.Skip;
                }
                if (node.type === 'BlockStatement' && node !== block && Math.random() <= _this.settings.deeperBlockChance) {
                    placed = _this.placeDeclarationDeeper(node, declaration);
                    if (placed) {
                        return estraverse.VisitorOption.Break;
                    }
                }
            }
        });
        if (!placed) {
            var index = Math.floor(Math.random() * (block.body.length + 1));
            block.body.splice(index, 0, declaration);
            placed = true;
        }
        return placed;
    };
    return DeclarationsReordering;
}(transformations_1.BaseTransformation));
module.exports = DeclarationsReordering;
//# sourceMappingURL=declarationsReordering.js.map