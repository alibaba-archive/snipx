interface VscodeSnippetItem {
    prefix: string;
    scope: string;
    body: Array<string>;
    description: string;
    title?: string;
}

import * as fs from 'fs';
import * as path from 'path';
import { window, ViewColumn, ExtensionContext } from 'vscode';
import { GITHUB } from './static';
import { UpdateHelper } from './updateHelper';

const supportSyntax:string[] = ['javascript','typescript','javascriptreact','plaintext'];

function escape(s: string) {
    return s.replace(/[&"<>]|[\s]/g, function (c: any) {
        const escmap: { [key: string]: string } = {
            '&': '&amp;',
            '"': '&quot;',
            '<': '&lt;',
            '>': '&gt;'
        };

        return escmap[c] || '&nbsp;';
    });
}

export default class SnippetsHelper {
    public static generateFromGistSnippets(userGistList: Array<any>) {
        let comboSnippets: any = {};
        const userCodeSnippets: any = {};
        userGistList.forEach((item) => {
            const { user, gists: gistList } = item;
            if (Array.isArray(gistList)) {
                gistList.forEach((gistItem) => {
                    const { id = '', snippets } = gistItem;                    
                    if (!userCodeSnippets[id]) {
                        userCodeSnippets[id] = {
                            id,
                            snippets: [],
                        };
                    }
                    if (Array.isArray(snippets)) {
                        snippets.forEach((snipItem) => {
                            const { filename, content } = snipItem;
                            let extLessName = filename.replace(/\.(\w*)$/, '');
                            const gvcItem = this.generateVscodeConfigItem({
                                content,
                                title: extLessName,
                            });
                            userCodeSnippets[id].snippets.push(gvcItem);
                        });
                    }
                });
                comboSnippets[user] = userCodeSnippets;
            }
        });

        return comboSnippets; 
    }

    private static generateVscodeConfigItem (item: any) {
        const { title: rawTitle, content } = item;
		const [ smartKey, title ] = rawTitle.split('/');

		let scope = supportSyntax.join(',');
		let commetReg = /\/\*{2}\s?(\[.*\].*)\s?\*{2}\//;
		const reg = /(\r|\r\n|\n)+/;
		const body = content.split(reg).filter((v: string) => {
			return !reg.test(v) && !commetReg.test(v);
		});

		return {
			prefix: smartKey,
			scope,
			body,
            description: title,
            title: title || smartKey,
		};
    }

    public static transform2core (origin: any) {
        const result: any = {};
        Object.keys(origin).forEach((userKey) => {
            const user = origin[userKey];
            Object.keys(user).forEach((snipId) => {
                const snipItem = user[snipId];
                const { snippets = [] } = snipItem;
                snippets.forEach((file: any) => {
                    const { title } = file;
                    if (!result[title]) {
                        result[title] = file;
                    } else {
                        result[`_${title}`] = file;
                    }
                });
            });
        });
        return result;
    }

    public static generateSnippetsMap (context: ExtensionContext) {
        const panel = window.createWebviewPanel('snippets map', "snippets map", ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true
        });

        panel.webview.html = SnippetsHelper.generateSnippetsMapHTML();
        panel.onDidDispose(() => {
            // 
        }, null, context.subscriptions);
        
        panel.webview.onDidReceiveMessage(async (message) => {
            const { command, payload } = message;
            switch (command) {
                case 'add': 
                    await UpdateHelper.add();
                    panel.webview.html = SnippetsHelper.generateSnippetsMapHTML();
                    break;
                case 'addUser': 
                    await UpdateHelper.addUser();
                    panel.webview.html = SnippetsHelper.generateSnippetsMapHTML();
                    break;
                case 'reload': 
                    await UpdateHelper.reload();
                    panel.webview.html = SnippetsHelper.generateSnippetsMapHTML();
                    break;
                case 'deleteUserById': 
                    await UpdateHelper.deleteUserById(payload);
                    panel.webview.html = SnippetsHelper.generateSnippetsMapHTML();
                    break;
            }
        }, undefined, context.subscriptions);
    }

    private static generateSnippetsMapHTML () {        
        const filePath = path.join(__dirname, `../snippets/_${GITHUB}-map.code-snippets`);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const jsonContent = JSON.parse(fileContent);

        let tableHTML = '';
        if (jsonContent) {
            const tableArray = Object.keys(jsonContent).map((userId) => {
                const userSnipIdMap = jsonContent[userId];
                const userSnipIdArray = Object.keys(userSnipIdMap).map((snipId) => {
                    const snipItem = userSnipIdMap[snipId];
                    const { id, snippets } = snipItem;
                    const snipListHTMLArray = snippets.map((singleItem: VscodeSnippetItem) => {
                        const { prefix, title, body } = singleItem;
                        const partBodyArr = body.slice(0, 10).map(escape);
                        const partBody = partBodyArr.join('<br />');

                        const pureTitle = title ? title.split('/')[0] : '';

                        return `<tr>
                            <td>${prefix}</td>
                            <td>${pureTitle}</td>
                            <td>${partBody}</td>
                        </tr>`;
                    });

                    if (snipListHTMLArray.length === 0) {
                        return '';
                    }
                    const snipListHTML = snipListHTMLArray.join('\n');
                    return `
                        <h4 style="margin-bottom: 8px;">id: ${id}</h4>
                        <table border="1" cellspacing="0">
                            <thead>
                                <tr>
                                    <th align="left">关键字</th>
                                    <th align="left">标题</th>
                                    <th align="left">内容</th>
                                </tr>
                            </thead>
                            <tbody>
                            ${snipListHTML}
                            </tbody>
                        </table>
                    `;
                });
                
                const userSnipIdHTML = userSnipIdArray.length ? userSnipIdArray.join('\n') : '';
                return `
                    <h2 style="margin-bottom: 16px;">${userId} <a class="operation-btn" onClick="deleteUserById('${userId}')">删除</a></h2>
                    ${userSnipIdHTML}
                `;
            });

            tableHTML = tableArray.length ? tableArray.join('\n') : '';
        }

        const operation = `
            <a class="operation-btn" onclick="reload()">更新全部</a>
            <!-- <a class="operation-btn" onclick="add()">添加Snippets</a> -->
            <a class="operation-btn" onclick="addUser()">添加用户Snippets</a>
        `;

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Cat Coding</title>
                <style>
                    .operation-btn {
                        margin-right: 4px;
                        cursor: pointer;
                    }
                </style>
            </head>
            <body>
                ${operation}
                ${tableHTML}
                <script>
                    const vscode = acquireVsCodeApi();
                    function reload () {
                        vscode.postMessage({ command: 'reload' })
                    }

                    function add () {
                        vscode.postMessage({ command: 'add' })
                    }

                    function addUser () {
                        vscode.postMessage({ command: 'addUser' })
                    }

                    function deleteUserById (userId) {
                        vscode.postMessage({ command: 'deleteUserById', payload: userId })
                    }
                </script>
            </body>
            </html>`;
    }
}