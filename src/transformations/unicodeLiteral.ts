import escodegen from 'escodegen';
import * as estraverse from 'estraverse';
import * as estree from 'estree';
import { Verbose } from '../configuration';
import { BaseTransformation } from '../transformations';

class UnicodeLiteral extends BaseTransformation {
  /**
   * @returns {estree.Program}
   * @memberof UnicodeLiteral
   */
  public apply(): estree.Program {
    let count: number = 0;

    estraverse.replace(this.ast, {
      enter: (node: estree.Node): estree.Node | void => {
        if (node.type === 'Literal') {
          if (typeof node.value === 'string') {
            if (node.value === 'use strict') {
              return;
            }
            // @ts-ignore
            node['x-verbatim-property'] = {
              content: "'" + this.unicodeEscape(node.value) + "'",
              precedence: escodegen.Precedence.Primary
            };
            count++;
            return node;
          }
        }
      }
    });

    Verbose.log(`${count} literals converted to unicode escape sequence`.yellow);
    return this.ast;
  }

  /**
   * https://gist.github.com/mathiasbynens/1243213
   * @protected
   * @param {string} str
   * @returns {string}
   * @memberof UnicodeLiteral
   */
  protected unicodeEscape(str: string): string {
    return str.replace(/[\s\S]/g, (character: string) => {
      const escape: string = character.charCodeAt(0).toString(16);
      const longhand: boolean = escape.length > 2;
      return '\\' + (longhand ? 'u' : 'x') + ('0000' + escape).slice(longhand ? -4 : -2);
    });
  }
}

export = UnicodeLiteral;
