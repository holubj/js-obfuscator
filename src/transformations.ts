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
