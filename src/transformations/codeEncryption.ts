import 'colors';
import * as estraverse from 'estraverse';
import * as estree from 'estree';
import shuffle from 'shuffle-array';
import { CodeGeneration } from '../codeGeneration';
import { Verbose } from '../configuration';
import { Identifiers } from '../identifiers';
import { BaseTransformation } from '../transformations';
import ExpressionObfuscation from './expressionObfuscation';
import LiteralObfuscation from './literalObfuscation';
import NumberObufscation from './numberObfuscation';
import UnicodeLiteral from './unicodeLiteral';

class CodeEncryption extends BaseTransformation {
  protected readonly forbiddenStatements: string[] = ['ReturnStatement', 'BreakStatement', 'ContinueStatement', 'VariableDeclaration', 'FunctionDeclaration'];

  protected sealedTopLevelFunctions: string[] = [];

  /**
   * @returns {estree.Program}
   * @memberof CodeEncryption
   */
  public apply(): estree.Program {
    let count: number = 0;

    let currentTopLevelFunction: string = '';

    estraverse.replace(this.ast, {
      enter: (node: estree.Node): void => {
        if (currentTopLevelFunction === '' && node.type === 'FunctionDeclaration' && node.id !== null) {
          currentTopLevelFunction = node.id.name;
        }
      },
      leave: (node: estree.Node): estree.Node | void => {
        if (node.type === 'FunctionDeclaration' && node.id !== null && node.id.name === currentTopLevelFunction) {
          currentTopLevelFunction = '';
        } else if (node.type === 'BlockStatement') {
          if (!this.isSuitableBlock(node) || this.sealedTopLevelFunctions.includes(currentTopLevelFunction)) {
            return;
          }
          if (Math.random() <= this.settings.threshold) {
            const keyFuncDecl: estree.FunctionDeclaration | undefined = this.findSuitableFunction(currentTopLevelFunction);
            if (keyFuncDecl === undefined) {
              return;
            }

            count++;

            const statements: estree.Statement[] = [];

            const keyIdent: string = Identifiers.generate();
            const clientKeyDecl: estree.VariableDeclaration = this.generateClientKeyDecl(keyIdent, keyFuncDecl);
            const blockCodeDecryptExpr: estree.CallExpression = this.generateBlockCodeDecryptExpr(keyFuncDecl, node, keyIdent);
            const tryCatchExpr: estree.TryStatement = this.generateTryCatchExpression(blockCodeDecryptExpr);

            statements.push(clientKeyDecl);
            statements.push(tryCatchExpr);

            const block: estree.BlockStatement = {
              type: 'BlockStatement',
              body: statements
            };

            const program: estree.Program = {
              type: 'Program',
              body: [block],
              sourceType: 'module'
            };

            const originalVerboseState: boolean = Verbose.isEnabled;
            Verbose.isEnabled = false;

            new LiteralObfuscation(program, {
              splitThreshold: 0.8,
              arrayThreshold: 0,
              base64Threshold: 0.8
            }).apply();

            new UnicodeLiteral(program).apply();

            new ExpressionObfuscation(program, {
              booleanThreshold: 0.8,
              undefinedThreshold: 0.8
            }).apply();

            new NumberObufscation(program, {
              threshold: 0.5
            }).apply();

            Verbose.isEnabled = originalVerboseState;

            return program.body[0];
          }
        }
      }
    });

    Verbose.log(`${count} code blocks encrypted`.yellow);
    return this.ast;
  }

  /**
   * @protected
   * @param {estree.Node} expression
   * @returns {boolean}
   * @memberof CodeEncryption
   */
  protected isSuitableBlock(expression: estree.Node): boolean {
    let suitable: boolean = true;

    estraverse.traverse(expression, {
      enter: (node: estree.Node): void => {
        if (this.forbiddenStatements.includes(node.type)) {
          suitable = false;
        }
      }
    });

    return suitable;
  }

  /**
   * @protected
   * @param {string} forbidden
   * @returns {(estree.FunctionDeclaration | undefined)}
   * @memberof CodeEncryption
   */
  protected findSuitableFunction(forbidden: string): estree.FunctionDeclaration | undefined {
    let functions: estree.FunctionDeclaration[] = [];

    for (const statement of this.ast.body) {
      if (statement.type === 'FunctionDeclaration' && statement.id !== null && statement.id.name !== forbidden) {
        functions.push(statement);
      }
    }

    functions = shuffle(functions);
    const result: estree.FunctionDeclaration | undefined = functions.pop();

    if (result !== undefined) {
      // @ts-ignore
      this.sealedTopLevelFunctions.push(result.id.name);
    }

    return result;
  }

