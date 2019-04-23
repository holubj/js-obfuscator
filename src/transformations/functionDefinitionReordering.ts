import escodegen from 'escodegen';
import * as estraverse from 'estraverse';
import * as estree from 'estree';
import shuffle from 'shuffle-array';
import { Verbose } from '../configuration';
import { BaseTransformation } from '../transformations';

class FunctionDefinitonReordering extends BaseTransformation {
  /**
   * @returns {estree.Program}
   * @memberof FunctionDefinitonReordering
   */
  public apply(): estree.Program {
    let count: number = 0;

    estraverse.replace(this.ast, {
      enter: (node: estree.Node): estree.Node | void => {
        if (node.type === 'Program' || node.type === 'BlockStatement') {
          let declarations: estree.FunctionDeclaration[] = [];
          let insertIndex: number = -1;

          for (let i: number = 0; i < node.body.length; i++) {
            // @ts-ignore
            if (insertIndex === -1 && !node.body[i].directive) {
              insertIndex = i;
            }
            if (node.body[i].type === 'FunctionDeclaration') {
              declarations.push(node.body[i] as estree.FunctionDeclaration);
              node.body.splice(i, 1);
              i--;
            }
          }

          if (declarations.length > 0) {
            declarations = shuffle(declarations);

            for (const declaration of declarations) {
              node.body.splice(insertIndex, 0, declaration);
            }

            count += declarations.length;
          }
        }
      }
    });

    Verbose.log(`${count} function declarations reordered`.yellow);

    return this.ast;
  }
}

export = FunctionDefinitonReordering;
