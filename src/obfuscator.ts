import escodegen from 'escodegen';
import esmangle from 'esmangle';
import espree from 'espree';
import { Program } from 'estree';
import esvalid from 'esvalid';

Error.stackTraceLimit = Infinity;

let p: Program = espree.parse(
  'function sum(alpha, beta){return alpha + beta;} console.log(sum(2, 3));'
);

p = esmangle.optimize(p, null);
p = esmangle.mangle(p);

const result: string = escodegen.generate(p, {
  format: {
    renumber: true,
    hexadecimal: true,
    escapeless: true,
    compact: true,
    semicolons: false,
    parentheses: false
  }
});

console.log(result);
