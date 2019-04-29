import 'colors';
import escodegen from 'escodegen';
import * as estraverse from 'estraverse';
import * as estree from 'estree';
import shuffle from 'shuffle-array';
import { Verbose } from '../configuration';
import { Identifiers } from '../identifiers';
import { InsertPosition } from '../insertPosition';
import { BaseTransformation, isProperty } from '../transformations';
const estemplate = require('estemplate');

class LiteralObfuscation extends BaseTransformation {
  protected literals: string[] = [];

  /**
   * @returns {estree.Program}
   * @memberof LiteralObfuscation
   */
  public apply(): estree.Program {
    this.splitLiterals();
    this.fetchLiterals();
    this.moveLiteralsToLiteralArray();
    this.base64EncodeLiterals();
    this.unicodeEscapeLiterals();

    return this.ast;
  }

  /**
   * @protected
   * @returns {void}
   * @memberof LiteralObfuscation
   */
  protected splitLiterals(): void {
    let count: number = 0;

    estraverse.replace(this.ast, {
      leave: (node: estree.Node, parent: estree.Node | null): estree.Node | void => {
        if (node.type === 'Literal' && typeof node.value === 'string' && node.value !== 'use strict' && !isProperty(node, parent)) {
          if (Math.random() <= this.settings.splitChance) {
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
   * @memberof LiteralObfuscation
   */
  protected fetchLiterals(): void {
    estraverse.replace(this.ast, {
      enter: (node: estree.Node, parent: estree.Node | null): estree.Node | void => {
        if (node.type === 'Literal' && typeof node.value === 'string' && node.value !== 'use strict' && !isProperty(node, parent)) {
          if (Math.random() <= this.settings.arrayChance) {
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
   * @memberof LiteralObfuscation
   */
  protected moveLiteralsToLiteralArray(): void {
    if (this.literals.length === 0) {
      return;
    }

    let count: number = 0;
    const shift: number = Math.floor(Math.random() * 100);
    const literalArrayIdentifier: string = Identifiers.generate();
    const accessFuncIdentifier: string = Identifiers.generate();

    estraverse.replace(this.ast, {
      enter: (node: estree.Node, parent: estree.Node | null): estree.Node | void => {
        if (node.type === 'Literal' && typeof node.value === 'string' && node.value !== 'use strict' && !isProperty(node, parent)) {
          // some literals might be omitted based on chance settings
          if (this.literals.includes(node.value)) {
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
      leave: (node: estree.Node, parent: estree.Node | null): estree.Node | void => {
        if (node.type === 'Literal' && typeof node.value === 'string' && node.value !== 'use strict' && !isProperty(node, parent)) {
          if (Math.random() <= this.settings.base64Chance && !/[^A-Za-z0-9 ]/.test(node.value)) {
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

  protected unicodeEscapeLiterals(): void {
    let count: number = 0;

    estraverse.replace(this.ast, {
      enter: (node: estree.Node): estree.Node | void => {
        if (node.type === 'Literal') {
          if (typeof node.value === 'string') {
            if (node.value === 'use strict') {
              return;
            }
            if (Math.random() <= this.settings.unicodeChance) {
              // @ts-ignore
              node['x-verbatim-property'] = {
                content: "'" + this.unicodeEscape(node.value) + "'",
                precedence: escodegen.Precedence.Primary
              };
              count++;
              return node;
            }
          }
        }
      }
    });

    Verbose.log(`${count} literals converted to unicode escape sequence`.yellow);
  }

  /**
   * @protected
   * @param {string} ident
   * @returns {estree.VariableDeclaration}
   * @memberof LiteralObfuscation
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
   * @memberof LiteralObfuscation
   */
  protected generateAccessFuncDeclaration(accessFuncIdentifier: string, literalArrayIdentifier: string, shift: number): estree.FunctionDeclaration {
    const template: string = 'function <%= func %>(<%= argument %>){return <%= literalArray %>[<%= argument %> - <%= shiftLiteral %>]}';

    return estemplate(template, {
      func: { type: 'Identifier', name: accessFuncIdentifier },
      argument: { type: 'Identifier', name: Identifiers.generate() },
      literalArray: { type: 'Identifier', name: literalArrayIdentifier },
      shiftLiteral: { type: 'Literal', value: shift }
    }).body[0] as estree.FunctionDeclaration;
  }

  /**
   * @protected
   * @param {string} accessFuncIdentifier
   * @param {number} index
   * @returns {estree.CallExpression}
   * @memberof LiteralObfuscation
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

  /**
   * https://gist.github.com/mathiasbynens/1243213
   * @protected
   * @param {string} str
   * @returns {string}
   * @memberof UnicodeLiteral
   */
  protected unicodeEscape(str: string): string {
    return str.replace(/[\s\S]/g, (character: string) => {
      const escape: string = character.charCodeAt(0).toString(16);
      const longhand: boolean = escape.length > 2;
      return '\\' + (longhand ? 'u' : 'x') + ('0000' + escape).slice(longhand ? -4 : -2);
    });
  }
}

export = LiteralObfuscation;
