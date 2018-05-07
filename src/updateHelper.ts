import ConfigHelper from './configHelper';
import * as fs from 'fs';
import * as path from 'path';
import FetchHelper from './fetchHelper';
import SnippetsHelper from './snippetHelper';
import { window, commands, ProgressLocation } from 'vscode';

export default class UpdateHelper {
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
}