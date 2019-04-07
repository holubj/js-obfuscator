import 'colors';
import * as estraverse from 'estraverse';
import * as estree from 'estree';
import { CodeGeneration } from '../codeGeneration';
import { Verbose } from '../configuration';
import { BaseTransformation } from '../transformations';

class EvalOutlining extends BaseTransformation {
  protected readonly forbiddenStatements: string[] = ['ReturnStatement', 'BreakStatement', 'ContinueStatement', 'VariableDeclaration', 'FunctionDeclaration'];

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
          if (Math.random() <= this.settings.threshold) {
            count++;
            return {
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
            };
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
        if (this.forbiddenStatements.includes(node.type)) {
          suitable = false;
        }
      }
    });

    return suitable;
  }
}

export = EvalOutlining;
