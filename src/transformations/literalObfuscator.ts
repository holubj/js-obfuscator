import escodegen from 'escodegen';
import * as estraverse from 'estraverse';
import * as estree from 'estree';
import shuffle from 'shuffle-array';
import { Verbose } from '../configuration';
import { Identifiers } from '../identifiers';
import { InsertPosition } from '../insertPosition';
import { BaseTransformation } from '../transformations';

class LiteralObfuscator extends BaseTransformation {
  protected literals: string[] = [];

  /**
   * @returns {estree.Program}
   * @memberof LiteralObfuscator
   */
  public apply(): estree.Program {
    let count: number = 0;

    const literalArrayIdentifier: string = Identifiers.generate();
    const accessFuncIdentifier: string = Identifiers.generate();
    this.fetchLiterals();
    this.literals = shuffle(this.literals);

    estraverse.replace(this.ast, {
      enter: (node: estree.Node): estree.Node | void => {
        if (node.type === 'Literal' && typeof node.value === 'string' && node.value !== 'use strict') {
          count++;
          const index: number = this.literals.findIndex((literal: string) => literal === node.value);
          return this.generateAccessFuncCall(accessFuncIdentifier, index);
        }
      }
    });

    this.ast.body.splice(InsertPosition.get(), 0, this.generateAccessFuncDeclaration(accessFuncIdentifier, literalArrayIdentifier));
    this.ast.body.splice(InsertPosition.get(), 0, this.generateLiteralArray(literalArrayIdentifier));

    Verbose.log(`${count} literals moved to literal array.`.yellow);

    return this.ast;
  }

  /**
   * @protected
   * @memberof LiteralObfuscator
   */
  protected fetchLiterals(): void {
    estraverse.replace(this.ast, {
      enter: (node: estree.Node): estree.Node | void => {
        if (node.type === 'Literal' && typeof node.value === 'string' && node.value !== 'use strict') {
          if (!this.literals.find((literal: string) => literal === node.value)) {
            this.literals.push(node.value);
          }
        }
      }
    });
  }

  /**
   * @protected
   * @param {string} ident
   * @returns {estree.VariableDeclaration}
   * @memberof LiteralObfuscator
   */
  protected generateLiteralArray(ident: string): estree.VariableDeclaration {
    const elements: estree.Literal[] = [];

    for (const literal of this.literals) {
      elements.push({
        type: 'Literal',
        value: literal
      });
    }

    return {
      type: 'VariableDeclaration',
      kind: 'var',
      declarations: [
        {
          type: 'VariableDeclarator',
          id: {
            type: 'Identifier',
            name: ident
          },
          init: {
            type: 'ArrayExpression',
            elements
          }
        }
      ]
    };
  }

  /**
   * @protected
   * @param {string} accessFuncIdentifier
   * @param {string} literalArrayIdentifier
   * @returns {estree.FunctionDeclaration}
   * @memberof LiteralObfuscator
   */
  protected generateAccessFuncDeclaration(accessFuncIdentifier: string, literalArrayIdentifier: string): estree.FunctionDeclaration {
    const argumentIdent: string = Identifiers.generate();

    return {
      type: 'FunctionDeclaration',
      id: { type: 'Identifier', name: accessFuncIdentifier },
      generator: false,
      params: [{ type: 'Identifier', name: argumentIdent }],
      body: {
        type: 'BlockStatement',
        body: [
          {
            type: 'ReturnStatement',
            argument: {
              type: 'MemberExpression',
              object: {
                type: 'Identifier',
                name: literalArrayIdentifier
              },
              property: {
                type: 'Identifier',
                name: argumentIdent
              },
              computed: true
            }
          }
        ]
      }
    };
  }

  /**
   * @protected
   * @param {string} accessFuncIdentifier
   * @param {number} index
   * @returns {estree.CallExpression}
   * @memberof LiteralObfuscator
   */
  protected generateAccessFuncCall(accessFuncIdentifier: string, index: number): estree.CallExpression {
    return {
      type: 'CallExpression',
      callee: {
        type: 'Identifier',
        name: accessFuncIdentifier
      },
      arguments: [
        {
          type: 'Literal',
          value: index
        }
      ]
    };
  }
}

export = LiteralObfuscator;
