import { ActualWorkspace, ClassSpec, Feature, Module, NameUtils, Owner, Property, Session } from '@frusal/library-for-node';
import * as fs from 'fs';
import * as path from 'path';
import { CliConfig } from './config';
import './mixins';

// the module and mixin declaration file names should be different because typescript chooses ts over d.ts thinking that they are duplicating each other. (i.e., .d.ts is a compiled version of .ts)
const TS_DECLARATIONS_SUFFIX = 'rt';

export class CliSchema {

    private updateCount = 0;

    constructor(
        readonly session: Session,
    ) { }

    async status(): Promise<string> {
        if (this.session.workspace) {
            const ws = this.session.workspace;
            const workspace = await ws.withTempStageAsyncExpression(stage => stage.transact(tx => tx.getSingletonInstance(ActualWorkspace)));
            let res = '';
            workspace.modules.forEach(module => {
                if (!module.system) {
                    res += `Classes in '${module.name}':\n`;
                    module.classes.forEach(clazz => {
                        res += ` - ${clazz.name}\n`;
                    });
                }
            });
            return res;
        } else {
            return '';
        }
    }

    async update(): Promise<void> {
        const ws = this.session.workspace;
        const workspace = await ws.withTempStageAsyncExpression(stage => stage.transact(tx => tx.getSingletonInstance(ActualWorkspace)));
        console.log(`Updating schema changes for workspace '${workspace.name}' (${ws.details.GUID}), connected as '${this.session.user.loginId}'`);
        console.log(`Source code model location: ${CliConfig.sourceCodeModelLocation}`);
        console.log();
        await this._update(workspace);
    }

    async watch(): Promise<void> {
        const owner = new Owner();
        const ws = this.session.workspace;
        const stage = owner.addCloseable(ws.getStage('cli.watcher', { autoupdate: true }));
        try {
            await stage.opened();
            const workspace = stage.transact(tx => tx.getSingletonInstance(ActualWorkspace));

            console.log(`Watching schema changes at workspace '${workspace.name}' (${ws.details.GUID}), connected as '${this.session.user.loginId}'...`);
            console.log(`Source code model location: ${CliConfig.sourceCodeModelLocation}`);
            console.log();

            // subscribe for stage model changes
            stage.notifications.subscribe(evt => { if (evt.type === 'model-updated') this._update(workspace); });

            // initial update
            this._update(workspace);

            await new Promise(() => null); // NEVER RETURNS
        } finally {
            owner.close();
        }
    }

    private async _update(workspace: ActualWorkspace): Promise<void> {
        console.log(`Updating on ${new Date().toLocaleString()}...`);

        workspace.modules.forEach(module => {
            if (!module.system) {
                // Consider location directory and existing files
                const dir = path.resolve(CliConfig.sourceCodeModelLocation);
                fs.mkdirSync(dir, { recursive: true });
                const declarationsFilename = path.join(dir, `${NameUtils.toKebabCase(module.name)}.${TS_DECLARATIONS_SUFFIX}.d.ts`);
                const stubsFileName = path.join(dir, `${NameUtils.toKebabCase(module.name)}.${CliConfig.sourceInTypeScript ? 'ts' : CliConfig.sourceJavaScriptExtension}`);
                const stubsOldContent = fs.existsSync(stubsFileName) ? fs.readFileSync(stubsFileName).toString() : null;

                // Generate code
                const declarations = generateDeclarations(module);
                const stubs = generateStubs(module, stubsOldContent);

                // Write to files
                writeToFileIfNotChanged(declarationsFilename, declarations);
                writeToFileIfNotChanged(stubsFileName, stubs);
            }
        });

        // This is to improve visual confirmation that refresh has occurred in a scrolling window.
        const flag = ++this.updateCount <= 1 ? '' : this.updateCount <= 4 ? ' #' + this.updateCount : ` ${'-\\|/'.charAt(this.updateCount % 4)}`;
        console.log(`Done${flag}`);
        console.log();
    }

}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function writeToFileIfNotChanged(file: string, content: string) {
    const oldContent = fs.existsSync(file) ? fs.readFileSync(file).toString() : null;
    if (oldContent !== content) {
        fs.writeFileSync(file, content);
        console.log('  ' + path.relative(process.cwd(), file));
    }
}

