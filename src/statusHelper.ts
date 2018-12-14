import { workspace, window, StatusBarItem, StatusBarAlignment } from 'vscode';
import { MAP_COMMAND } from './static';

const priority = 4.5;

export class StatusHelper {
    private mapBtn: StatusBarItem;

    constructor() {
        this.mapBtn = this.initMapBtn();
        this.refresh();
        this.watchUserSettingChange();
    }

    public watchUserSettingChange () {
        workspace.onDidChangeConfiguration((e) => {
            this.refresh();
        });
    }

    public refresh () {
        this.mapBtn.show();
    }

    private initMapBtn() {
        let mapBtn: StatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, priority - 1);
        mapBtn.text = `$(list-unordered) Snipx`;
        mapBtn.tooltip = 'snipx snippets map';
        mapBtn.command = MAP_COMMAND;

        return mapBtn;
    }

    dispose() {
        this.mapBtn.dispose();
    }
}