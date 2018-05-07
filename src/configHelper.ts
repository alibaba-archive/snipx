import { window, workspace } from 'vscode';
import { RIDDLE, GITLAB, GITHUB } from './static';
import UpdateHandler from './updateHelper';

export default class ConfigHelper {
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

    public static async config() {
        const codeSource = await window.showQuickPick([
            { label: 'Riddle 仓库', value: RIDDLE },
            { label: 'Gitlab Snippets', value: GITLAB }],
        { placeHolder: '选择片段源' });
        
        if (codeSource && codeSource.value) {            
            switch (codeSource.value) {
                case RIDDLE: ConfigHelper.completeRiddleConfig(); break;
                case GITLAB: ConfigHelper.completeGitlabConfig(); break;
                case GITHUB: ConfigHelper.completeGithubConfig(); break;
            }
        }
    }

    private static async completeRiddleConfig () {
        const rawTags = await window.showInputBox({ value: 'FdArts+代码库', prompt: '请输入需要拉取的标签名, 多个标签用 , 隔开' });
        
        if (rawTags) {
            let tags = rawTags.split(',');
            await ConfigHelper.setRiddleTags(tags);
            UpdateHandler.updateRiddle();
        }
    }

    private static async completeGitlabConfig () {

    }

    private static async completeGithubConfig () {
        
    }
}