import 'colors';
import escodegen from 'escodegen';
import * as estraverse from 'estraverse';
import * as estree from 'estree';
import { Verbose } from '../configuration';
import { BaseTransformation, isProperty } from '../transformations';

class NumberObfuscation extends BaseTransformation {
  protected readonly zero: estree.UnaryExpression = {
    type: 'UnaryExpression',
    operator: '+',
    prefix: true,
    argument: {
      type: 'ArrayExpression',
      elements: []
    }
  };

  protected readonly one: estree.UnaryExpression = {
    type: 'UnaryExpression',
    operator: '+',
    prefix: true,
    argument: {
      type: 'UnaryExpression',
      operator: '!',
      prefix: true,
      argument: this.zero
    }
  };

  /**
   * @returns {estree.Program}
   * @memberof NumberObfuscation
   */
  public apply(): estree.Program {
    let count: number = 0;
    estraverse.replace(this.ast, {
      enter: (node: estree.Node, parent: estree.Node | null): estree.Node | void => {
        if (node.type === 'Literal' && typeof node.value === 'number' && Number.isInteger(node.value) && !isProperty(node, parent)) {
          if (node.value >= 0 && node.value < 10) {
            if (Math.random() <= this.settings.chance) {
              count++;
              return this.getNumberExpression(node.value);
            }
          }

          const numeralSystem: number = Math.floor(Math.random() * 10) + 1;
          let value: string = '';
          switch (true) {
            case numeralSystem < 8:
              value = '0x' + node.value.toString(16);
              break;
            case numeralSystem < 10:
              value = '0o' + node.value.toString(8);
              break;
            case numeralSystem === 10:
              value = '0b' + node.value.toString(2);
              break;
          }
          // @ts-ignore
          node['x-verbatim-property'] = {
            content: value,
            precedence: escodegen.Precedence.Primary
          };
        }
      }
    });

    Verbose.log(`${count} numbers obfuscated`.yellow);
    return this.ast;
  }

  /**
   * @protected
   * @param {number} value
   * @returns {(estree.UnaryExpression | estree.BinaryExpression)}
   * @memberof NumberObfuscation
   */
  protected getNumberExpression(value: number): estree.UnaryExpression | estree.BinaryExpression {
    if (value > 1) {
      return {
        type: 'BinaryExpression',
        operator: '+',
        left: this.one,
        right: this.getNumberExpression(value - 1)
      };
    } else if (value === 1) {
      return this.one;
    } else {
      return this.zero;
    }
  }
}

export = NumberObfuscation;
