import * as estraverse from 'estraverse';
import * as estree from 'estree';
import { Verbose } from '../configuration';
import { BaseTransformation } from '../transformations';

class ExpressionObfuscator extends BaseTransformation {
  protected readonly falseExpression: estree.UnaryExpression = {
    type: 'UnaryExpression',
    operator: '!',
    prefix: true,
    argument: {
      type: 'ArrayExpression',
      elements: []
    }
  };

  protected readonly trueExpression: estree.UnaryExpression = {
    type: 'UnaryExpression',
    operator: '!',
    prefix: true,
    argument: this.falseExpression
  };

  protected readonly undefinedExpression: estree.MemberExpression = {
    type: 'MemberExpression',
    object: {
      type: 'ArrayExpression',
      elements: []
    },
    property: {
      type: 'ArrayExpression',
      elements: []
    },
    computed: true
  };

  /**
   * @returns {estree.Program}
   * @memberof ExpressionObfuscator
   */
  public apply(): estree.Program {
    let booleanCount: number = 0;
    let undefinedCount: number = 0;

    estraverse.replace(this.ast, {
      enter: (node: estree.Node): estree.Node | void => {
        if (node.type === 'Literal' && typeof node.value === 'boolean') {
          if (Math.random() <= this.settings.booleanThreshold) {
            booleanCount++;
            if (node.value === true) {
              return this.trueExpression;
            } else if (node.value === false) {
              return this.falseExpression;
            }
          }
        } else if (node.type === 'Identifier' && node.name === 'undefined') {
          const rand: number = Math.random();
          if (rand <= this.settings.undefinedThreshold) {
            undefinedCount++;
            return this.undefinedExpression;
          }
        }
      }
    });

    Verbose.log(`${booleanCount} booleans obfuscated`.yellow);
    Verbose.log(`${undefinedCount} 'undefined' expression obfuscated`.yellow);
    return this.ast;
  }
}

export = ExpressionObfuscator;
