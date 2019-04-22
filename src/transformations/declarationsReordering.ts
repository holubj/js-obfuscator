import * as estraverse from 'estraverse';
import * as estree from 'estree';
import { BaseTransformation } from '../transformations';

class DeclarationsReordering extends BaseTransformation {
  /**
   * @returns {estree.Program}
   * @memberof DeclarationsReordering
   */
  public apply(): estree.Program {
    this.splitDeclarations();

    estraverse.replace(this.ast, {
      enter: (node: estree.Node): estree.Node | void => {
        if (/Function/.test(node.type) || node.type === 'Program') {
          const declarations: estree.VariableDeclaration[] = this.removeDeclarations(node);

          for (const declaration of declarations) {
            this.placeDeclaration(node, declaration);
          }
        }
      }
    });

    return this.ast;
  }

  /**
   * @protected
   * @memberof DeclarationsReordering
   */
  protected splitDeclarations(): void {
    estraverse.replace(this.ast, {
      enter: (node: estree.Node): estree.Node | estraverse.VisitorOption | void => {
        if (node.type === 'Program' || node.type === 'BlockStatement') {
          for (let i: number = 0; i < node.body.length; i++) {
            if (node.body[i].type === 'VariableDeclaration') {
              const declarationStatement: estree.VariableDeclaration = node.body[i] as estree.VariableDeclaration;
              if (declarationStatement.kind !== 'var') {
                continue;
              }

              // remove original declaration
              node.body.splice(i, 1);

              for (const declaration of declarationStatement.declarations.reverse()) {
                if (declaration.init) {
                  const assignment: estree.ExpressionStatement = {
                    type: 'ExpressionStatement',
                    expression: {
                      type: 'AssignmentExpression',
                      left: declaration.id,
                      operator: '=',
                      right: declaration.init
                    }
                  };

                  node.body.splice(i, 0, assignment);
                }

                declaration.init = null;
                const separatedDeclaration: estree.VariableDeclaration = {
                  type: 'VariableDeclaration',
                  declarations: [declaration],
                  kind: declarationStatement.kind
                };
                node.body.splice(i, 0, separatedDeclaration);
              }
            }
          }
        }
      }
    });
  }

  /**
   * @protected
   * @param {estree.Node} scope
   * @returns {estree.VariableDeclaration[]}
   * @memberof DeclarationsReordering
   */
  protected removeDeclarations(scope: estree.Node): estree.VariableDeclaration[] {
    const declarations: estree.VariableDeclaration[] = [];
    estraverse.replace(scope, {
      enter: (node: estree.Node, parent: estree.Node | null): estree.Node | estraverse.VisitorOption | void => {
        if (/Function/.test(node.type) && node !== scope) {
          return estraverse.VisitorOption.Skip;
        }

        if (parent && ((parent.type === 'ForInStatement' && parent.left === node) || (parent.type === 'ForStatement' && parent.init === node))) {
          return;
        }

        if (node.type === 'VariableDeclaration') {
          declarations.push(node);
          return estraverse.VisitorOption.Remove;
        }
      }
    });

    return declarations;
  }

  /**
   * @protected
   * @param {estree.Node} scope
   * @param {estree.VariableDeclaration} declaration
   * @memberof DeclarationsReordering
   */
  protected placeDeclaration(scope: estree.Node, declaration: estree.VariableDeclaration): void {
    let placed: boolean = false;

    estraverse.replace(scope, {
      enter: (node: estree.Node, parent: estree.Node | null): estree.Node | estraverse.VisitorOption | void => {
        if (/Function/.test(node.type) && scope !== node) {
          return estraverse.VisitorOption.Skip;
        }

        if (node.type === 'BlockStatement') {
          // Initial function block
          // @ts-ignore
          if (parent && /Function/.test(parent.type) && parent.body === node) {
            this.placeDeclarationDeeper(node, declaration);
            placed = true;
            return estraverse.VisitorOption.Break;
          }

          // Program scope blocks
          if (Math.random() <= this.settings.deeperBlockChance) {
            placed = this.placeDeclarationDeeper(node, declaration);
            placed = true;
            return estraverse.VisitorOption.Break;
          }
        }
      }
    });

    if (!placed && scope.type === 'Program') {
      const index: number = Math.floor(Math.random() * (scope.body.length + 1));
      scope.body.splice(index, 0, declaration);
    }
  }

  /**
   * @protected
   * @param {estree.BlockStatement} block
   * @param {estree.VariableDeclaration} declaration
   * @returns {boolean}
   * @memberof DeclarationsReordering
   */
  protected placeDeclarationDeeper(block: estree.BlockStatement, declaration: estree.VariableDeclaration): boolean {
    let placed: boolean = false;

    estraverse.replace(block, {
      enter: (node: estree.Node): estree.Node | estraverse.VisitorOption | void => {
        if (/Function/.test(node.type)) {
          return estraverse.VisitorOption.Skip;
        }

        if (node.type === 'BlockStatement' && node !== block && Math.random() <= this.settings.deeperBlockChance) {
          placed = this.placeDeclarationDeeper(node, declaration);
          if (placed) {
            return estraverse.VisitorOption.Break;
          }
        }
      }
    });

    if (!placed) {
      const index: number = Math.floor(Math.random() * (block.body.length + 1));
      block.body.splice(index, 0, declaration);
      placed = true;
    }

    return placed;
  }
}

export = DeclarationsReordering;
