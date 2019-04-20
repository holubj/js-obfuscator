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
var escope = __importStar(require("escope"));
var estraverse = __importStar(require("estraverse"));
var configuration_1 = require("../configuration");
var identifiers_1 = require("../identifiers");
var transformations_1 = require("../transformations");
var IdentifierRenaming = /** @class */ (function (_super) {
    __extends(IdentifierRenaming, _super);
    function IdentifierRenaming() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.declaredIdentifiers = new Set();
        return _this;
    }
    /**
     * @returns {estree.Program}
     * @memberof UnicodeLiteral
     */
    IdentifierRenaming.prototype.apply = function () {
        var _this = this;
        var identifiers = new Map();
        var count = 0;
        var options = {};
        if (this.settings.renameGlobals) {
            options.optimistic = true;
        }
        var scopeManager = escope.analyze(this.ast, options);
        var currentScope = scopeManager.acquire(this.ast);
        estraverse.traverse(this.ast, {
            enter: function (node) {
                if (/Function/.test(node.type) || node.type === 'CatchClause') {
                    currentScope = scopeManager.acquire(node);
                }
            },
            leave: function (node) {
                if (/Function/.test(node.type) || node.type === 'CatchClause' || (_this.settings.renameGlobals && /Program/.test(node.type))) {
                    for (var _i = 0, _a = currentScope.variables; _i < _a.length; _i++) {
                        var variable = _a[_i];
                        if (variable.name === 'arguments') {
                            continue;
                        }
                        var newName = identifiers_1.Identifiers.generate();
                        count++;
                        for (var _b = 0, _c = variable.defs; _b < _c.length; _b++) {
                            var def = _c[_b];
                            if (def.node.id && (!('id' in node) || def.node.id !== node.id)) {
                                def.node.id.name = newName;
                            }
                        }
                        if ('params' in node) {
                            for (var _d = 0, _e = node.params; _d < _e.length; _d++) {
                                var param = _e[_d];
                                if (param.type === 'Identifier' && variable.name === param.name) {
                                    param.name = newName;
                                }
                            }
                        }
                        if (node.type === 'CatchClause' && node.param && node.param.type === 'Identifier' && node.param.name === variable.name) {
                            node.param.name = newName;
                        }
                        for (var _f = 0, _g = variable.references; _f < _g.length; _f++) {
                            var reference = _g[_f];
                            var identifier = identifiers.get(reference.identifier.start);
                            if (typeof identifier !== 'undefined') {
                                identifier.name = newName;
                            }
                        }
                    }
                    currentScope = currentScope.upper;
                }
                if (node.type === 'Identifier') {
                    identifiers.set(node.start, node);
                }
                return node;
            }
        });
        configuration_1.Verbose.log((count + " identifiers renamed").yellow);
        return this.ast;
    };
    return IdentifierRenaming;
}(transformations_1.BaseTransformation));
module.exports = IdentifierRenaming;
//# sourceMappingURL=identifierRenaming.js.map