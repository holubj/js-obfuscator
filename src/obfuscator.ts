import escodegen from 'escodegen';

const result: string = escodegen.generate({
  type: 'BinaryExpression',
  operator: '+',
  left: {
    type: 'Literal',
    value: 40
  },
  right: {
    type: 'Literal',
    value: 3
  }
});

console.log(result);
