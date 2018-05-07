import { workspace, window, StatusBarItem, StatusBarAlignment } from 'vscode';;
import { ConfigHelper } from './configHelper';
import { CONFIG_COMMAND, UPDATE_COMMAND, MAP_COMMAND } from './static';

const priority = 4.5;

export class StatusHelper {
    private updateBtn: StatusBarItem;
    private configBtn: StatusBarItem;
    private mapBtn: StatusBarItem;

    constructor() {
        this.updateBtn = this.initUpdateBtn();
        this.configBtn = this.initConfigBtn();
        this.mapBtn = this.initMapBtn();
        this.refresh();
        this.watchUserSettingChange();
    }

    private queryIfInitialized () {
        const tags: string[] = ConfigHelper.riddleTags;
        const gitlabSource: string[] = ConfigHelper.gitlabSource;
        
        let isInitialized = false;
        if (tags.length > 0) {
            isInitialized = true;
        } else if (gitlabSource.length > 0) {
            if (ConfigHelper.gitlabPrivateToken && ConfigHelper.gitlabApiUrl) {
                isInitialized = true;
            }
        }

        return isInitialized;
    }

    public watchUserSettingChange () {
        workspace.onDidChangeConfiguration((e) => {
            this.refresh();
        });
    }

    public refresh () {
        const isInitialized = this.queryIfInitialized();

        if (isInitialized) {
            this.configBtn.hide();
            this.updateBtn.show();   
            this.mapBtn.show();         
        } else {
            this.configBtn.show();
            this.updateBtn.hide();
            this.mapBtn.hide();
        }
    }

    

    private initConfigBtn() {
        let updateBtn: StatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, priority);
        updateBtn.text = `$(diff-added) 配置snipx`;
        updateBtn.tooltip = 'snipx 配置';
        updateBtn.command = CONFIG_COMMAND;

        return updateBtn;
    }

    private initMapBtn() {
        let mapBtn: StatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, priority - 1);
        mapBtn.text = `$(list-unordered) map`;
        mapBtn.tooltip = 'snipx snippets map';
        mapBtn.command = MAP_COMMAND;

        return mapBtn;
    }

    private initUpdateBtn() {
        let updateBtn: StatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, priority);
        updateBtn.text = `$(cloud-download) 更新snipx`;
        updateBtn.tooltip = 'snipx代码片段更新';
        updateBtn.command = UPDATE_COMMAND;

        return updateBtn;
    }

    dispose() {
        this.updateBtn.dispose();
        this.configBtn.dispose();
    }
}