// Type definitions for escope 3.6
// Project: http://github.com/estools/escope
// Definitions by: Julian Jensen <https://github.com/julianjensen>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

declare module 'escope' {
  export const version: string;

  interface Identifier {
    type: 'Identifier';
    name: string;
    start: number;
  }

  export const enum DefinitionType {
    CatchClause = 'CatchClause',
    Parameter = 'Parameter',
    FunctionName = 'FunctionName',
    ClassName = 'ClassName',
    Variable = 'Variable',
    ImportBinding = 'ImportBinding',
    TDZ = 'TDZ',
    ImplicitGlobalVariable = 'ImplicitGlobalVariable'
  }

  export interface Definition {
    type: DefinitionType;
    name: Identifier;
    node: any;
    parent?: any;
    index?: number;
    kind?: string;
    new (name: string, scope: Scope): Definition;
  }

  export interface ParameterDefinition extends Definition {
    rest: boolean;
    new (name: string, node: any, index: number, rest: boolean): ParameterDefinition;
  }

  export interface Variable {
    name: string;
    identifiers: Identifier[];
    references: Reference[];
    defs: Definition[];
    tainted: boolean;
    stack: boolean;
    scope: Scope;
    new (name: string, scope: Scope): Variable;
  }

  export function analyze(tree: any, providedOptions: any): ScopeManager;

  export interface Reference {
    identifier: Identifier;
    from: Scope;
    tainted: boolean;
    resolved?: Variable | undefined;
    writeExpr?: any;
    partial?: boolean;
    init: boolean;
    start: number;
    new (ident: Identifier, scope: Scope, flag: number, writeExpr: any, maybeImplicitGlobal: boolean, partial: boolean, init: boolean): Reference;

    isRead(): boolean;

    isReadOnly(): boolean;

    isReadWrite(): boolean;

    isStatic(): boolean;

    isWrite(): boolean;

    isWriteOnly(): boolean;
  }

  export const enum ScopeType {
    TDZ = 'TDZ',
    module = 'module',
    block = 'block',
    switch = 'switch',
    function = 'function',
    catch = 'catch',
    with = 'with',
    class = 'class',
    global = 'global'
  }

  export interface Scope {
    set: Map<string, Variable>;
    taints: Map<string, boolean>;
    dynamic: boolean;
    block: any;
    through: Reference[];
    variables: Variable[];
    references: Reference[];
    variableScope: Scope;
    functionExpressionScope: boolean;
    directCallToEvalScope: boolean;
    thisFound: boolean;
    upper: Scope;
    isStrict: boolean;
    childScopes: Scope[];
    new (scopeManager: ScopeManager, type: ScopeType, upperScope: any, block: any, isMethodDefinition: any): Scope;

    isArgumentsMaterialized(): boolean;

    isStatic(): boolean;

    isThisMaterialized(): boolean;

    isUsedName(name: string): boolean;

    resolve(ident: { type: 'Identifier'; name: string }): any;

    isArgumentsMaterialized(): boolean;
  }

  export interface GlobalScope extends Scope {
    new (scopeManager: ScopeManager, block: any): GlobalScope;
  }

  export interface ModuleScope extends Scope {
    new (scopeManager: ScopeManager, upperScope: Scope, block: any): ModuleScope;
  }

  export interface FunctionExpressionNameScope extends Scope {
    new (scopeManager: ScopeManager, upperScope: Scope, block: any): FunctionExpressionNameScope;
  }

  export interface CatchScope extends Scope {
    new (scopeManager: ScopeManager, upperScope: Scope, block: any): CatchScope;
  }

  export interface WithScope extends Scope {
    new (scopeManager: ScopeManager, upperScope: Scope, block: any): WithScope;
  }

  export interface TDZScope extends Scope {
    new (scopeManager: ScopeManager, upperScope: Scope, block: any): TDZScope;
  }

  export interface BlockScope extends Scope {
    new (scopeManager: ScopeManager, upperScope: Scope, block: any): BlockScope;
  }

