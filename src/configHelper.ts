import { workspace } from 'vscode';

export class ConfigHelper {
    public static get configuration() {
        return workspace.getConfiguration('snipx.settings');
    }

    private static getSettings<T>(val: string): T {
        return ConfigHelper.configuration.get(val) as T;
    }

    public static async setRiddleTags(val: Array<string>, isGlobal: boolean = true) {
        await ConfigHelper.configuration.update('riddleTags', val, isGlobal);
    }

    public static get riddleTags(): Array<string> {
        return ConfigHelper.getSettings<Array<string>>('riddleTags');
    }

    public static get gitlabSource(): Array<string> {
        return ConfigHelper.getSettings<Array<string>>('gitlabSource');
    }

    public static get gitlabApiUrl(): string {
        return ConfigHelper.getSettings<string>('gitlabApiUrl');
    }

    public static get gitlabPrivateToken(): string {
        return ConfigHelper.getSettings<string>('gitlabPrivateToken');
    }    
}