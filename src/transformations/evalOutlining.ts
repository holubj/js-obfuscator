import 'colors';
import * as estraverse from 'estraverse';
import * as estree from 'estree';
import { CodeGeneration } from '../codeGeneration';
import { Verbose } from '../configuration';
import { BaseTransformation, forbiddenEvalStatements } from '../transformations';
import ExpressionObfuscation from './expressionObfuscation';
import LiteralObfuscation from './literalObfuscation';
import NumberObufscation from './numberObfuscation';

class EvalOutlining extends BaseTransformation {
  /**
   * @returns {estree.Program}
   * @memberof EvalOutlining
   */
  public apply(): estree.Program {
    let count: number = 0;

    estraverse.replace(this.ast, {
      enter: (node: estree.Node, parent: estree.Node | null): estree.Node | void => {
        if (parent !== null && parent.type === 'BlockStatement') {
          if (!this.isSuitable(node)) {
            return;
          }
          if (Math.random() <= this.settings.chance) {
            count++;

            const block: estree.BlockStatement = {
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
                        value: CodeGeneration.generate(node)
                      }
                    ]
                  }
                }
              ]
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

    Verbose.log(`${count} expressions outlined to eval`.yellow);
    return this.ast;
  }

  /**
   * @protected
   * @param {estree.Node} expression
   * @returns {boolean}
   * @memberof EvalOutlining
   */
  protected isSuitable(expression: estree.Node): boolean {
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
}

export = EvalOutlining;
