import * as estree from 'estree';
import { Identifiers } from '../identifiers';
import { InsertPosition } from '../insertPosition';
import { BaseTransformation } from '../transformations';
const estemplate = require('estemplate');

class DebuggerBreakpointLoop extends BaseTransformation {
  /**
   * @returns {estree.Program}
   * @memberof DebuggerBreakpointLoop
   */
  public apply(): estree.Program {
    const funcDeclIdent: string = Identifiers.generate();

    const funcTemplate: string = 'function <%= funcIdent %>(){eval("debugger");}';
    const loopFuncDecl: estree.FunctionDeclaration = estemplate(funcTemplate, {
      funcIdent: { type: 'Identifier', name: funcDeclIdent }
    }).body[0] as estree.FunctionDeclaration;

    const loopTemplate: string = 'setInterval(<%= funcIdent %>, 500);';
    const loopExpr: estree.ExpressionStatement = estemplate(loopTemplate, {
      funcIdent: { type: 'Identifier', name: funcDeclIdent }
    }).body[0] as estree.ExpressionStatement;

    this.ast.body.splice(InsertPosition.get(), 0, loopFuncDecl);
    this.ast.body.splice(InsertPosition.get(), 0, loopExpr);

    return this.ast;
  }
}

export = DebuggerBreakpointLoop;
