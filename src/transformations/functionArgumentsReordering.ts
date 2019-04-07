import 'colors';
import * as estraverse from 'estraverse';
import * as estree from 'estree';
import shuffle from 'shuffle-array';
import { Verbose } from '../configuration';
import { BaseTransformation } from '../transformations';

class FunctionArgumentReordering extends BaseTransformation {
  /**
   * @returns {estree.Program}
   * @memberof FunctionDefinitonReordering
   */
  public apply(): estree.Program {
    estraverse.traverse(this.ast, {
      enter: (node: estree.Node): estree.Node | void => {
        if (node.type === 'FunctionDeclaration' && node.id !== null) {
          if (this.isSuitableFunc(node, node.id.name)) {
            this.reorderArguments(node.id.name, node.params.length);
            Verbose.log(`Arguments of function '${node.id.name}' reordered`.yellow);
          }
        }
      }
    });

    return this.ast;
  }

  /**
   * @protected
   * @param {string} funcIdent
   * @param {number} paramsCount
   * @memberof FunctionArgumentReordering
   */
  protected reorderArguments(funcIdent: string, paramsCount: number): void {
    let newOrder: number[] = Array.from({ length: paramsCount }, (x: number, i: number) => i);
    newOrder = shuffle(newOrder);

    estraverse.replace(this.ast, {
      enter: (node: estree.Node): estree.Node | void => {
        if (node.type === 'FunctionDeclaration' && node.id !== null && node.id.name === funcIdent) {
          const newParams: any[] = [];
          for (const orderIndex of newOrder) {
            newParams.push(node.params[orderIndex]);
          }
          node.params = newParams;
        } else if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name === funcIdent) {
          const newArguments: any[] = [];
          for (const orderIndex of newOrder) {
            newArguments.push(node.arguments[orderIndex]);
          }
          node.arguments = newArguments;
        }

        return node;
      }
    });
  }

  /**
   * @protected
   * @param {estree.FunctionDeclaration} funcDeclaration
   * @param {string} funcIdent
   * @returns {boolean}
   * @memberof FunctionArgumentReordering
   */
  protected isSuitableFunc(funcDeclaration: estree.FunctionDeclaration, funcIdent: string): boolean {
    return (
      funcDeclaration.params.length > 1 &&
      this.isUniqueFuncDeclaration(funcIdent) &&
      !this.usesArgumentsIdent(funcDeclaration) &&
      this.haveSimpleCalls(funcIdent, funcDeclaration.params.length)
    );
  }

  /**
   * @protected
   * @param {string} funcIdent
   * @returns {boolean}
   * @memberof FunctionArgumentReordering
   */
  protected isUniqueFuncDeclaration(funcIdent: string): boolean {
    let count: number = 0;

    estraverse.traverse(this.ast, {
      enter: (node: estree.Node): void => {
        if (node.type === 'FunctionDeclaration' && node.id !== null && node.id.name === funcIdent) {
          count++;
        }
      }
    });

    return count === 1;
  }

  /**
   * @protected
   * @param {estree.FunctionDeclaration} funcDeclaration
   * @returns {boolean}
   * @memberof FunctionArgumentReordering
   */
  protected usesArgumentsIdent(funcDeclaration: estree.FunctionDeclaration): boolean {
    let argumentsUsed: boolean = false;

    estraverse.traverse(funcDeclaration, {
      enter: (node: estree.Node): void => {
        if (node.type === 'Identifier' && node.name === 'arguments') {
          argumentsUsed = true;
        }
      }
    });

    return argumentsUsed;
  }

  /**
   * @protected
   * @param {string} funcIdent
   * @param {number} paramsCount
   * @returns {boolean}
   * @memberof FunctionArgumentReordering
   */
  protected haveSimpleCalls(funcIdent: string, paramsCount: number): boolean {
    let simpleCalls: boolean = true;

    estraverse.traverse(this.ast, {
      enter: (node: estree.Node, parent: estree.Node | null): void => {
        if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name === funcIdent) {
          if (node.arguments.length !== paramsCount) {
            simpleCalls = false;
          }
          for (const argument of node.arguments) {
            if (this.containsAssignOrUpdateExpression(argument)) {
              simpleCalls = false;
            }
          }
        }
        if (node.type === 'Identifier' && node.name === funcIdent) {
          if (
            !parent ||
            (!(parent.type === 'CallExpression' && parent.callee.type === 'Identifier' && parent.callee.name === funcIdent) &&
              parent.type !== 'FunctionDeclaration')
          ) {
            simpleCalls = false;
          }
        }
      }
    });

    return simpleCalls;
  }

  /**
   * @protected
   * @param {estree.Node} search
   * @returns {boolean}
   * @memberof FunctionArgumentReordering
   */
  protected containsAssignOrUpdateExpression(search: estree.Node): boolean {
    let contains: boolean = false;

    estraverse.traverse(search, {
      enter: (node: estree.Node): void => {
        if (node.type === 'AssignmentExpression' || node.type === 'UpdateExpression' || node.type === 'CallExpression') {
          contains = true;
        }
      }
    });

    return contains;
  }
}

export = FunctionArgumentReordering;