  /**
   * @protected
   * @param {string} keyIdent
   * @param {estree.FunctionDeclaration} keyFuncDecl
   * @returns {estree.VariableDeclaration}
   * @memberof CodeEncryption
   */
  protected generateClientKeyDecl(keyIdent: string, keyFuncDecl: estree.FunctionDeclaration): estree.VariableDeclaration {
    const resultIdent: string = Identifiers.generate();
    const numIdent: string = Identifiers.generate();
    const indexIdent: string = Identifiers.generate();

    return {
      type: 'VariableDeclaration',
      declarations: [
        {
          type: 'VariableDeclarator',
          id: {
            type: 'Identifier',
            name: keyIdent
          },
          init: {
            type: 'CallExpression',
            callee: {
              type: 'MemberExpression',
              object: {
                type: 'CallExpression',
                callee: {
                  type: 'MemberExpression',
                  object: {
                    type: 'CallExpression',
                    callee: {
                      type: 'MemberExpression',
                      object: {
                        type: 'Identifier',
                        name: keyFuncDecl.id ? keyFuncDecl.id.name : ''
                      },
                      property: {
                        type: 'Literal',
                        value: 'toString'
                      },
                      computed: true
                    },
                    arguments: []
                  },
                  property: {
                    type: 'Literal',
                    value: 'split'
                  },
                  computed: true
                },
                arguments: [
                  {
                    type: 'Literal',
                    value: ''
                  }
                ]
              },
              property: {
                type: 'Literal',
                value: 'reduce'
              },
              computed: true
            },
            arguments: [
              {
                type: 'FunctionExpression',
                id: null,
                generator: false,
                params: [
                  {
                    type: 'Identifier',
                    name: resultIdent
                  },
                  {
                    type: 'Identifier',
                    name: numIdent
                  },
                  {
                    type: 'Identifier',
                    name: indexIdent
                  }
                ],
                body: {
                  type: 'BlockStatement',
                  body: [
                    {
                      type: 'ReturnStatement',
                      argument: {
                        type: 'BinaryExpression',
                        left: {
                          type: 'Identifier',
                          name: resultIdent
                        },
                        operator: '^',
                        right: {
                          type: 'BinaryExpression',
                          operator: '+',
                          left: {
                            type: 'CallExpression',
                            callee: {
                              type: 'MemberExpression',
                              object: {
                                type: 'Identifier',
                                name: numIdent
                              },
                              property: {
                                type: 'Literal',
                                value: 'charCodeAt'
                              },
                              computed: true
                            },
                            arguments: [
                              {
                                type: 'Literal',
                                value: 0
                              }
                            ]
                          },
                          right: {
                            type: 'Identifier',
                            name: indexIdent
                          }
                        }
                      }
                    }
                  ]
                }
              },
              {
                type: 'Literal',
                value: 0
              }
            ]
          }
        }
      ],
      kind: 'var'
    };
  }

  /**
   * @protected
   * @param {estree.FunctionDeclaration} keyFuncDecl
   * @param {estree.BlockStatement} blockNode
   * @param {string} keyIdent
   * @returns {estree.CallExpression}
   * @memberof CodeEncryption
   */
  protected generateBlockCodeDecryptExpr(keyFuncDecl: estree.FunctionDeclaration, blockNode: estree.BlockStatement, keyIdent: string): estree.CallExpression {
    const key: number = CodeGeneration.generate(keyFuncDecl)
      .split('')
      .reduce((result: number, code: string, index: number) => {
        return result ^ (code.charCodeAt(0) + index);
      }, 0);
    const block: string = CodeGeneration.generate(blockNode);
    const encrypted: estree.Literal[] = [];
    block.split('').map((value: string) => {
      encrypted.push({
        type: 'Literal',
        value: value.charCodeAt(0) ^ key
      });
    });

    const encryptedArrayExpression: estree.ArrayExpression = {
      type: 'ArrayExpression',
      elements: encrypted
    };

    const valueIdent: string = Identifiers.generate();

    return {
      type: 'CallExpression',
      callee: {
        type: 'MemberExpression',
        object: {
          type: 'CallExpression',
          callee: {
            type: 'MemberExpression',
            object: encryptedArrayExpression,
            property: {
              type: 'Literal',
              value: 'map'
            },
            computed: true
          },
          arguments: [
            {
              type: 'FunctionExpression',
              id: null,
              generator: false,
              params: [
                {
                  type: 'Identifier',
                  name: valueIdent
                }
              ],
              body: {
                type: 'BlockStatement',
                body: [
                  {
                    type: 'ReturnStatement',
                    argument: {
                      type: 'CallExpression',
                      callee: {
                        type: 'MemberExpression',
                        object: {
                          type: 'Identifier',
                          name: 'String'
                        },
                        property: {
                          type: 'Literal',
                          value: 'fromCharCode'
                        },
                        computed: true
                      },
                      arguments: [
                        {
                          type: 'BinaryExpression',
                          left: {
                            type: 'Identifier',
                            name: valueIdent
                          },
                          operator: '^',
                          right: {
                            type: 'Identifier',
                            name: keyIdent
                          }
                        }
                      ]
                    }
                  }
                ]
              }
            }
          ]
        },
        property: {
          type: 'Literal',
          value: 'join'
        },
        computed: true
      },
      arguments: [
        {
          type: 'Literal',
          value: ''
        }
      ]
    };
  }

  /**
   * @protected
   * @param {estree.CallExpression} blockCodeDecryptExpr
   * @returns {estree.TryStatement}
   * @memberof CodeEncryption
   */
  protected generateTryCatchExpression(blockCodeDecryptExpr: estree.CallExpression): estree.TryStatement {
    return {
      type: 'TryStatement',
      block: {
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
              arguments: [blockCodeDecryptExpr]
            }
          }
        ]
      },
      handler: {
        type: 'CatchClause',
        param: {
          type: 'Identifier',
          name: 'e'
        },
        body: {
          type: 'BlockStatement',
          body: []
        }
      }
    };
  }
}

export = CodeEncryption;
