declare module 'esmangle' {
  import * as estree from 'estree';

  export function mangle(program: estree.Program): estree.Program;

  export function optimize(program: estree.Program, pipeline?: any): estree.Program;
}
