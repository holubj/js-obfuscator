import { Program } from 'estree';
import * as fs from 'fs';

export interface ITransformationDefinition {
  name: string;
  file: string;
  settings: object;
}

export let transformations: ITransformationDefinition[] = [];

try {
  transformations = JSON.parse(
    fs.readFileSync(__dirname + '/../settings.json', 'utf8')
  );
} catch (err) {
  transformations = [];
}

export abstract class BaseTransformation {
  protected p: Program;
  protected readonly settings: object;

  constructor(p: Program, settings: object = {}) {
    this.p = p;
    this.settings = settings;
  }

  public abstract apply(): Program;
}
