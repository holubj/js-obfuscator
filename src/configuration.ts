import * as fs from 'fs';
import * as yaml from 'js-yaml';

export let configuration: any = {};

try {
  configuration = yaml.safeLoad(fs.readFileSync(__dirname + '/../config.yaml', 'utf8'));
} catch (err) {
  process.exit(1);
}

export class Verbose {
  public static isEnabled: boolean = false;

  /**
   * @static
   * @param {*} [message]
   * @memberof Verbose
   */
  public static log(message?: any): void {
    if (this.isEnabled) {
      console.log(message);
    }
  }
}
Verbose.isEnabled = configuration.verbose;
