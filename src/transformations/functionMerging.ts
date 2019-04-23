import 'colors';
import * as estraverse from 'estraverse';
import * as estree from 'estree';
import { configuration, Verbose } from '../configuration';
import { Identifiers } from '../identifiers';
import { BaseTransformation, isProperty } from '../transformations';

class FunctionMerging extends BaseTransformation {
  protected readonly UNDEFINED: number = -1;

  /**
   * @returns {estree.Program}
   * @memberof FunctionMerging
   */
  public apply(): estree.Program {
    let count: number = 0;

    estraverse.replace(this.ast, {
      enter: (node: estree.Node): estree.Node | void => {
        if (node.type === 'Program' || node.type === 'BlockStatement') {
          if (node.type === 'Program' && (!configuration.identifiers.rename || !configuration.identifiers.renameGlobals)) {
            return;
          }

          let firstDeclarationIndex: number = this.UNDEFINED;
          for (let i: number = 0; i < node.body.length; i++) {
            if (node.body[i].type === 'FunctionDeclaration' && this.isSuitable(node.body[i] as estree.FunctionDeclaration)) {
              if (firstDeclarationIndex === this.UNDEFINED) {
                firstDeclarationIndex = i;
              } else {
                const mergedDeclaration: estree.FunctionDeclaration = this.mergeDeclarations(
                  node.body[firstDeclarationIndex] as estree.FunctionDeclaration,
                  node.body[i] as estree.FunctionDeclaration
                );

                node.body[i] = mergedDeclaration;
                node.body.splice(firstDeclarationIndex, 1);
                i--;
                firstDeclarationIndex = this.UNDEFINED;

                count++;
              }
            }
          }

          return node;
        }
      }
    });

    Verbose.log(`${count * 2} function declarations merged into ${count}`.yellow);

    return this.ast;
  }

  /**
   * @protected
   * @param {estree.FunctionDeclaration} firstDeclaration
   * @param {estree.FunctionDeclaration} secondDeclaration
   * @returns {estree.FunctionDeclaration}
   * @memberof FunctionMerging
   */
  protected mergeDeclarations(firstDeclaration: estree.FunctionDeclaration, secondDeclaration: estree.FunctionDeclaration): estree.FunctionDeclaration {
    const ident: string = Identifiers.generate();
    const max: number = Math.max(firstDeclaration.params.length, secondDeclaration.params.length);
    const unifiedParams: estree.Identifier[] = [];
    const decidingVariable: estree.Identifier = {
      type: 'Identifier',
      name: Identifiers.generate()
    };
    unifiedParams.push(decidingVariable);

    for (let i: number = 0; i < max; i++) {
      unifiedParams.push({
        type: 'Identifier',
        name: Identifiers.generate()
      });
    }

    firstDeclaration = this.mapNewParams(firstDeclaration, unifiedParams);
    secondDeclaration = this.mapNewParams(secondDeclaration, unifiedParams);

    const firstLiteral: estree.Literal = this.extractLiteral(firstDeclaration, 0, decidingVariable, null);

    let defaultSecondLiteral: number = 1;
    if (firstLiteral.value === 1) {
      defaultSecondLiteral = 0;
    }
    const secondLiteral: estree.Literal = this.extractLiteral(secondDeclaration, defaultSecondLiteral, decidingVariable, firstLiteral);

    this.updateFuncCalls(firstDeclaration, ident, firstLiteral);
    this.updateFuncCalls(secondDeclaration, ident, secondLiteral);

    // update also possible recursive calls
    firstDeclaration = this.updateRecursiveCalls(firstDeclaration, ident, firstDeclaration, firstLiteral);
    firstDeclaration = this.updateRecursiveCalls(firstDeclaration, ident, secondDeclaration, secondLiteral);
    secondDeclaration = this.updateRecursiveCalls(secondDeclaration, ident, secondDeclaration, secondLiteral);
    secondDeclaration = this.updateRecursiveCalls(secondDeclaration, ident, firstDeclaration, firstLiteral);

    return {
      type: 'FunctionDeclaration',
      id: {
        type: 'Identifier',
        name: ident
      },
      params: unifiedParams,
      generator: false,
      body: {
        type: 'BlockStatement',
        body: [
          {
            type: 'IfStatement',
            test: {
              type: 'BinaryExpression',
              operator: '===',
              left: decidingVariable,
              right: firstLiteral
            },
            consequent: firstDeclaration.body,
            alternate: secondDeclaration.body
          }
        ]
      }
    };
  }

