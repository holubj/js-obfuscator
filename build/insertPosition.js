"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var InsertPosition = /** @class */ (function () {
    function InsertPosition() {
    }
    /**
     * @static
     * @param {estree.Program} ast
     * @returns {void}
     * @memberof InsertPosition
     */
    InsertPosition.init = function (ast) {
        if (0 in ast.body) {
            // @ts-ignore (missing 'directive' property for Statement in @types/estree)
            if (ast.body[0].directive === 'use strict') {
                this.position = 1;
                return;
            }
        }
        this.position = 0;
    };
    /**
     * @static
     * @returns {number}
     * @memberof InsertPosition
     */
    InsertPosition.get = function () {
        return this.position;
    };
    InsertPosition.position = 0;
    return InsertPosition;
}());
exports.InsertPosition = InsertPosition;
//# sourceMappingURL=insertPosition.js.map