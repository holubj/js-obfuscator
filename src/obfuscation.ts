import escodegen from 'escodegen';
import esmangle from 'esmangle';
import espree from 'espree';
import { Program } from 'estree';
import esvalid from 'esvalid';
import * as fs from 'fs';
import { BaseTransformation, transformations } from './transformations';

Error.stackTraceLimit = Infinity;

if (process.argv.length < 3) {
  console.log('Usage: node ' + process.argv[1] + ' FILENAME');
  process.exit(1);
}

let code: string = '';

const inputFile: string = process.argv[2];
try {
  code = fs.readFileSync(inputFile).toString('utf8');
} catch (err) {
  console.log(`Unable to read input file ${inputFile}`);
  process.exit(1);
}

let p: Program = espree.parse(code);

p = esmangle.optimize(p, null);
p = esmangle.mangle(p);

for (const definition of transformations) {
  const transformationClass: any = require(definition.file);
  const transformation: BaseTransformation = new transformationClass(p);
  p = transformation.apply();
}

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
