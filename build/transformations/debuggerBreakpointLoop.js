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
var estemplate = require('estemplate');
var DebuggerBreakpointLoop = /** @class */ (function (_super) {
    __extends(DebuggerBreakpointLoop, _super);
    function DebuggerBreakpointLoop() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * @returns {estree.Program}
     * @memberof DebuggerBreakpointLoop
     */
    DebuggerBreakpointLoop.prototype.apply = function () {
        var funcDeclIdent = identifiers_1.Identifiers.generate();
        var funcTemplate = 'function <%= funcIdent %>(){eval("debugger");}';
        var loopFuncDecl = estemplate(funcTemplate, {
            funcIdent: { type: 'Identifier', name: funcDeclIdent }
        }).body[0];
        var loopTemplate = 'setInterval(<%= funcIdent %>, 500);';
        var loopExpr = estemplate(loopTemplate, {
            funcIdent: { type: 'Identifier', name: funcDeclIdent }
        }).body[0];
        this.ast.body.splice(insertPosition_1.InsertPosition.get(), 0, loopFuncDecl);
        this.ast.body.splice(insertPosition_1.InsertPosition.get(), 0, loopExpr);
        return this.ast;
    };
    return DebuggerBreakpointLoop;
}(transformations_1.BaseTransformation));
module.exports = DebuggerBreakpointLoop;
