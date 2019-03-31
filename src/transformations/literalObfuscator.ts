import 'colors';
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
    this.splitLiterals();
    this.fetchLiterals();
    this.moveLiteralsToLiteralArray();
    this.base64EncodeLiterals();

    return this.ast;
  }

  /**
   * @protected
   * @returns {void}
   * @memberof LiteralObfuscator
   */
  protected splitLiterals(): void {
    let count: number = 0;

    estraverse.replace(this.ast, {
      leave: (node: estree.Node): estree.Node | void => {
        if (node.type === 'Literal' && typeof node.value === 'string' && node.value !== 'use strict') {
          if (Math.random() <= this.settings.splitThreshold) {
            if (node.value.length >= 2) {
              count++;
              const cut: number = Math.floor(Math.random() * (node.value.length - 1)) + 1;

              return {
                type: 'BinaryExpression',
                operator: '+',
                left: {
                  type: 'Literal',
                  value: node.value.substring(0, cut)
                },
                right: {
                  type: 'Literal',
                  value: node.value.substring(cut)
                }
              };
            }
          }
        }
      }
    });

    Verbose.log(`${count} literals splitted.`.yellow);
  }

  /**
   * @protected
   * @memberof LiteralObfuscator
   */
  protected fetchLiterals(): void {
    estraverse.replace(this.ast, {
      enter: (node: estree.Node): estree.Node | void => {
        if (node.type === 'Literal' && typeof node.value === 'string' && node.value !== 'use strict') {
          if (Math.random() <= this.settings.arrayThreshold) {
            if (!this.literals.find((literal: string) => literal === node.value)) {
              this.literals.push(node.value);
            }
          }
        }
      }
    });

    this.literals = shuffle(this.literals);
  }

  /**
   * @protected
   * @memberof LiteralObfuscator
   */
  protected moveLiteralsToLiteralArray(): void {
    let count: number = 0;
    const shift: number = Math.floor(Math.random() * 100);
    const literalArrayIdentifier: string = Identifiers.generate();
    const accessFuncIdentifier: string = Identifiers.generate();

    estraverse.replace(this.ast, {
      enter: (node: estree.Node): estree.Node | void => {
        if (node.type === 'Literal' && typeof node.value === 'string' && node.value !== 'use strict') {
          // some literals might be omitted based on threshold settings
          if (this.literals.indexOf(node.value) > -1) {
            count++;
            const index: number = this.literals.findIndex((literal: string) => literal === node.value);
            return this.generateAccessFuncCall(accessFuncIdentifier, index + shift);
          }
        }
      }
    });

    this.ast.body.splice(InsertPosition.get(), 0, this.generateAccessFuncDeclaration(accessFuncIdentifier, literalArrayIdentifier, shift));
    this.ast.body.splice(InsertPosition.get(), 0, this.generateLiteralArray(literalArrayIdentifier));

    Verbose.log(`${count} literals moved to literal array.`.yellow);
  }

  protected base64EncodeLiterals(): void {
    let count: number = 0;
    estraverse.replace(this.ast, {
      leave: (node: estree.Node): estree.Node | void => {
        if (node.type === 'Literal' && typeof node.value === 'string' && node.value !== 'use strict') {
          if (Math.random() <= this.settings.base64Threshold && !/[^A-Za-z0-9 ]/.test(node.value)) {
            count++;

            return {
              type: 'CallExpression',
              callee: {
                type: 'Identifier',
                name: 'atob'
              },
              arguments: [
                {
                  type: 'Literal',
                  value: Buffer.from(node.value, 'binary').toString('base64')
                }
              ]
            };
          }
        }
      }
    });

    Verbose.log(`${count} literals encoded to base64.`.yellow);
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
  protected generateAccessFuncDeclaration(accessFuncIdentifier: string, literalArrayIdentifier: string, shift: number): estree.FunctionDeclaration {
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
                type: 'BinaryExpression',
                operator: '-',
                left: { type: 'Identifier', name: argumentIdent },
                right: { type: 'Literal', value: shift }
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
