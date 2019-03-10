import * as estree from 'estree';

export class InsertPosition {
  /**
   * @static
   * @param {estree.Program} ast
   * @returns {void}
   * @memberof InsertPosition
   */
  public static init(ast: estree.Program): void {
    if (0 in ast.body) {
      // @ts-ignore (missing 'directive' property for Statement in @types/estree)
      if (ast.body[0].directive === 'use strict') {
        this.position = 1;
        return;
      }
    }

    this.position = 0;
  }

  /**
   * @static
   * @returns {number}
   * @memberof InsertPosition
   */
  public static get(): number {
    return this.position;
  }

  protected static position: number = 0;
}
