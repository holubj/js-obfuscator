# JavaScript minifier & obfuscator

Javascript minifier and obfuscator written in TypeScript.

Contains the following transformations:

- Comments and whitespace characters deletion
- Redundant code deletion (unnecessary parentheses, ..)
- Code optimization (dead code elimination, expression simplification, ..)
- Identifiers renaming
- Stopping debugger in a loop
- Split of variable declarations and their location randomization
- Numbers obfuscation
- Expressions obfuscation
- Randomizing the order of function parameters
- Operators outlining (unary, binary, assignment)
- Console redefinition
- Strings obfuscation
- Randomizing the order of function definitions
- Function merging
- Code outlining into eval
- **Code encryption** and **integrity protection**

Each transformation can be configured in `config.yaml` file.

## Installation

```
npm install
```

## Usage

```
npm start <inputFile> [<outputFile>]
```
