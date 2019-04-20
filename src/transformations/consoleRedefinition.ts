import * as estraverse from 'estraverse';
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

    estraverse.replace(this.ast, {
      enter: (node: estree.Node): estree.Node | void => {
        if (
          node.type === 'CallExpression' &&
          node.callee.type === 'MemberExpression' &&
          node.callee.object.type === 'Identifier' &&
          node.callee.object.name === 'console' &&
          ((node.callee.property.type === 'Identifier' && node.callee.property.name === 'log') ||
            (node.callee.property.type === 'Literal' && node.callee.property.value === 'log'))
        ) {
          for (const argument of node.arguments) {
            if (this.containsAssignOrUpdateExpression(argument)) {
              return node;
            }
          }

          node.arguments = [];
          return node;
        }
      }
    });

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

  /**
   * @protected
   * @param {estree.Node} search
   * @returns {boolean}
   * @memberof ConsoleRedefinition
   */
  protected containsAssignOrUpdateExpression(search: estree.Node): boolean {
    let contains: boolean = false;

    estraverse.traverse(search, {
      enter: (node: estree.Node): void => {
        if (node.type === 'AssignmentExpression' || node.type === 'UpdateExpression' || node.type === 'CallExpression') {
          contains = true;
        }
      }
    });

    return contains;
  }
}

export = ConsoleRedefinition;