  export interface SwitchScope extends Scope {
    new (scopeManager: ScopeManager, upperScope: Scope, block: any): SwitchScope;
  }

  export interface FunctionScope extends Scope {
    new (scopeManager: ScopeManager, upperScope: Scope, block: any, isMethodDefinition: boolean): FunctionScope;

    isArgumentsMaterialized(): boolean;

    isThisMaterialized(): boolean;
  }

  export interface ForScope extends Scope {
    new (scopeManager: ScopeManager, upperScope: Scope, block: any): ForScope;
  }

  export interface ClassScope extends Scope {
    new (scopeManager: ScopeManager, upperScope: Scope, block: any): ClassScope;
  }

  export interface ScopeManager {
    new (options: any): ScopeManager;

    acquire(node: any, inner?: boolean): Scope;

    acquireAll(node: any): any;

    attach(): void;

    detach(): void;

    getDeclaredVariables(node: any): Variable[];

    isImpliedStrict(): boolean;

    isModule(): boolean;

    isStrictModeSupported(): boolean;

    release(node: any, inner?: boolean): Scope | undefined;
  }

  export interface Referencer {
    new (options: any, scopeManager: ScopeManager): Referencer;

    currentScope(): Scope;

    close(): undefined;

    pushInnerMethodDefinition(isInnerMethodDefinition: boolean): boolean;

    popInnerMethodDefinition(isInnerMethodDefinition: boolean): undefined;

    materializeTDZScope(node: any, iterationNode: any): undefined;

    materializeIterationScope(node: any): undefined;

    referencingDefaultValue(pattern: any, assignments: any[], maybeImplicitGlobal: boolean, init: boolean): undefined;

    visitPattern(node: any, options: any, callback: (node: any) => void): undefined;

    visitFunction(node: any): undefined;

    visitClass(node: any): undefined;

    visitProperty(node: any): undefined;

    visitForIn(node: any): undefined;

    visitVariableDeclaration(variableTargetScope: Scope, type: DefinitionType, node: any, index: number, fromTDZ: boolean): undefined;

    AssignmentExpression(node: any): undefined;

    CatchClause(node: any): undefined;

    Program(node: any): undefined;

    Identifier(node: any): undefined;

    UpdateExpression(node: any): undefined;

    MemberExpression(node: any): undefined;

    Property(node: any): undefined;

    MethodDefinition(node: any): undefined;

    BreakStatement(): undefined;

    ContinueStatement(): undefined;

    LabeledStatement(node: any): undefined;

    ForStatement(node: any): undefined;

    ClassExpression(node: any): undefined;

    ClassDeclaration(node: any): undefined;

    CallExpression(node: any): undefined;

    BlockStatement(node: any): undefined;

    ThisExpression(): undefined;

    WithStatement(node: any): undefined;

    VariableDeclaration(node: any): undefined;

    SwitchStatement(node: any): undefined;

    FunctionDeclaration(node: any): undefined;

    FunctionExpression(node: any): undefined;

    ForOfStatement(node: any): undefined;

    ForInStatement(node: any): undefined;

    ArrowFunctionExpression(node: any): undefined;

    ImportDeclaration(node: any): undefined;

    visitExportDeclaration(node: any): undefined;

    ExportDeclaration(node: any): undefined;

    ExportNamedDeclaration(node: any): undefined;

    ExportSpecifier(node: any): undefined;

    MetaProperty(): undefined;
  }

  export class Variable {
    public static CatchClause: string;
    public static ClassName: string;
    public static FunctionName: string;
    public static ImplicitGlobalVariable: string;
    public static ImportBinding: string;
    public static Parameter: string;
    public static TDZ: string;
    public static Variable: string;
  }

  export class Reference {
    public static READ: number;
    public static RW: number;
    public static WRITE: number;
  }

  export class ScopeManager implements ScopeManager {}

  export class Scope implements Scope {}
}
