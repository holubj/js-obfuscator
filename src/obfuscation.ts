import 'colors';
import esmangle from 'esmangle';
import espree from 'espree';
import * as estree from 'estree';
import esvalid from 'esvalid';
import * as fs from 'fs';
import { CodeGeneration } from './codeGeneration';
import { configuration, Verbose } from './configuration';
import { Identifiers } from './identifiers';
import { InsertPosition } from './insertPosition';
import { BaseTransformation, isSuitable } from './transformations';

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

if (isSuitable(p)) {
  Identifiers.init(p);
  InsertPosition.init(p);

  for (const item of configuration.stream) {
    if (item.enabled) {
      const transformationClass: any = require(item.file);
      const transformation: BaseTransformation = new transformationClass(p, item.settings);
      Verbose.log(`Transformation '${item.name}' `.green + 'started'.green.bold);
      p = transformation.apply();
      Verbose.log(`Transformation '${item.name}' `.green + 'finished'.green.bold);
      Verbose.log('---------------------');
    }
  }

  const result: string = CodeGeneration.generate(p);

  console.log(result);
} else {
  console.log("Program with 'eval' or 'with' command cannot be obfuscated".red);
}
