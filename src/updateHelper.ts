import { ConfigHelper } from './configHelper';
import * as fs from 'fs';
import * as path from 'path';
import FetchHelper from './fetchHelper';
import SnippetsHelper from './snippetHelper';
import { window, commands, ProgressLocation } from 'vscode';
import { GITHUB } from './static';

interface TextOptions {
    title: string;
    before: string;
    after: string;
    cancel: string;
}
export class UpdateHelper {
    private static runProgress(task: Promise<any>, textOptions: TextOptions) {
        // 进度框
        const {
            title = '',
            before = '正在努力拉取片段中...',
            after = '拉取完成, 正在重新加载视图生效配置...',
            cancel = "用户取消加载代码片段操作"
        } = textOptions || {};

        return new Promise((outResolve) => {
            window.withProgress({
                location: ProgressLocation.Notification,
                title,
                cancellable: true
            }, (progress, token) => {
                token.onCancellationRequested(() => {
                    console.log(cancel);
                    outResolve();
                });
    
                // 拉取代码片段后重新刷新视图
                progress.report({ increment: 0, message: before });            
                var p = new Promise(async (resolve) => {
                    await task;
                    progress.report({ increment: 99, message: after });
                    setTimeout(async () => {
                        resolve();
                        outResolve();
    
                        // if (doReload) {
                        //     await commands.executeCommand('workbench.action.reloadWindow');
                        // }
                    }, 500);
                });
    
                return p;
            });
        });
    }

    private static queryMap () {
        const fsMapPath = path.join(__dirname, '../snippets/_github-map.code-snippets');
        const fsMapStr = fs.readFileSync(fsMapPath, 'utf-8');
        const fsMapRaw = JSON.parse(fsMapStr);

        const fsMap: any = {};
        Object.keys(fsMapRaw).filter(key => !!key).forEach(key => {
            fsMap[key] = fsMapRaw[key];
        });

        return fsMap;
    }

    // 更新snipMap底层的方法
    private static updateGist(snipMap: any) {
        const fsMapPath = path.join(__dirname, '../snippets/_github-map.code-snippets');
        const fspath = path.join(__dirname, '../snippets/_github.code-snippets');

        const snippetsConfig = SnippetsHelper.transform2core(snipMap);
        const stringSnippetsMap = JSON.stringify(snipMap, null, 4);
        const stringSnippets = JSON.stringify(snippetsConfig, null, 4);
        
        fs.writeFileSync(fsMapPath, stringSnippetsMap, 'utf-8');
        fs.writeFileSync(fspath, stringSnippets, 'utf-8');
    }

    public static async add () {
        const codeSource = await window.showInputBox({
            placeHolder: '请输入 Gist Id'
        });
        
        if (codeSource) {
            const p = UpdateHelper.updateGistById([codeSource]);
            const textOptions = {
                title: '拉取代码片段',
                cancel: '取消拉取代码片段',
                before: '正在拉取代码片段',
                after: '拉取代码片段完成'
            };
            await UpdateHelper.runProgress(p, textOptions);
        }
    }

    public static async addUser () {
        const codeSource = await window.showInputBox({
            placeHolder: '请输入 Github用户 Id'
        });
        
        if (codeSource) {
            const p = UpdateHelper.updateGistByUserId(codeSource);
            const textOptions = {
                title: '拉取代码片段',
                cancel: '取消拉取代码片段',
                before: '正在拉取代码片段',
                after: '拉取代码片段完成'
            };
            await UpdateHelper.runProgress(p, textOptions);
        }
    }

    public static async deleteUserById (userId: string) {        
        if (userId) {
            const p = new Promise(async (resolve) => {
                // 1. 删除用户id
                const { deleteUserById } = ConfigHelper;
                await deleteUserById(userId);

                // 2. 更新code snippets map
                const snipMap = this.queryMap();
                const newSnipMap: any = {};
                Object.keys(snipMap).filter(item => item !== userId).forEach(userKey => {
                    newSnipMap[userKey] = snipMap[userKey];
                });

                // 3. 更新本地数据
                UpdateHelper.updateGist(newSnipMap);
                resolve();
            });

            const textOptions = {
                before: '正在删除用户信息',
                after: '删除用户信息成功, 重新加载...',
                cancel: '删除用户信息失败',
                title: '删除用户信息',
            };
            await UpdateHelper.runProgress(p, textOptions);
        }        
    }

    public static async reload () {
        const snipMap = this.queryMap();
        await this.syncUserAndIdsByMap(snipMap);        

        const { gistSubscription, gistUserList } = ConfigHelper;

        const p1 = UpdateHelper.updateGistById(gistSubscription);
        const p2 = UpdateHelper.updateGistByUserId(gistUserList);
        const p = Promise.all([p1, p2]);
        await UpdateHelper.runProgress(p, {
            title: '执行Reload',
            before: '正在执行Reload',
            after: '执行Reload成功, 重新加载...',
            cancel: '执行Reload失败'
        });
    }

    public static async updateGistByUserId (userId: any) {        
        // 1. 拉取用户下所有snippets
        let helper = new FetchHelper();
        const snippets = await helper.fetchGistSnippetsByUser([userId], { onError: (e) => {
            console.log('snippets fetch error', e);
        }});

        // 2. 增加用户信息
        const { appendGistUserList } = ConfigHelper;
        appendGistUserList(userId);

        // 3. 生成新的map内容，更新到本地
        const snipMap = this.queryMap();
        const mapifySnippets = SnippetsHelper.generateFromGistSnippets(snippets);
        snipMap[userId] = mapifySnippets[userId]; // 直接替换对应user
        await this.syncUserAndIdsByMap(mapifySnippets);
        await this.updateGist(snipMap);    
        
    }

    public static async syncUserAndIdsByMap (snipMap: any) {
        const { gistSubscription, setGistSubscription } = ConfigHelper;
        let ids: Array<string> = [];

        // 获取所有片段id
        Object.keys(snipMap).forEach(user => {
            ids = ids.concat(Object.keys(snipMap[user]));
        });

        // gistSubscription存放的是自定义单个片段
        // 这端代码的作用是，如果现在用户下面已经包含了这个自定义的单个片段，就无需单独请求了
        // 将之前自定义的片段从配置中移除
        const emptyStringList: Array<string> = [];
        let newGistIds: Array<string> = emptyStringList.concat(gistSubscription);
        ids.forEach((id) => {
            const dpIndex = newGistIds.indexOf(id);
            if (dpIndex !== -1) {
                newGistIds.splice(dpIndex, 1);
            }
        });

        await setGistSubscription(newGistIds);
    }

    public static async updateGistById (id: Array<string>) {
        const { appendGistSubscription } = ConfigHelper;
        const fetcHelper = new FetchHelper();
        const snippets = await fetcHelper.fetchGistSnippetsById(id, {
            onError: (e) => {
                console.log('[snipx error]:', e);
            }
        });

        if (snippets.length > 0) {
            // 成功后写入配置文件
            await appendGistSubscription(id); 

            // 修改map的内容
            const snipMap = this.queryMap();        
            const mapifySnippets = SnippetsHelper.generateFromGistSnippets(snippets);
            snippets.forEach((item) => {
                const { user, gists } = item;
                gists.forEach((gItem: any) => {
                    const { id } = gItem;
                    if (!snipMap[user]) {
                        snipMap[user] = {};
                    }
                    snipMap[user][id] = mapifySnippets[user][id];
                });
            });
        }        
    }
}