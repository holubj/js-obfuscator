declare module 'esvalid' {
  import * as estree from 'estree';

  export function isValid(program: estree.Program): estree.Program;
}
