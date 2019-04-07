import escodegen from 'escodegen';
import * as estraverse from 'estraverse';
import * as estree from 'estree';
import { Verbose } from '../configuration';
import { BaseTransformation } from '../transformations';

class ComputedMember extends BaseTransformation {
  /**
   * @returns {estree.Program}
   * @memberof ComputedMember
   */
  public apply(): estree.Program {
    let count: number = 0;

    estraverse.replace(this.ast, {
      enter: (node: estree.Node, parent: estree.Node | null): estree.Node | void => {
        if (node.type === 'Identifier') {
          if (parent && parent.type === 'MemberExpression' && parent.property === node && parent.computed === false) {
            parent.computed = true;
            count++;
            return {
              type: 'Literal',
              value: node.name
            };
          }
        }
      }
    });

    Verbose.log(`${count} member expresssions converted to computed`.yellow);
    return this.ast;
  }
}

export = ComputedMember;
