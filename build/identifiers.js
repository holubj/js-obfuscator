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
var randomstring = __importStar(require("randomstring"));
var Identifiers = /** @class */ (function () {
    function Identifiers() {
    }
    /**
     * @static
     * @param {estree.Program} ast
     * @memberof Identifiers
     */
    Identifiers.init = function (ast) {
        var _this = this;
        estraverse.traverse(ast, {
            enter: function (node) {
                if (node.type === 'Identifier') {
                    _this.usedIdentifiers.add(node.name);
                }
            }
        });
    };
    /**
     * @static
     * @returns {string}
     * @memberof Identifiers
     */
    Identifiers.generate = function () {
        var identifier;
        do {
            identifier = '_0x' + randomstring.generate({ length: 8, charset: 'hex' });
        } while (this.usedIdentifiers.has(identifier));
        this.usedIdentifiers.add(identifier);
        return identifier;
    };
    Identifiers.usedIdentifiers = new Set();
    return Identifiers;
}());
exports.Identifiers = Identifiers;
