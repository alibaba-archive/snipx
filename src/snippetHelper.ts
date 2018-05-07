interface VscodeSnippetItem {
    prefix: string,
    scope: string,
    body: Array<string>,
    description: string,
    title?: string
}

interface CodeObject {
    [key: string]: VscodeSnippetItem;
}

import * as fs from 'fs';
import * as path from 'path';
import { window, ViewColumn } from 'vscode';
import { RIDDLE, GITLAB, GITHUB } from './static';

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
    public static generateFromGitlabSnippets(gitlabSnippets: Array<any>) {
        let comboSnippets: CodeObject = {};
        gitlabSnippets.forEach((item) => {
            const { title, keyword } = item;
            let smarKey = title || keyword;
            smarKey = smarKey.replace(/\.(\w*)$/, '');

            let injectKey:string = !(smarKey in comboSnippets) ? smarKey : `_${smarKey}`;
            comboSnippets[injectKey] = this.generateVscodeConfigItem(item);
        });

        return comboSnippets;
    }

    public static generateFromRiddleSnippets(riddleSnippets: Array<any>) {
        let comboSnippets: CodeObject = {};
        riddleSnippets.forEach((item) => {
            try {
                const { title, keyword } = item;
                let smarKey = title || keyword;

                if (smarKey && typeof smarKey === 'string') {
                    smarKey = smarKey.replace(/\.(\w*)$/, '');
                    let injectKey:string = !(smarKey in comboSnippets) ? smarKey : `_${smarKey}`;
                    comboSnippets[injectKey] = this.generateVscodeConfigItem(item);
                }                
            } catch (e) {
                console.log(e);
            }
        });

        return comboSnippets;
    }

    private static generateVscodeConfigItem (item: any) {
        const { title: rawTitle, content } = item;
		const [ title, smartKey ] = rawTitle.split('/');

		let scope = supportSyntax.join(',');
		let commetReg = /\/\*{2}\s?(\[.*\].*)\s?\*{2}\//;
		const reg = /(\r|\r\n|\n)+/;
		const body = content.split(reg).filter((v: string) => {
			return !reg.test(v) && !commetReg.test(v);
		});

		return {
			prefix: smartKey || title,
			scope,
			body,
			description: title
		};
    }

    public static generateSnippetsMap () {
        const panel = window.createWebviewPanel('snippets map', "snippets map", ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true
        });


        // const url = Uri.file(path.join(extensionPath, './src/abc.js'));
        // // const fileUrl = url.with({ scheme: 'vscode-resource' });
        // const doc = await workspace.openTextDocument(url); 
        // window.showTextDocument(doc);

        panel.webview.html = SnippetsHelper.generateSnippetsMapHTML();
    }

    private static generateSnippetsMapHTML () {
        let tableList: VscodeSnippetItem[][] = [];
        const snippetsKeyList = [RIDDLE, GITHUB, GITLAB];
        snippetsKeyList.forEach((filekey) => {
            const filePath = path.join(__dirname, `../snippets/_${filekey}.code-snippets`);
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const jsonContent = JSON.parse(fileContent);

            let snippetList: VscodeSnippetItem[] = [];
            if (jsonContent) {
                Object.keys(jsonContent).forEach((snippetKey) => {
                    const snippetItem: VscodeSnippetItem = jsonContent[snippetKey];
                    snippetList.push({
                        ...snippetItem,
                        title: snippetKey
                    });
                });

                tableList.push(snippetList);
            }
        });

        const tableHTMLArray = tableList.map((tableSnipList, index) => {
            const snipListHTMLArray = tableSnipList.map((tableSnipItem) => {
                const { prefix, title, body } = tableSnipItem;
                const partBodyArr = body.slice(0, 10).map(escape);
                const partBody = partBodyArr.join('<br />');

                const pureTitle = title ? title.split('/')[0] : '';

                return `<tr>
                    <td>${prefix}</td>
                    <td>${pureTitle}</td>
                    <td>${partBody}</td>
                </tr>`
            });

            if (snipListHTMLArray.length === 0) return '';
            const snipListHTML = snipListHTMLArray.join('\n');

            return `
                <h2 style="margin-bottom: 16px;">${snippetsKeyList[index]}</h2>
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

        const tableHTML = tableHTMLArray.length ? tableHTMLArray.join('\n') : '';

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Cat Coding</title>
            </head>
            <body>
                ${tableHTML}
            </body>
            </html>`
    }
}