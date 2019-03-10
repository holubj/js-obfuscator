import 'colors';
import * as estraverse from 'estraverse';
import * as estree from 'estree';
import { Verbose } from '../configuration';
import { Identifiers } from '../identifiers';
import { InsertPosition } from '../insertPosition';
import { BaseTransformation } from '../transformations';

/**
 * Unary Operators "-" | "+" | "!" | "~" | "typeof" | "void"
 * Binary Operators "==" | "!=" | "===" | "!==" | "<" | "<=" | ">" | ">=" | "<<" | ">>" | ">>>" | "+" | "-" | "*" | "/" | "%" | "**" | "|" | "^" | "&" | "in" | "instanceof"
 * Assignment Operators (only when left side is identifier) +=" | "-=" | "*=" | "/=" | "%=" | "**=" | "<<=" | ">>=" | ">>>=" | "|=" | "^=" | "&="
 *
 * @class OperatorOutlining
 * @extends {BaseTransformation}
 */
class OperatorOutlining extends BaseTransformation {
  protected readonly unaryPrefix: string = 'unary ';
  protected funcIdentifiers: { [operator: string]: string } = {};
  protected usedIdentifiers: Set<string> = new Set<string>();
  protected doLookup: boolean = true;

  /**
   * @returns {estree.Program}
   * @memberof OperatorOutlining
   */
  public apply(): estree.Program {
    if (this.settings.unaryOperators) {
      this.outlineUnaryOperators();
    }
    if (this.settings.assigmentOperators) {
      this.replaceAssignmentOperators();
    }
    if (this.settings.binaryOperators) {
      this.outlineBinaryOperators();
    }

    return this.ast;
  }

  /**
   * @protected
   * @param {(estree.UnaryExpression | estree.BinaryExpression)} node
   * @returns {string}
   * @memberof OperatorOutlining
   */
  protected getOperatorFuncIdentifier(node: estree.UnaryExpression | estree.BinaryExpression): string {
    let operator: string = node.operator;
    if (node.type === 'UnaryExpression') {
      operator = this.unaryPrefix + operator;
    }

    if (!(operator in this.funcIdentifiers)) {
      const funcIdentifier: string = Identifiers.generate();
      this.funcIdentifiers[operator] = funcIdentifier;

      if (node.type === 'UnaryExpression') {
        this.registerUnaryOperatorFunc(node, funcIdentifier);
      } else {
        this.registerBinaryOperatorFunc(node, funcIdentifier);
      }
    }
    return this.funcIdentifiers[operator];
  }

  /**
   * @protected
   * @param {string} operatorKey
   * @param {string} generatedIdentifier
   * @param {estree.FunctionDeclaration} operatorFunc
   * @memberof OperatorOutlining
   */
  protected registerFunc(operatorKey: string, generatedIdentifier: string, operatorFunc: estree.FunctionDeclaration): void {
    this.funcIdentifiers[operatorKey] = generatedIdentifier;
    this.ast.body.splice(InsertPosition.get(), 0, operatorFunc);
    Verbose.log(`  Operator '${operatorKey}' outlined`.yellow);
  }

  /**
   * @protected
   * @memberof OperatorOutlining
   */
  protected outlineUnaryOperators(): void {
    estraverse.replace(this.ast, {
      enter: (node: estree.Node): estree.Node | void => {
        if (node.type === 'UnaryExpression' && node.operator !== 'delete') {
          const unaryExpressionNode: estree.UnaryExpression = node as estree.UnaryExpression;

          const callExpression: estree.CallExpression = {
            type: 'CallExpression',
            callee: {
              type: 'Identifier',
              name: this.getOperatorFuncIdentifier(unaryExpressionNode)
            },
            arguments: [unaryExpressionNode.argument]
          };

          return callExpression;
        }
      }
    });
  }

  /**
   * @protected
   * @param {estree.UnaryExpression} node
   * @param {string} funcIdentifier
   * @memberof OperatorOutlining
   */
  protected registerUnaryOperatorFunc(node: estree.UnaryExpression, funcIdentifier: string): void {
    const value: string = 'value';

    const operatorFunc: estree.FunctionDeclaration = {
      type: 'FunctionDeclaration',
      id: { type: 'Identifier', name: funcIdentifier },
      generator: false,
      params: [{ type: 'Identifier', name: value }],
      body: {
        type: 'BlockStatement',
        body: [
          {
            type: 'ReturnStatement',
            argument: {
              type: node.type,
              operator: node.operator,
              prefix: node.prefix,
              argument: { type: 'Identifier', name: value }
            }
          }
        ]
      }
    };

    this.registerFunc(this.unaryPrefix + node.operator, funcIdentifier, operatorFunc);
  }

  /**
   * @protected
   * @memberof OperatorOutlining
   */
  protected replaceAssignmentOperators(): void {
    estraverse.replace(this.ast, {
      enter: (node: estree.Node): estree.Node | void => {
        if (node.type === 'AssignmentExpression') {
          const assignmentExpression: estree.AssignmentExpression = node as estree.AssignmentExpression;

          if (assignmentExpression.operator !== '=' && assignmentExpression.left.type === 'Identifier') {
            const replacement: estree.AssignmentExpression = {
              type: 'AssignmentExpression',
              operator: '=',
              left: assignmentExpression.left,
              right: {
                type: 'BinaryExpression',
                operator: '+',
                left: assignmentExpression.left,
                right: assignmentExpression.right
              }
            };

            return replacement;
          }
        }
      }
    });
  }

  /**
   * @protected
   * @memberof OperatorOutlining
   */
  protected outlineBinaryOperators(): void {
    estraverse.replace(this.ast, {
      enter: (node: estree.Node): estree.Node | void => {
        if (node.type === 'BinaryExpression') {
          const binaryExpressionNode: estree.BinaryExpression = node as estree.BinaryExpression;

          const callExpression: estree.CallExpression = {
            type: 'CallExpression',
            callee: {
              type: 'Identifier',
              name: this.getOperatorFuncIdentifier(binaryExpressionNode)
            },
            arguments: [binaryExpressionNode.left, binaryExpressionNode.right]
          };

          return callExpression;
        }
      }
    });
  }

  /**
   * @protected
   * @param {estree.BinaryExpression} node
   * @param {string} funcIdentifier
   * @memberof OperatorOutlining
   */
  protected registerBinaryOperatorFunc(node: estree.BinaryExpression, funcIdentifier: string): void {
    const leftIdentifier: string = Identifiers.generate();
    const rightIdentifier: string = Identifiers.generate();

    const operatorFunc: estree.FunctionDeclaration = {
      type: 'FunctionDeclaration',
      id: { type: 'Identifier', name: funcIdentifier },
      generator: false,
      params: [{ type: 'Identifier', name: leftIdentifier }, { type: 'Identifier', name: rightIdentifier }],
      body: {
        type: 'BlockStatement',
        body: [
          {
            type: 'ReturnStatement',
            argument: {
              type: node.type,
              operator: node.operator,
              left: { type: 'Identifier', name: leftIdentifier },
              right: { type: 'Identifier', name: rightIdentifier }
            }
          }
        ]
      }
    };

    this.registerFunc(node.operator, funcIdentifier, operatorFunc);
  }
}

export = OperatorOutlining;
