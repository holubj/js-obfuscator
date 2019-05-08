import 'colors';
import esmangle from 'esmangle';
import espree from 'espree';
import * as estree from 'estree';
import * as fs from 'fs';
import { CodeGeneration } from './codeGeneration';
import { configuration, Verbose } from './configuration';
import { Identifiers } from './identifiers';
import { InsertPosition } from './insertPosition';
import { BaseTransformation, canBeObfuscated } from './transformations';
import IdentifierRenaming from './transformations/identifierRenaming';

Error.stackTraceLimit = Infinity;

if (process.argv.length < 3) {
  console.log('Usage: npm run inputFile [outputFile]');
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

let outputFile: string = inputFile + '.obf';
if (process.argv.length > 3) {
  outputFile = process.argv[3];
}

let p: estree.Program = espree.parse(code, {
  ecmaVersion: configuration.ecmaVersion
});

if (configuration.optimizeInput) {
  p = esmangle.optimize(p);
}

if (canBeObfuscated(p)) {
  Identifiers.init(p);
  InsertPosition.init(p);

  if (configuration.identifiers.rename) {
    p = new IdentifierRenaming(p, {
      renameGlobals: configuration.identifiers.renameGlobals
    }).apply();
  }

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

  if (configuration.optimizeOutput) {
    p = esmangle.optimize(p);
  }

  const result: string = CodeGeneration.generate(p);

  fs.writeFileSync(outputFile, result);
} else {
  console.log("Program with 'eval' or 'with' command cannot be obfuscated".red);
}
