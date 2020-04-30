/*!
Copyright Fruit Salad Tech Pty Ltd. All Rights Reserved.
*/
import { NodeStorage, PortableUtils } from '@frusal/library-for-node';
import { CliConfig } from 'config';
import { CliConnection } from 'connection';
import * as fs from 'fs';
import * as path from 'path';
import { CliSchema } from 'schema';
import { CliWizard } from 'wizard';

// Export entire library to enable CLI package to be used as a library for other scripts. Specifically for create-database.mjs type of scripts.
export * from '@frusal/library-for-node';

const FRUSAL_DESCRIPTION = 'CLI script to install and configure frusal.com workspace access library with static type checking against live schema.';

function help(status: number, message?: string) {
    const print = (status === 0) ? console.log : console.error;
    if (message) {
        print(message);
    }
    const exe = path.basename(process.argv[1]);
    if (status !== 0) {
        print(`usage: ${exe} [status | st | login | li | logout | lo | update | up | watch | w | version | v | help | h]`);
    } else {
        print();
        print(FRUSAL_DESCRIPTION);
        print();
        print(`Usage:`);
        print(`  frusal <command> [parameter, ...]`);
        print();
        print(`Commands:`);
        print(`    status, st  - prints login status to the console`);
        print(`    login [username [workspace [password]]], li  - login to workspace at frusal.com`);
        print(`    workspace [workspace], ws  - sets workspace`);
        print(`    logout, lo  - logout`);
        print(`    update, up  - updates schema related declarations and source code`);
        print(`    watch, w    - watches for the schema changes online and execute updates (process runs until ^C)`);
        print(`    version, v  - prints version numbers`);
        print(`    help, h     - prints this help`);
        print();
        print(`Examples:`);
        print(`    frusal login  - asks for user name and password, then lets you choose a workspace through the terminal UI`);
        print(`    frusal login 'fred' ws_c1i09b  - asks for password and logs into frusal.com workspace 'ws_c1i09b' as user 'fred'`);
        print(`    frusal workspace  - asks to choose a workspace`);
        print(`    frusal st     - displays the connection status`);
        print(`    frusal up     - updates schema declarations in source code`);
        print(`    frusal watch  - watches for the changes in real-time and updates the source code`);
        print();
    }
    process.exit(status);
}

async function main(...args: string[]) {
    try {
        const cmd = args[2];
        if (cmd == null) {
            if (!CliConfig.fileExists()) {
                await CliWizard.run();
            } else {
                help(1);
            }
        } else if (cmd === 'help' || cmd === 'h' || cmd === '--help' || cmd === '-h' || cmd === '-?' || cmd === '/?') {
            help(0);
        } else if (cmd === 'version' || cmd === 'v' || cmd === '--version' || cmd === '-v') {
            const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json')).toString());
            console.log(packageJson.version);
        } else {
            const connection = new CliConnection();
            await connection.open();
            const schema = new CliSchema(connection.session);
            if (cmd === 'status' || cmd === 'st') {
                console.log(FRUSAL_DESCRIPTION);
                console.log();
                console.log(`User preferences: ${(PortableUtils.userStorage as NodeStorage).filename} (first in ancestry)`);
                console.log(`Base directory: ${path.resolve()}`);
                console.log(CliConfig.status());
                console.log();
                console.log(await connection.status());
                console.log();
                console.log(await schema.status());
            } else if (cmd === 'login' || cmd === 'li') {
                await connection.login(args[3], args[4], args[5]);
                console.log(await connection.status());
            } else if (cmd === 'workspace' || cmd === 'ws') {
                await connection.workspace(args[3]);
                console.log(await connection.status());
            } else if (cmd === 'logout' || cmd === 'lo') {
                await connection.logout();
            } else if (cmd === 'update' || cmd === 'up') {
                await connection.ensureConnected();
                await schema.update();
            } else if (cmd === 'watch' || cmd === 'w' || cmd === '--watch') {
                await connection.ensureConnected();
                await schema.watch();
            } else {
                help(1, `ERROR: Unrecognised command: '${cmd}'.`);
            }
            connection.close();
        }
    } catch (e) {
        console.warn(e);
    } finally {
        process.exit(0);
    }
}

// eslint-disable-next-line @typescript-eslint/camelcase
declare const __non_webpack_require__: RequireResolve & { main: NodeModule };
// eslint-disable-next-line @typescript-eslint/camelcase
const mainFileName = __non_webpack_require__.main ? __non_webpack_require__.main.filename : null;

// Running as a "main" or as a "module" (for when it is used as a library)
if (mainFileName ===  __filename) {
    main(...process.argv);
}
