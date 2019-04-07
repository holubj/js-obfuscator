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
var configuration_1 = require("../configuration");
var transformations_1 = require("../transformations");
var ComputedMember = /** @class */ (function (_super) {
    __extends(ComputedMember, _super);
    function ComputedMember() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * @returns {estree.Program}
     * @memberof ComputedMember
     */
    ComputedMember.prototype.apply = function () {
        var count = 0;
        estraverse.replace(this.ast, {
            enter: function (node, parent) {
                if (node.type === 'Identifier') {
                    if (parent && parent.type === 'MemberExpression' && parent.property === node && parent.computed === false) {
                        parent.computed = true;
                        count++;
                        return {
                            type: 'Literal',
                            value: node.name
                        };
                    }
                }
            }
        });
        configuration_1.Verbose.log((count + " member expresssions converted to computed").yellow);
        return this.ast;
    };
    return ComputedMember;
}(transformations_1.BaseTransformation));
module.exports = ComputedMember;
//# sourceMappingURL=computedMember.js.map