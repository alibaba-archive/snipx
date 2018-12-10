import { workspace } from 'vscode';

export class ConfigHelper {
    public static get configuration() {
        return workspace.getConfiguration('snipx.settings');
    }

    private static getSettings<T>(val: string): T {
        return ConfigHelper.configuration.get(val) as T;
    }

    public static async setGistUserList(val: Array<string>, isGlobal: boolean = true) {
        await ConfigHelper.configuration.update('gistUserList', val, isGlobal);
    }

    public static async appendGistUserList(val: Array<string>, isGlobal: boolean = true) {
        const arr: Array<string> = ConfigHelper.getSettings<Array<string>>('gistUserList');
        const userList: Array<string> = [];
        val.forEach((valItem) => {
            if (userList.indexOf(valItem) === -1) {
                userList.push(valItem);
            }
        });
        arr.forEach((valItem) => {
            if (userList.indexOf(valItem) === -1) {
                userList.push(valItem);
            }
        });
        await ConfigHelper.configuration.update('gistUserList', userList, isGlobal);
    }

    public static get gistUserList(): Array<string> {
        return ConfigHelper.getSettings<Array<string>>('gistUserList');
    }

    
    public static async deleteUserById(val: string, isGlobal: boolean = true) {
        const arr: Array<string> = ConfigHelper.getSettings<Array<string>>('gistUserList');
        const newUserList = arr.filter(item => item !== val);
        await ConfigHelper.configuration.update('gistUserList', newUserList, isGlobal);
    }

    public static async setGistSubscription(val: Array<string>, isGlobal: boolean = true) {
        await ConfigHelper.configuration.update('gistSubscription', val, isGlobal);
    }

    public static async appendGistSubscription(val: Array<string>, isGlobal: boolean = true) {
        const arr: Array<string> = ConfigHelper.getSettings<Array<string>>('gistSubscription');
        const emptyList: Array<string> = [];
        const newGistSubscriptionList = emptyList.concat(arr);
        val.forEach(key => {
            if (newGistSubscriptionList.indexOf(key) === -1) {
                newGistSubscriptionList.push(key);
            }
        });

        await ConfigHelper.configuration.update('gistSubscription', newGistSubscriptionList, isGlobal);
    }

    public static get gistSubscription(): Array<string> {
        return ConfigHelper.getSettings<Array<string>>('gistSubscription');
    }
}