function descriptionToComment(res: string[], tab: string, ent: Feature) {
    if (ent.description) {
        const lines = ent.description.split(/\n/);
        if (lines.length > 1) {
            res.push(tab + '/**');
            lines.forEach(ln => res.push(tab + ' * ' + ln));
            res.push(tab + ' */');
        } else {
            res.push(tab + '/** ' + ent.description + ' */');
        }
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Rewrite TSD declarations

function generateDeclarations(module: Module) {
    // Generate file content
    const res: string[] = [];
    res.push('/* GENERATED FILE - DO NOT EDIT */');
    res.push('');
    res.push(`import { Stage, Entity, ClassSpec, Property, PrimitiveValue, ReferenceValue, InversedSet } from '${CliConfig.libraryPackageName}';`); // declarations are in typescript (no require)...
    res.push('');
    res.push(`declare module './${NameUtils.toKebabCase(module.name)}' {`);
    module.classes.forEach(clazz => {
        const className = NameUtils.toPascalCase(clazz.name);
        const extendsClassName = clazz.ancestor ? NameUtils.toPascalCase(clazz.ancestor.name) : 'Entity';
        res.push(``);
        descriptionToComment(res, '    ', clazz);
        // TODO, here we should properly initialise inheritance clause, and then only include fields which belongs to this class (exclude ancestors).
        res.push(`    interface ${className} extends ${extendsClassName} {`);
        clazz.fieldsIncludeAncestors.forEach(prop => {
            if (prop instanceof Property) {
                descriptionToComment(res, '        ', prop);
                res.push('        ' + prop.type.tsDeclaration(prop));
            }
        });
        res.push(`    }`);
        res.push(`    // ${className} instance metadata`);
        res.push(`    interface ${className} extends ${extendsClassName} {`);
        clazz.fieldsIncludeAncestors.forEach(prop => {
            if (prop instanceof Property) {
                if (prop.type.tsMetaDeclaration) {
                    res.push('        ' + prop.type.tsMetaDeclaration(prop));
                }
            }
        });
        res.push(`    }`);
        res.push(`    // ${className} class metadata`);
        res.push(`    namespace ${className} {`);
        res.push(`        /** ${clazz.name} class spec ID (${clazz.id}). */`);
        res.push(`        const classSpecId: string;`);
        res.push(`        function classSpec(stage: Stage): ClassSpec;`);
        clazz.fieldsIncludeAncestors.forEach(prop => {
            if (prop instanceof Property) {
                res.push(`        const ${NameUtils.toCamelCase(prop.name)}_prop: Property;`);
            }
        });
        res.push(`    }`);
    });
    res.push(`}`);
    return res.join('\n') + '\n';
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Augment Concrete classes

function generateStubs(module: Module, stubsOldContent: string): string {
    function classDef(clazz: ClassSpec) {
        const extendsClassName = clazz.ancestor ? NameUtils.toPascalCase(clazz.ancestor.name) : 'Entity';
        return `class ${NameUtils.toPascalCase(clazz.name)} extends ${extendsClassName}`;
    }
    function classStub(clazz: ClassSpec): string[] {
        const res: string[] = [];
        res.push(``);
        res.push(`${CliConfig.sourceUseRequireJs ? '' : 'export '}${classDef(clazz)} {`);
        res.push(`    // nothing yet`);
        res.push(`}`);
        const name = NameUtils.toPascalCase(clazz.name);
        if (CliConfig.sourceUseRequireJs) {
            res.push(`exports.${name} = ${name};`);
        }
        res.push(`session.factory.registerUserClass(${name});`);
        return res;
    }
    if (stubsOldContent) {
        let res = stubsOldContent;
        module.classes.forEach(clazz => {
            let found = false;
            const regExp = new RegExp(`class\\s+${NameUtils.toPascalCase(clazz.name)}\\s+(extends\\s+\\w+\\s+)?{`, 'g');
            res = res.replace(regExp, () => { found = true; return classDef(clazz) + ' {'; });
            if (!found) {
                // And a new stub to the bottom
                res += classStub(clazz).join('\n') + '\n';
            }
        });
        return res;
    } else {
        // Generate new file content
        const res: string[] = [];
        if (!CliConfig.sourceInTypeScript) {
            res.push('// @ts-check');
        }
        res.push(`/// <reference types="./${NameUtils.toKebabCase(module.name)}.${TS_DECLARATIONS_SUFFIX}" />`);
        res.push('');
        res.push('/* GENERATED STUB, remove this comment and take over development of this code. */');
        res.push('');
        if (CliConfig.sourceUseRequireJs) {
            res.push(`const { session, Entity } = require('${CliConfig.libraryPackageName}');`);
        } else {
            res.push(`import { session, Entity } from '${CliConfig.libraryPackageName}';`);
        }
        module.classes.forEach(clazz => res.push(...classStub(clazz)));
        return res.join('\n') + '\n';
    }
}
