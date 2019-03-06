import { Program } from 'estree';
import { BaseTransformation } from '../transformations';

class Test extends BaseTransformation {
  public apply(): Program {
    console.log('test');
    return this.p;
  }
}

export = Test;
