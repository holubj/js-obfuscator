import * as estree from 'estree';
import { Identifiers } from '../identifiers';
import { InsertPosition } from '../insertPosition';
import { BaseTransformation } from '../transformations';

class DebuggerBreakpointLoop extends BaseTransformation {
  /**
   * @returns {estree.Program}
   * @memberof DebuggerBreakpointLoop
   */
  public apply(): estree.Program {
    const funcDeclIdent: string = Identifiers.generate();
    const loopFuncDecl: estree.FunctionDeclaration = {
      type: 'FunctionDeclaration',
      id: {
        type: 'Identifier',
        name: funcDeclIdent
      },
      params: [],
      body: {
        type: 'BlockStatement',
        body: [
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'CallExpression',
              callee: {
                type: 'Identifier',
                name: 'eval'
              },
              arguments: [
                {
                  type: 'Literal',
                  value: 'debugger'
                }
              ]
            }
          }
        ]
      }
    };

    const loopExpr: estree.ExpressionStatement = {
      type: 'ExpressionStatement',
      expression: {
        type: 'CallExpression',
        callee: {
          type: 'Identifier',
          name: 'setInterval'
        },
        arguments: [
          {
            type: 'Identifier',
            name: funcDeclIdent
          },
          {
            type: 'Literal',
            value: 500
          }
        ]
      }
    };

    this.ast.body.splice(InsertPosition.get(), 0, loopFuncDecl);
    this.ast.body.splice(InsertPosition.get(), 0, loopExpr);

    return this.ast;
  }
}

export = DebuggerBreakpointLoop;
