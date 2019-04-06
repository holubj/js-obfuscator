import * as estree from 'estree';
import { Identifiers } from '../identifiers';
import { InsertPosition } from '../insertPosition';
import { BaseTransformation } from '../transformations';

class ConsoleRedefinition extends BaseTransformation {
  public readonly consoleMethods: string[] = ['log', 'warn', 'debug', 'info', 'error', 'exception', 'trace'];

  /**
   * @returns {estree.Program}
   * @memberof ConsoleRedefinition
   */
  public apply(): estree.Program {
    const statements: estree.Statement[] = [];

    statements.push(this.generateConsoleDeclaration());

    const dummyFuncIdentifier: string = Identifiers.generate();
    statements.push(this.generateDummyFunction(dummyFuncIdentifier));

    for (const method of this.consoleMethods) {
      statements.push(this.generateAssignment(method, dummyFuncIdentifier));
    }

    this.ast.body.splice(InsertPosition.get(), 0, ...statements);

    return this.ast;
  }

  /**
   * @protected
   * @returns {estree.VariableDeclaration}
   * @memberof ConsoleRedefinition
   */
  protected generateConsoleDeclaration(): estree.VariableDeclaration {
    return {
      type: 'VariableDeclaration',
      declarations: [
        {
          type: 'VariableDeclarator',
          id: { type: 'Identifier', name: 'console' },
          init: { type: 'ObjectExpression', properties: [] }
        }
      ],
      kind: 'var'
    };
  }

  /**
   * @protected
   * @param {string} identifier
   * @returns {estree.VariableDeclaration}
   * @memberof ConsoleRedefinition
   */
  protected generateDummyFunction(identifier: string): estree.VariableDeclaration {
    return {
      type: 'VariableDeclaration',
      declarations: [
        {
          type: 'VariableDeclarator',
          id: { type: 'Identifier', name: identifier },
          init: {
            type: 'FunctionExpression',
            id: null,
            params: [],
            body: { type: 'BlockStatement', body: [] },
            generator: false
          }
        }
      ],
      kind: 'var'
    };
  }

  /**
   * @protected
   * @param {string} method
   * @param {string} funcIdentifier
   * @returns {estree.ExpressionStatement}
   * @memberof ConsoleRedefinition
   */
  protected generateAssignment(method: string, funcIdentifier: string): estree.ExpressionStatement {
    return {
      type: 'ExpressionStatement',
      expression: {
        type: 'AssignmentExpression',
        operator: '=',
        left: {
          type: 'MemberExpression',
          object: { type: 'Identifier', name: 'console' },
          property: { type: 'Identifier', name: method },
          computed: false
        },
        right: { type: 'Identifier', name: funcIdentifier }
      }
    };
  }
}

export = ConsoleRedefinition;
