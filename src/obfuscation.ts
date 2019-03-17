import 'colors';
import escodegen from 'escodegen';
import esmangle from 'esmangle';
import espree from 'espree';
import * as estree from 'estree';
import esvalid from 'esvalid';
import * as fs from 'fs';
import { configuration, Verbose } from './configuration';
import { Identifiers } from './identifiers';
import { InsertPosition } from './insertPosition';
import { BaseTransformation } from './transformations';

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

let p: estree.Program = espree.parse(code);
// p = esmangle.optimize(p, null);
// p = esmangle.mangle(p);

Identifiers.init(p);
InsertPosition.init(p);

for (const item of configuration.stream) {
  if (item.enabled) {
    const transformationClass: any = require(item.file);
    const transformation: BaseTransformation = new transformationClass(p, item.settings);
    Verbose.log(`Transformation '${item.name}' started`.green.bold);
    p = transformation.apply();
    Verbose.log(`Transformation '${item.name}' finished`.green.bold);
  }
}

const result: string = escodegen.generate(p, {
  format: {
    renumber: true,
    hexadecimal: true,
    escapeless: true,
    compact: true,
    semicolons: false,
    parentheses: false
  },
  verbatim: 'x-verbatim-property'
});

console.log(result);
