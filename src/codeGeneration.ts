import escodegen from 'escodegen';
import * as estree from 'estree';

export class CodeGeneration {
  /**
   * @static
   * @returns {string}
   * @memberof CodeGeneration
   */
  public static generate(p: estree.Node): string {
    return escodegen.generate(p, {
      format: {
        renumber: true,
        hexadecimal: true,
        escapeless: true,
        compact: true,
        semicolons: false,
        parentheses: false
      },
      verbatim: 'x-verbatim-property'
    });
  }
}
