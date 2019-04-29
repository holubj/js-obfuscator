import * as estraverse from 'estraverse';
import * as estree from 'estree';

export interface ITransformationDefinition {
  name: string;
  file: string;
  settings: object;
}

/**
 * @export
 * @abstract
 * @class BaseTransformation
 */
export abstract class BaseTransformation {
  protected ast: estree.Program;
  protected readonly settings: any;

  constructor(ast: estree.Program, settings: any = {}) {
    this.ast = ast;
    this.settings = settings;
  }

  public abstract apply(): estree.Program;
}

/**
 * @export
 * @param {estree.Program} ast
 * @returns {boolean}
 */
export function canBeObfuscated(ast: estree.Program): boolean {
  let result: boolean = true;

  estraverse.traverse(ast, {
    enter: (node: estree.Node): void => {
      if ((node.type === 'Identifier' && node.name === 'eval') || node.type === 'WithStatement') {
        result = false;
      }
    }
  });

  return result;
}

export const forbiddenEvalStatements: string[] = [
  'ReturnStatement',
  'BreakStatement',
  'ContinueStatement',
  'VariableDeclaration',
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression'
];

export const loopStatements: string[] = ['ForStatement', 'ForOfStatement', 'ForInStatement', 'WhileStatement', 'DoWhileStatement'];

/**
 * @export
 * @param {estree.Node} node
 * @param {(estree.Node | null)} parent
 * @returns {boolean}
 */
export function isProperty(node: estree.Node, parent: estree.Node | null): boolean {
  if (parent === null) {
    return false;
  } else {
    return parent.type === 'Property' && parent.key === node;
  }
}
