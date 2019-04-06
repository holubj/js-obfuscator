import * as estraverse from 'estraverse';
import * as estree from 'estree';

export interface ITransformationDefinition {
  name: string;
  file: string;
  settings: object;
}

export abstract class BaseTransformation {
  protected ast: estree.Program;
  protected readonly settings: any;

  constructor(ast: estree.Program, settings: any = {}) {
    this.ast = ast;
    this.settings = settings;
  }

  public abstract apply(): estree.Program;
}

export function isSuitable(ast: estree.Program): boolean {
  let suitable: boolean = true;

  estraverse.traverse(ast, {
    enter: (node: estree.Node): void => {
      if ((node.type === 'Identifier' && node.name === 'eval') || node.type === 'WithStatement') {
        suitable = false;
      }
    }
  });

  return suitable;
}
