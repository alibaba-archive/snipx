import { window, StatusBarItem, StatusBarAlignment } from 'vscode';;

export default class StatusHelper {
    private updateBtn: StatusBarItem;
    private configBtn: StatusBarItem;

    constructor() {
        this.updateBtn = this.initUpdateBtn();
        this.configBtn = this.initConfigBtn();
        this.updateBtn.show();
        this.configBtn.show();
    }

    public initConfigBtn() {
        let updateBtn: StatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
        updateBtn.text = `$(cloud-download) 配置snipx`;
        updateBtn.tooltip = 'snipx 配置';
        updateBtn.command = 'snipx.config';

        return updateBtn;
    }

    public initUpdateBtn() {
        let updateBtn: StatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
        updateBtn.text = `$(cloud-download) 更新snipx`;
        updateBtn.tooltip = 'snipx代码片段更新';
        updateBtn.command = 'snipx.update';

        return updateBtn;
    }

    public refresh () {

    } 

    dispose() {
        this.updateBtn.dispose();
        this.configBtn.dispose();
    }
}