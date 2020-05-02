import { Owner } from '@frusal/library-for-node';
import * as fs from 'fs';
import * as readline from 'readline';

export namespace CliUtils {

    export function fatalExit(...args: string[]) {
        if (args) {
            args.forEach(st => print(st));
        }
        print('\n');
        process.exit(1);
    }

    export function print(...args: string[]) {
        if (args) {
            args.forEach(st => process.stdout.write(st));
        }
    }

    export function println(...args: string[]) {
        print(...args);
        print('\n');
    }

    export async function ask(question: string, opts?: { defaultAnswer?: string; password?: boolean }): Promise<string> {
        const prompt = question + (opts?.defaultAnswer ? ' [' + opts.defaultAnswer + ']' : '') + ': ';
        const owner = new Owner();
        if (opts?.password) {
            print(prompt);
            const callback = (buffer: Buffer) => {
                const ch = buffer.toString();
                if (ch !== '\n' && ch !== '\r' && ch !== '\u0004') {
                    // Because terminal would print the letter typed (it is not an echo we could block), we have to erase the entire line.
                    readline.clearLine(process.stdout, 0);
                    readline.cursorTo(process.stdout, 0);
                    print(prompt);
                }
            };
            process.stdin.on('data', callback);
            owner.add(() => process.stdin.off('data', callback));
        }
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        owner.addCloseable(rl);
        try {
            let res = await new Promise<string>(resolve => rl.question(prompt, resolve));
            if (!res) {
                res = opts?.defaultAnswer || '';
                if (!opts?.password) {
                    readline.moveCursor(process.stdout, prompt.length, -1);
                    println(res);
                }
            }
            return res;
        } finally {
            owner.close();
        }
    }

    export function fileExists(filename: string): boolean {
        return fs.existsSync(filename);
    }

    export function readJsonFile(filename: string): any {
        const data = fs.readFileSync(filename);
        return JSON.parse(data.toString());
    }

    export function writeJsonFile(filename: string, data: any) {
        fs.writeFileSync(filename, JSON.stringify(data, null, 2) + '\n'); // indentation of 2 matches that of package.json for frusal-cli.
    }

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // eslint-disable-next-line @typescript-eslint/camelcase
    declare const __non_webpack_require__: RequireResolve & { main: NodeModule };
    export function isRunningMain() {
        // eslint-disable-next-line @typescript-eslint/camelcase
        const mainFileName = __non_webpack_require__.main ? __non_webpack_require__.main.filename : null;
        return mainFileName ===  __filename;
    }

}
