import { ActualWorkspace, Flow, NameUtils, Session } from '@frusal/library-for-node';
import { CliConfig } from './config';
import { CliUtils } from './utils';

export class CliConnection {

    readonly session = new Session();

    async open(): Promise<void> {
        if (this.session.user && CliConfig.workspace) {
            await this.session.login({ workspace: CliConfig.workspace });
        }
    }

    async status(): Promise<string> {
        if (!this.session.user) {
            return 'NOT CONNECTED. Please login with `frusal login`.';
        } else if (!this.session.workspace) {
            return 'NOT CONNECTED. Please choose a workspace.';
        } else {
            const ws = this.session.workspace;
            const workspace = await ws.withTempStageAsyncExpression(stage => stage.transact(tx => tx.getSingletonInstance(ActualWorkspace)));
            return `CONNECTED to workspace '${workspace.name}' (${ws.details.GUID}) as '${this.session.user.loginId}'`;
        }
    }

    async ensureConnected(): Promise<void> {
        if (!this.session.workspace) {
            console.warn('NOT CONNECTED. Please login with `frusal login`.');
            process.exit(1);
        }
    }

    async login(loginId?: string, workspace?: string, password?: string): Promise<void> {
        while (!loginId) {
            loginId  = await CliUtils.ask('Frusal login', { defaultAnswer: this.session.user?.loginId || CliConfig.defaultUsername });
        }
        if (loginId !== this.session.user?.loginId) {
            if (!password && loginId) {
                password  = await CliUtils.ask('Password', { defaultAnswer: CliConfig.defaultPassword, password: true });
            }
            await this.session.login({ loginId: loginId, password: password, advanced: { baseURL: CliConfig.developmentServer }, rememberMe: true });
        } else {
            CliUtils.println('Already logged in.');
        }
        Flow.checkThat(this.session.user != null, 'There is no user login.');
        Flow.checkThat(this.session.user && this.session.user.workspaces.length > 0, 'There are no workspaces configured for this account.');

        await this.workspace(workspace);
    }

    async workspace(workspace?: string): Promise<void> {
        Flow.checkThat(this.session.user != null, `The user must be logged on before we can set the workspace. Try 'frusal login' command.`);
        if (workspace) {
            const ws = this.session.user.workspaces.find(w => w.GUID === workspace || w.name === workspace || NameUtils.toKebabCase(w.name) === workspace);
            Flow.checkThat(ws != null, `Workspace '${workspace}' is not found. Available workspaces for '${this.session.user.loginId}' `
             + `are: ${this.session.user.workspaces.map(w => `'${w.name}' (${w.GUID})`).join(', ')}.`);
        } else {
            CliUtils.println(`Please choose a workspace:`);
            this.session.user.workspaces.map((w, i) => CliUtils.println(`  [${i + 1}] ${w.name}`));
            const workspaceIndex = await CliUtils.ask('Workspace', { defaultAnswer: '1' });
            const ws = this.session.user.workspaces[Number(workspaceIndex) - 1];
            Flow.checkThat(ws != null, 'No workspace selected.');
            CliUtils.println();
            await this.session.login({ workspace: ws.GUID });
            CliConfig.workspace = ws.GUID;
        }
    }

    async logout(): Promise<void> {
        await this.session.logout();
    }

    close() {
        this.session.close();
    }

}