  /**
   * @protected
   * @param {estree.FunctionDeclaration} decl
   * @param {estree.Identifier[]} unifiedParams
   * @returns {estree.FunctionDeclaration}
   * @memberof FunctionMerging
   */
  protected mapNewParams(decl: estree.FunctionDeclaration, unifiedParams: estree.Identifier[]): estree.FunctionDeclaration {
    for (let i: number = 0; i < decl.params.length; i++) {
      const originalName: string = (decl.params[i] as estree.Identifier).name;
      estraverse.replace(decl, {
        enter: (node: estree.Node): estree.Node | void => {
          if (node.type === 'Identifier' && node.name === originalName) {
            return unifiedParams[i + 1];
          }
        }
      });
    }

    return decl;
  }

  /**
   * @protected
   * @param {estree.FunctionDeclaration} decl
   * @param {number} defaultValue
   * @param {estree.Identifier} decidingVariable
   * @returns {estree.Literal}
   * @memberof FunctionMerging
   */
  protected extractLiteral(
    decl: estree.FunctionDeclaration,
    defaultValue: number,
    decidingVariable: estree.Identifier,
    forbiddenLiteral: estree.Literal | null
  ): estree.Literal {
    let literal: estree.Literal = {
      type: 'Literal',
      value: defaultValue
    };
    let extracted: boolean = false;
    estraverse.replace(decl, {
      enter: (node: estree.Node, parent: estree.Node | null): estree.Node | void => {
        if (!extracted && node.type === 'Literal' && !isProperty(node, parent) && (forbiddenLiteral === null || node.value !== forbiddenLiteral.value)) {
          literal = node;
          extracted = true;
          return decidingVariable;
        }
      }
    });

    return literal;
  }

  /**
   * @protected
   * @param {estree.FunctionDeclaration} decl
   * @param {string} mergedIdent
   * @param {estree.Literal} decidingLiteral
   * @memberof FunctionMerging
   */
  protected updateFuncCalls(decl: estree.FunctionDeclaration, mergedIdent: string, decidingLiteral: estree.Literal): void {
    estraverse.replace(this.ast, {
      enter: (node: estree.Node): estree.Node | void => {
        if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && decl.id !== null && node.callee.name === decl.id.name) {
          node.callee.name = mergedIdent;
          node.arguments.splice(0, 0, decidingLiteral);
        }
      }
    });
  }

  /**
   * @protected
   * @param {estree.FunctionDeclaration} scope
   * @param {string} mergedIdent
   * @param {estree.FunctionDeclaration} decl
   * @param {estree.Literal} decidingLiteral
   * @returns {estree.FunctionDeclaration}
   * @memberof FunctionMerging
   */
  protected updateRecursiveCalls(
    scope: estree.FunctionDeclaration,
    mergedIdent: string,
    decl: estree.FunctionDeclaration,
    decidingLiteral: estree.Literal
  ): estree.FunctionDeclaration {
    estraverse.replace(scope, {
      enter: (node: estree.Node): estree.Node | void => {
        if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && decl.id !== null && node.callee.name === decl.id.name) {
          node.callee.name = mergedIdent;
          node.arguments.splice(0, 0, decidingLiteral);
        }
      }
    });

    return scope;
  }

  /**
   * @protected
   * @param {estree.FunctionDeclaration} funcDeclaration
   * @returns {boolean}
   * @memberof FunctionMerging
   */
  protected isSuitable(funcDeclaration: estree.FunctionDeclaration): boolean {
    if (funcDeclaration.id === null) {
      return false;
    }

    let suitable: boolean = true;
    estraverse.traverse(funcDeclaration, {
      enter: (node: estree.Node): void => {
        if (node.type === 'Identifier' && node.name === 'arguments') {
          suitable = false;
        }
      }
    });

    estraverse.traverse(this.ast, {
      enter: (node: estree.Node, parent: estree.Node | null): void => {
        if (node.type === 'Identifier' && funcDeclaration.id !== null && node.name === funcDeclaration.id.name) {
          if (
            !parent ||
            (!(parent.type === 'CallExpression' && parent.callee.type === 'Identifier' && parent.callee.name === funcDeclaration.id.name) &&
              parent.type !== 'FunctionDeclaration')
          ) {
            suitable = false;
          }
        }
      }
    });

    return suitable;
  }
}

export = FunctionMerging;
