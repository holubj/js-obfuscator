import 'colors';
import * as escope from 'escope';
import * as estraverse from 'estraverse';
import * as estree from 'estree';
import { Verbose } from '../configuration';
import { Identifiers } from '../identifiers';
import { BaseTransformation } from '../transformations';

class IdentifierRenaming extends BaseTransformation {
  /**
   * @returns {estree.Program}
   * @memberof UnicodeLiteral
   */
  public apply(): estree.Program {
    const identifiers: Map<number, estree.Identifier> = new Map();
    let count: number = 0;

    const options: any = {};
    if (this.settings.renameGlobals) {
      options.optimistic = true;
    }

    const scopeManager: escope.ScopeManager = escope.analyze(this.ast, options);
    let currentScope: escope.Scope = scopeManager.acquire(this.ast);

    estraverse.traverse(this.ast, {
      enter: (node: estree.Node): estree.Node | void => {
        if (/Function/.test(node.type) || node.type === 'CatchClause') {
          currentScope = scopeManager.acquire(node);
        }
      },
      leave: (node: estree.Node): estree.Node | void => {
        if (/Function/.test(node.type) || node.type === 'CatchClause' || (this.settings.renameGlobals && /Program/.test(node.type))) {
          for (const variable of currentScope.variables) {
            if (variable.name === 'arguments') {
              continue;
            }

            const newName: string = Identifiers.generate();
            count++;

            for (const def of variable.defs) {
              if (def.node.id && (!('id' in node) || def.node.id !== node.id)) {
                def.node.id.name = newName;
              }
            }

            if ('params' in node) {
              for (const param of node.params) {
                if (param.type === 'Identifier' && variable.name === param.name) {
                  param.name = newName;
                }
              }
            }

            if (node.type === 'CatchClause' && node.param && node.param.type === 'Identifier' && node.param.name === variable.name) {
              node.param.name = newName;
            }

            for (const reference of variable.references) {
              const identifier: estree.Identifier | undefined = identifiers.get(reference.identifier.start);
              if (typeof identifier !== 'undefined') {
                identifier.name = newName;
              }
            }
          }

          currentScope = currentScope.upper;
        }

        if (node.type === 'Identifier') {
          identifiers.set((node as any).start, node);
        }

        return node;
      }
    });

    Verbose.log(`${count} identifiers renamed`.yellow);

    return this.ast;
  }
}

export = IdentifierRenaming;
