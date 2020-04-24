import { NodeStorage, PrefItem, PrefStore } from '@frusal/library-for-node';
import { CliUtils } from './utils';

const CONFIG_FILENAME = 'frusal.json';

function storeInit(): void {
    if (!CliConfig.fileExists()) {
        CliUtils.println(`The file '${CONFIG_FILENAME}' is not found. The new configuration will be created.`);
    }
}

@PrefStore({ store: new NodeStorage(CONFIG_FILENAME), name: (target, name) => name, init: storeInit })
export class CliConfig {

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private constructor() {}

    @PrefItem()
    static developmentServer = '';

    @PrefItem()
    static defaultUsername = '';

    @PrefItem()
    static defaultPassword = '';

    @PrefItem()
    static workspace = '';

    @PrefItem()
    static libraryPackageName = '';

    @PrefItem({ createWithDefault: true })
    static sourceCodeModelLocation = 'src/model';

    @PrefItem({ createWithDefault: true })
    static sourceModulePerClass = false;

    @PrefItem({ createWithDefault: true })
    static sourceInTypeScript = false;

    @PrefItem({ createWithDefault: true })
    static sourceJavaScriptExtension = 'js';

    @PrefItem({ createWithDefault: true })
    static sourceUseRequireJs = true;

    static fileExists() {
        return CliUtils.fileExists(CONFIG_FILENAME);
    }

    static status(): string {
        return `Config file: ${CONFIG_FILENAME}\nSource code model location: ${this.sourceCodeModelLocation}`;
    }

}
