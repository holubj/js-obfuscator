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
var escodegen_1 = __importDefault(require("escodegen"));
var estraverse = __importStar(require("estraverse"));
var configuration_1 = require("../configuration");
var transformations_1 = require("../transformations");
var UnicodeLiteral = /** @class */ (function (_super) {
    __extends(UnicodeLiteral, _super);
    function UnicodeLiteral() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * @returns {estree.Program}
     * @memberof UnicodeLiteral
     */
    UnicodeLiteral.prototype.apply = function () {
        var _this = this;
        var count = 0;
        estraverse.replace(this.ast, {
            enter: function (node) {
                if (node.type === 'Literal') {
                    if (typeof node.value === 'string') {
                        if (node.value === 'use strict') {
                            return;
                        }
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
        });
        configuration_1.Verbose.log((count + " literals converted to unicode escape sequence").yellow);
        return this.ast;
    };
    /**
     * @protected
     * @param {string} str
     * @returns {string}
     * @memberof UnicodeLiteral
     */
    UnicodeLiteral.prototype.unicodeEscape = function (str) {
        return str.replace(/[\s\S]/g, function (character) {
            var escape = character.charCodeAt(0).toString(16);
            var longhand = escape.length > 2;
            return '\\' + (longhand ? 'u' : 'x') + ('0000' + escape).slice(longhand ? -4 : -2);
        });
    };
    return UnicodeLiteral;
}(transformations_1.BaseTransformation));
module.exports = UnicodeLiteral;
//# sourceMappingURL=unicodeLiteral.js.map