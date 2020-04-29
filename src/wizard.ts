import { Flow } from '@frusal/library-for-node';
import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { CliConfig } from './config';
import { CliUtils } from './utils';

const PACKAGE_JSON = 'package.json';
const TSCONFIG_JSON = 'tsconfig.json';
const FRUSAL_DEPENDENCY = 'frusal';
const SCRIPT_NAME = 'frusal';
const SCRIPT_COMMAND = 'frusal';
const CLI_NPM_PACKAGE_NAME = 'frusal';

export type DistFolder = 'frusal-cli' | 'library-for-browser' | 'library-for-node' | 'library'; // There is a mirror definition in frusal/library/webpack/tasks.ts we should keep in sync with

export namespace CliWizard {

    export async function run(): Promise<void> {

        // Check if this is a npm project directory
        const nodePackage = fs.existsSync(PACKAGE_JSON) ? JSON.parse(fs.readFileSync(PACKAGE_JSON).toString()) : null;
        if (!nodePackage) {
            CliUtils.println(`The current directory is missing "${PACKAGE_JSON}" file, which is expected in the root of any npm project.`);
            CliUtils.println('// Tip: You can initialize a new npm project with `npm init` command.');
            CliUtils.println(`Frusal library cannot be initialized here.`);
            return;
        }

        // Check the GIT state
        try {
            const gitDiff = childProcess.execSync('git status -s', { stdio: ['pipe', 'pipe', 'ignore'] }).toString();
            if (gitDiff !== '') {
                CliUtils.println('Consider `git commit` outstanding changes to isolate the changes done by this installation.');
                if ((await CliUtils.ask('Do you want to continue?', { defaultAnswer: 'no' })).toLowerCase() !== 'yes') {
                    CliUtils.fatalExit(`Installation cancelled.`);
                }
            }
        } catch (e) {
            CliUtils.println('If you are using any source control system like git or svn, you might want to check in any outstanding changes to isolate the changes done by this installation.');
            if ((await CliUtils.ask('Do you want to continue?', { defaultAnswer: 'yes' })).toLowerCase() !== 'yes') {
                CliUtils.fatalExit(`Installation cancelled.`);
            }
        }

        // Explain what is happening
        CliUtils.println();
        CliUtils.println(`Initialising ${nodePackage.name} npm project for frusal library which allows to connect to frusal.com workspace.`);

        // Get library package name
        CliUtils.println();
        CliUtils.println('Please choose library type:');
        const LIBRARY_ENABLEMENT: { [name in DistFolder]: string } = {
            'frusal-cli': null,
            'library-for-browser': 'Bundled library designed to run in a browser with no external dependencies.',
            'library-for-node': 'Bundled library designed to run under node.js with no external dependencies.',
            'library': 'Core library with "autobahn" and "rxjs" dependencies.',
        };
        const LIBRARY_OPTIONS = Object.getOwnPropertyNames(LIBRARY_ENABLEMENT).map(name => ({name, desc: LIBRARY_ENABLEMENT[name as DistFolder]})).filter(arg => arg.desc);
        LIBRARY_OPTIONS.forEach((arg, index) => CliUtils.println(`  [${index + 1}] @frusal/${arg.name}: ${arg.desc}`));
        const libraryPackageIndex = await CliUtils.ask('Library type', { defaultAnswer: '1' });
        const libraryPackageName = '@frusal/' + LIBRARY_OPTIONS[Number(libraryPackageIndex) - 1].name;

        // Get JavaScript / TypeScript preference
        CliUtils.println();
        CliUtils.println('Please choose generated source code language:');
        CliUtils.println('  [1] ECMAScript (aka JavaScript)');
        CliUtils.println('  [2] TypeScript');
        const outputTypeScript = await CliUtils.ask('Source code', {defaultAnswer: fs.existsSync(TSCONFIG_JSON) ? '2' : '1'}) === '2';

        // Get use modules
        let sourceUseRequireJs = false;
        if (!outputTypeScript) {
            CliUtils.println();
            CliUtils.println('Please choose generated source code module loader type:');
            CliUtils.println('  [1] ECMAScript 6 Modules (using import statements) *recommended*');
            CliUtils.println('  [2] RequireJS (using require() function)');
            sourceUseRequireJs = await CliUtils.ask('Module loader', {defaultAnswer: '1'}) === '2';
            if (sourceUseRequireJs) {
                CliUtils.println();
                CliUtils.println('Warning:');
                CliUtils.println('   There is a known problem getting vscode and the tools it\'s using to perform declaration merging when using RequireJS module system.');
                CliUtils.println('   More on TS declaration merging: https://www.typescriptlang.org/docs/handbook/declaration-merging.html');
                await CliUtils.ask('Please read the note above', {defaultAnswer: 'ok' });
            }
        }

        // Get source code location
        CliUtils.println();
        const sourceCodeModelLocation = await CliUtils.ask('Source code model location', {defaultAnswer: fs.existsSync('src') ? path.join('src', 'model') : '.' });

        // Check if frusal is installed as a runtime dependency
        CliUtils.println();
        if (!nodePackage.dependencies || !nodePackage.dependencies[FRUSAL_DEPENDENCY]) {
            CliUtils.println('Installing "frusal" npm dependency...');
            [`npm install ${libraryPackageName} --save`, `npm install ${CLI_NPM_PACKAGE_NAME} --save-dev`].forEach(cmd => {
                try {
                    childProcess.execSync(cmd);
                } catch (e) {
                    // CliUtils.println(e); // no need - the stderr output is already printed to the user.
                    CliUtils.println();
                    CliUtils.fatalExit(`ERROR: Unable to run \`${cmd}\` command. Try to run it manually and then restart this initialisation.`);
                }
            });
        }

        // Add frusal script to project.json
        {
            const latestNodePackage = JSON.parse(fs.readFileSync(PACKAGE_JSON).toString());
            latestNodePackage.scripts = { ...latestNodePackage.scripts, [SCRIPT_NAME]: SCRIPT_COMMAND };
            latestNodePackage.type = sourceUseRequireJs ? 'requirejs' : 'module';
            CliUtils.writeJsonFile(PACKAGE_JSON, latestNodePackage);
        }

        // Last: save the config, so this wizard would not be launched next time
        Flow.checkThat(!CliConfig.fileExists());
        CliConfig.sourceInTypeScript = outputTypeScript;
        CliConfig.libraryPackageName = libraryPackageName;
        CliConfig.sourceCodeModelLocation = sourceCodeModelLocation;
        CliConfig.sourceUseRequireJs = sourceUseRequireJs;
        Flow.checkThat(CliConfig.fileExists());

        // Done.
        CliUtils.println();
        CliUtils.println(` * Frusal.com access library is successfully initialised for project ${nodePackage.name}.`);
        CliUtils.println(` * Next, please login and start updating your source code stabs and schema declarations.`);
        CliUtils.println( ' * You can use `npm run frusal login`, `npm run frusal update` or `npm run frusal watch` commands.');
        CliUtils.println();

        await CliUtils.ask('Please read the note above', {defaultAnswer: 'ok' });
        CliUtils.println(`Thank you.`);
        CliUtils.println();
    }

}
