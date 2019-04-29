import 'colors';
import * as estraverse from 'estraverse';
import * as estree from 'estree';
import shuffle from 'shuffle-array';
import { CodeGeneration } from '../codeGeneration';
import { Verbose } from '../configuration';
import { Identifiers } from '../identifiers';
import { BaseTransformation, forbiddenEvalStatements } from '../transformations';
import ExpressionObfuscation from './expressionObfuscation';
import LiteralObfuscation from './literalObfuscation';
import NumberObufscation from './numberObfuscation';
const estemplate = require('estemplate');

class CodeEncryption extends BaseTransformation {
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
          if (Math.random() <= this.settings.chance) {
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
              splitChance: 0.8,
              arrayChance: 0,
              base64Chance: 0.8,
              unicodeChance: 1
            }).apply();

            new ExpressionObfuscation(program, {
              booleanChance: 0.8,
              undefinedChance: 0.8
            }).apply();

            new NumberObufscation(program, {
              chance: 0.5
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
        if (forbiddenEvalStatements.includes(node.type)) {
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
    const template: string =
      "var <%= varIdent %> = <%= funcDecl %>['toString']()['split']('')['reduce'](function(<%= resultIdent %>, <%= numIdent %>, <%= indexIdent %>) {return <%= resultIdent %> ^ <%= numIdent %>['charCodeAt'](0) + <%= indexIdent %>}, 0);";

    return estemplate(template, {
      varIdent: { type: 'Identifier', name: keyIdent },
      funcDecl: keyFuncDecl.id,
      resultIdent: { type: 'Identifier', name: Identifiers.generate() },
      numIdent: { type: 'Identifier', name: Identifiers.generate() },
      indexIdent: { type: 'Identifier', name: Identifiers.generate() }
    }).body[0] as estree.VariableDeclaration;
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

    const template: string = "[%= elements %]['map'](function(<%= valueIdent %>) {return String['fromCharCode'](<%= valueIdent %> ^ <%= key %>)})['join']('')";
    return estemplate(template, {
      elements: encrypted,
      valueIdent: { type: 'Identifier', name: Identifiers.generate() },
      key: { type: 'Identifier', name: keyIdent }
    }).body[0].expression as estree.CallExpression;
  }

  /**
   * @protected
   * @param {estree.CallExpression} blockCodeDecryptExpr
   * @returns {estree.TryStatement}
   * @memberof CodeEncryption
   */
  protected generateTryCatchExpression(blockCodeDecryptExpr: estree.CallExpression): estree.TryStatement {
    const template: string = 'try {eval(<%= block %>)} catch (e){}';

    return estemplate(template, {
      block: blockCodeDecryptExpr
    }).body[0] as estree.TryStatement;
  }
}

export = CodeEncryption;
