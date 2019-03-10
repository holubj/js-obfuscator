import * as estraverse from 'estraverse';
import * as estree from 'estree';
import * as randomstring from 'randomstring';

export class Identifiers {
  /**
   * @static
   * @param {estree.Program} ast
   * @memberof Identifiers
   */
  public static init(ast: estree.Program): void {
    estraverse.traverse(ast, {
      enter: (node: estree.Node): estree.Node | void => {
        if (node.type === 'Identifier') {
          this.usedIdentifiers.add(node.name);
        }
      }
    });
  }

  /**
   * @static
   * @returns {string}
   * @memberof Identifiers
   */
  public static generate(): string {
    let identifier: string;
    do {
      identifier = randomstring.generate({
        length: 12,
        charset: 'alphabetic'
      });
    } while (this.usedIdentifiers.has(identifier));

    this.usedIdentifiers.add(identifier);
    return identifier;
  }

  protected static usedIdentifiers: Set<string> = new Set<string>();
}
