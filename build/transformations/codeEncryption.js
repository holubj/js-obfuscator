"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
require("colors");
var estraverse = __importStar(require("estraverse"));
var shuffle_array_1 = __importDefault(require("shuffle-array"));
var codeGeneration_1 = require("../codeGeneration");
var configuration_1 = require("../configuration");
var identifiers_1 = require("../identifiers");
var transformations_1 = require("../transformations");
var expressionObfuscation_1 = __importDefault(require("./expressionObfuscation"));
var literalObfuscation_1 = __importDefault(require("./literalObfuscation"));
var numberObfuscation_1 = __importDefault(require("./numberObfuscation"));
var unicodeLiteral_1 = __importDefault(require("./unicodeLiteral"));
var CodeEncryption = /** @class */ (function (_super) {
    __extends(CodeEncryption, _super);
    function CodeEncryption() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.forbiddenStatements = [
            'ReturnStatement',
            'BreakStatement',
            'ContinueStatement',
            'VariableDeclaration',
            'FunctionDeclaration',
            'FunctionExpression',
            'ArrowFunctionExpression'
        ];
        _this.sealedTopLevelFunctions = [];
        return _this;
    }
    /**
     * @returns {estree.Program}
     * @memberof CodeEncryption
     */
    CodeEncryption.prototype.apply = function () {
        var _this = this;
        var count = 0;
        var currentTopLevelFunction = '';
        estraverse.replace(this.ast, {
            enter: function (node) {
                if (currentTopLevelFunction === '' && node.type === 'FunctionDeclaration' && node.id !== null) {
                    currentTopLevelFunction = node.id.name;
                }
            },
            leave: function (node) {
                if (node.type === 'FunctionDeclaration' && node.id !== null && node.id.name === currentTopLevelFunction) {
                    currentTopLevelFunction = '';
                }
                else if (node.type === 'BlockStatement') {
                    if (!_this.isSuitableBlock(node) || _this.sealedTopLevelFunctions.includes(currentTopLevelFunction)) {
                        return;
                    }
                    if (Math.random() <= _this.settings.chance) {
                        var keyFuncDecl = _this.findSuitableFunction(currentTopLevelFunction);
                        if (keyFuncDecl === undefined) {
                            return;
                        }
                        count++;
                        var statements = [];
                        var keyIdent = identifiers_1.Identifiers.generate();
                        var clientKeyDecl = _this.generateClientKeyDecl(keyIdent, keyFuncDecl);
                        var blockCodeDecryptExpr = _this.generateBlockCodeDecryptExpr(keyFuncDecl, node, keyIdent);
                        var tryCatchExpr = _this.generateTryCatchExpression(blockCodeDecryptExpr);
                        statements.push(clientKeyDecl);
                        statements.push(tryCatchExpr);
                        var block = {
                            type: 'BlockStatement',
                            body: statements
                        };
                        var program = {
                            type: 'Program',
                            body: [block],
                            sourceType: 'module'
                        };
                        var originalVerboseState = configuration_1.Verbose.isEnabled;
                        configuration_1.Verbose.isEnabled = false;
                        new literalObfuscation_1.default(program, {
                            splitChance: 0.8,
                            arrayChance: 0,
                            base64Chance: 0.8
                        }).apply();
                        new unicodeLiteral_1.default(program).apply();
                        new expressionObfuscation_1.default(program, {
                            booleanChance: 0.8,
                            undefinedChance: 0.8
                        }).apply();
                        new numberObfuscation_1.default(program, {
                            chance: 0.5
                        }).apply();
                        configuration_1.Verbose.isEnabled = originalVerboseState;
                        return program.body[0];
                    }
                }
            }
        });
        configuration_1.Verbose.log((count + " code blocks encrypted").yellow);
        return this.ast;
    };
    /**
     * @protected
     * @param {estree.Node} expression
     * @returns {boolean}
     * @memberof CodeEncryption
     */
    CodeEncryption.prototype.isSuitableBlock = function (expression) {
        var _this = this;
        var suitable = true;
        estraverse.traverse(expression, {
            enter: function (node) {
                if (_this.forbiddenStatements.includes(node.type)) {
                    suitable = false;
                }
            }
        });
        return suitable;
    };
    /**
     * @protected
     * @param {string} forbidden
     * @returns {(estree.FunctionDeclaration | undefined)}
     * @memberof CodeEncryption
     */
    CodeEncryption.prototype.findSuitableFunction = function (forbidden) {
        var functions = [];
        for (var _i = 0, _a = this.ast.body; _i < _a.length; _i++) {
            var statement = _a[_i];
            if (statement.type === 'FunctionDeclaration' && statement.id !== null && statement.id.name !== forbidden) {
                functions.push(statement);
            }
        }
        functions = shuffle_array_1.default(functions);
        var result = functions.pop();
        if (result !== undefined) {
            // @ts-ignore
            this.sealedTopLevelFunctions.push(result.id.name);
        }
        return result;
    };
    /**
     * @protected
     * @param {string} keyIdent
     * @param {estree.FunctionDeclaration} keyFuncDecl
     * @returns {estree.VariableDeclaration}
     * @memberof CodeEncryption
     */
    CodeEncryption.prototype.generateClientKeyDecl = function (keyIdent, keyFuncDecl) {
        var resultIdent = identifiers_1.Identifiers.generate();
        var numIdent = identifiers_1.Identifiers.generate();
        var indexIdent = identifiers_1.Identifiers.generate();
        return {
            type: 'VariableDeclaration',
            declarations: [
                {
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: keyIdent
                    },
                    init: {
                        type: 'CallExpression',
                        callee: {
                            type: 'MemberExpression',
                            object: {
                                type: 'CallExpression',
                                callee: {
                                    type: 'MemberExpression',
                                    object: {
                                        type: 'CallExpression',
                                        callee: {
                                            type: 'MemberExpression',
                                            object: {
                                                type: 'Identifier',
                                                name: keyFuncDecl.id ? keyFuncDecl.id.name : ''
                                            },
                                            property: {
                                                type: 'Literal',
                                                value: 'toString'
                                            },
                                            computed: true
                                        },
                                        arguments: []
                                    },
                                    property: {
                                        type: 'Literal',
                                        value: 'split'
                                    },
                                    computed: true
                                },
                                arguments: [
                                    {
                                        type: 'Literal',
                                        value: ''
                                    }
                                ]
                            },
                            property: {
                                type: 'Literal',
                                value: 'reduce'
                            },
                            computed: true
                        },
                        arguments: [
                            {
                                type: 'FunctionExpression',
                                id: null,
                                generator: false,
                                params: [
                                    {
                                        type: 'Identifier',
                                        name: resultIdent
                                    },
                                    {
                                        type: 'Identifier',
                                        name: numIdent
                                    },
                                    {
                                        type: 'Identifier',
                                        name: indexIdent
                                    }
                                ],
                                body: {
                                    type: 'BlockStatement',
                                    body: [
                                        {
                                            type: 'ReturnStatement',
                                            argument: {
                                                type: 'BinaryExpression',
                                                left: {
                                                    type: 'Identifier',
                                                    name: resultIdent
                                                },
                                                operator: '^',
                                                right: {
                                                    type: 'BinaryExpression',
                                                    operator: '+',
                                                    left: {
                                                        type: 'CallExpression',
                                                        callee: {
                                                            type: 'MemberExpression',
                                                            object: {
                                                                type: 'Identifier',
                                                                name: numIdent
                                                            },
                                                            property: {
                                                                type: 'Literal',
                                                                value: 'charCodeAt'
                                                            },
                                                            computed: true
                                                        },
                                                        arguments: [
                                                            {
                                                                type: 'Literal',
                                                                value: 0
                                                            }
                                                        ]
                                                    },
                                                    right: {
                                                        type: 'Identifier',
                                                        name: indexIdent
                                                    }
                                                }
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                type: 'Literal',
                                value: 0
                            }
                        ]
                    }
                }
            ],
            kind: 'var'
        };
    };
    /**
     * @protected
     * @param {estree.FunctionDeclaration} keyFuncDecl
     * @param {estree.BlockStatement} blockNode
     * @param {string} keyIdent
     * @returns {estree.CallExpression}
     * @memberof CodeEncryption
     */
    CodeEncryption.prototype.generateBlockCodeDecryptExpr = function (keyFuncDecl, blockNode, keyIdent) {
        var key = codeGeneration_1.CodeGeneration.generate(keyFuncDecl)
            .split('')
            .reduce(function (result, code, index) {
            return result ^ (code.charCodeAt(0) + index);
        }, 0);
        var block = codeGeneration_1.CodeGeneration.generate(blockNode);
        var encrypted = [];
        block.split('').map(function (value) {
            encrypted.push({
                type: 'Literal',
                value: value.charCodeAt(0) ^ key
            });
        });
        var encryptedArrayExpression = {
            type: 'ArrayExpression',
            elements: encrypted
        };
        var valueIdent = identifiers_1.Identifiers.generate();
        return {
            type: 'CallExpression',
            callee: {
                type: 'MemberExpression',
                object: {
                    type: 'CallExpression',
                    callee: {
                        type: 'MemberExpression',
                        object: encryptedArrayExpression,
                        property: {
                            type: 'Literal',
                            value: 'map'
                        },
                        computed: true
                    },
                    arguments: [
                        {
                            type: 'FunctionExpression',
                            id: null,
                            generator: false,
                            params: [
                                {
                                    type: 'Identifier',
                                    name: valueIdent
                                }
                            ],
                            body: {
                                type: 'BlockStatement',
                                body: [
                                    {
                                        type: 'ReturnStatement',
                                        argument: {
                                            type: 'CallExpression',
                                            callee: {
                                                type: 'MemberExpression',
                                                object: {
                                                    type: 'Identifier',
                                                    name: 'String'
                                                },
                                                property: {
                                                    type: 'Literal',
                                                    value: 'fromCharCode'
                                                },
                                                computed: true
                                            },
                                            arguments: [
                                                {
                                                    type: 'BinaryExpression',
                                                    left: {
                                                        type: 'Identifier',
                                                        name: valueIdent
                                                    },
                                                    operator: '^',
                                                    right: {
                                                        type: 'Identifier',
                                                        name: keyIdent
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                },
                property: {
                    type: 'Literal',
                    value: 'join'
                },
                computed: true
            },
            arguments: [
                {
                    type: 'Literal',
                    value: ''
                }
            ]
        };
    };
    /**
     * @protected
     * @param {estree.CallExpression} blockCodeDecryptExpr
     * @returns {estree.TryStatement}
     * @memberof CodeEncryption
     */
    CodeEncryption.prototype.generateTryCatchExpression = function (blockCodeDecryptExpr) {
        return {
            type: 'TryStatement',
            block: {
                type: 'BlockStatement',
                body: [
                    {
                        type: 'ExpressionStatement',
                        expression: {
                            type: 'CallExpression',
                            callee: {
                                type: 'Identifier',
                                name: 'eval'
                            },
                            arguments: [blockCodeDecryptExpr]
                        }
                    }
                ]
            },
            handler: {
                type: 'CatchClause',
                param: {
                    type: 'Identifier',
                    name: 'e'
                },
                body: {
                    type: 'BlockStatement',
                    body: []
                }
            }
        };
    };
    return CodeEncryption;
}(transformations_1.BaseTransformation));
module.exports = CodeEncryption;
