import { ConfigHelper } from './configHelper';
import * as fs from 'fs';
import * as path from 'path';
import FetchHelper from './fetchHelper';
import SnippetsHelper from './snippetHelper';
import { window, commands, ProgressLocation } from 'vscode';
import { RIDDLE, GITLAB, GITHUB } from './static';

export class UpdateHelper {
    private static runProgress(title:string, task: Promise<any>) {
        window.withProgress({
			location: ProgressLocation.Notification,
			title,
			cancellable: true
		}, (progress, token) => {
			token.onCancellationRequested(() => {
				console.log("用户取消加载代码片段操作")
			});

            progress.report({ increment: 0, message: '正在努力拉取片段中...' });            
            var p = new Promise(async (resolve) => {
                await task;
                progress.report({ increment: 99, message: '拉取完成, 正在重新加载视图生效配置...' });
				setTimeout(async () => {
                    resolve();
                    await commands.executeCommand('workbench.action.reloadWindow');					
				}, 1000);
			});

			return p;
        });
    }

    public static async updateGitlab() {
        const p = new Promise(async (resolve, reject) => {
            const fspath = path.join(__dirname, '../snippets/_gitlab.code-snippets');        
            let helper = new FetchHelper();
            const snippets = await helper.fetchGitlabSnippets('http://gitlab.alibaba-inc.com/fd-arts/core-base', { onError: () => {
                reject();
            }});

            if (!snippets) {

            } else {
                const snippetsConfig = SnippetsHelper.generateFromGitlabSnippets(snippets);
                const stringSnippets = JSON.stringify(snippetsConfig, null, 4);
                
                fs.writeFileSync(fspath, stringSnippets, 'utf-8');            
                resolve();
            }
        });

        UpdateHelper.runProgress('gitlab', p);
    }

    public static updateRiddle() {
        const tags: string[] = ConfigHelper.riddleTags;
        const p = new Promise(async (resolve, reject) => {
            const fspath = path.join(__dirname, '../snippets/_riddle.code-snippets');        
            let helper = new FetchHelper();
            const snippets: Array<any> = await helper.fetchRiddleSnippets(tags, { onError: (e) => {
                reject();
            }});

            if (snippets) {
                let comboConfig = {};
                snippets.forEach((snipItemList) => {
                    let snippetsConfig = SnippetsHelper.generateFromRiddleSnippets(snipItemList);
                    comboConfig = {
                        ...comboConfig,
                        ...snippetsConfig
                    };
                });
                
                const stringSnippets = JSON.stringify(comboConfig, null, 4);
                
                fs.writeFileSync(fspath, stringSnippets, 'utf-8');            
                resolve();
            }
        });

        UpdateHelper.runProgress('riddle', p);
    }

    private static updateGithub() {
        
    }

    public static async update () {
        const codeSource = await window.showQuickPick([
            { label: 'Riddle 仓库', value: RIDDLE },
            { label: 'Gitlab Snippets', value: GITLAB }],
        { placeHolder: '选择需要更新的片段源' });
        
        if (codeSource && codeSource.value) {            
            switch (codeSource.value) {
                case RIDDLE: UpdateHelper.updateRiddle(); break;
                // case GITLAB: UpdateHelper.updateGitlab(); break;
                case GITHUB: UpdateHelper.updateGithub(); break;
            }
        }
    }

    public static async config() {
        const codeSource = await window.showQuickPick([
            { label: 'Riddle 仓库', value: RIDDLE },
            { label: 'Gitlab Snippets', value: GITLAB }],
        { placeHolder: '选择片段源' });
        
        if (codeSource && codeSource.value) {            
            switch (codeSource.value) {
                case RIDDLE: UpdateHelper.completeRiddleConfig(); break;
                case GITLAB: UpdateHelper.completeGitlabConfig(); break;
                case GITHUB: UpdateHelper.completeGithubConfig(); break;
            }
        }
    }

    private static async completeRiddleConfig () {
        const rawTags = await window.showInputBox({ value: 'FdArts+代码库', prompt: '请输入需要拉取的标签名, 多个标签用 , 隔开' });
        
        if (rawTags) {
            let tags = rawTags.split(',');
            await ConfigHelper.setRiddleTags(tags);
            UpdateHelper.updateRiddle();
        }
    }

    private static async completeGitlabConfig () {

    }

    private static async completeGithubConfig () {
        
    }
}