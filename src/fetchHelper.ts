'use strict';import fetch from 'node-fetch';
const noop = () => {};

interface QueryOptions {
    onError: (e: any) => void;
    json?: any;
}

export default class FetchHelper {
    public async handleCommonRes (res) {
        let gistOwner = '';
        const gistResult = [].concat(res);
        let gistList:Array<any> = [];
        if (Array.isArray(gistResult)) {
            const gistPromiseList = gistResult.map(async (gistItem) => {
                const { files, id, description, owner } = gistItem;
                let snippets: any = [];
                if (!gistOwner && owner && owner.login) {
                gistOwner = owner.login;
                }
                if (files && Object.keys(files).length > 0) {
                    const snippetsPromise = Object.keys(files).map(async (filekey) => {
                        const fileItem = files[filekey];
                        const { raw_url, content } = fileItem;
                        let fileContent: any = "";
                        if (content) {
                            fileContent = content;
                        } else if (raw_url) {
                            fileContent = await this.Request(raw_url, { onError: () => {}});
                        }
    
                        return {
                            ...fileItem,
                            content: fileContent,
                            description,
                        };
                    });
    
    
                    snippets = await Promise.all(snippetsPromise).catch((e) => {
                        console.log(e);
                    });
                }
    
                return {
                    id,
                    snippets,
                    description,
                };
            });
    
            gistList = await Promise.all(gistPromiseList);
        }
    
        return {
            user: gistOwner,
            gists: gistList,
        };
    }
    public Request (url: string, props: QueryOptions) {
        const { json = null, onError = noop } = props || {};
        let queryOpts = {};
        if (json) {
            queryOpts = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(json)
            };
        }

        return new Promise(async (resolve, reject) => {
            const resp: any = await fetch(url, queryOpts).catch((e: any) => {
                onError && onError(e);
                reject(e);
            });

            const contentType = resp.headers.get('Content-Type');            

            let result;
            if (contentType.indexOf('json') !== -1) {
                result = await resp.json();
            } else if (contentType.indexOf('text/plain') !== -1) {
                result = await resp.text();
            } else if (contentType.indexOf('html') !== -1) {
                const errmsg = '请求异常';
                onError && onError(errmsg);
                reject(errmsg);
            } else {
                result = await resp.text();
            }

            resolve(result);
        });
    }

    public async fetchGistSnippetsById (ids: Array<string>, props: QueryOptions) {

        if (Array.isArray(ids) && ids.length > 0) {
             const promiseList = ids.filter(s => !!s).map(async (item: string) => {
                 const result = await this.Request(`https://api.github.com/gists/${item}`, { onError: () => {}});
                 if (result.id) {
                    const gistResult = await this.handleCommonRes(result);
                    return gistResult;
                 } else {
                     return null;
                 }
             });
 
             const pResult = await Promise.all(promiseList);
             return pResult.filter(item => !!item);
        } else {
            return [];
        }
     }

    public async fetchGistSnippetsByUser (userList: Array<string>, props: QueryOptions) {
        if (Array.isArray(userList)) {
             const promiseList = userList.filter(s => !!s).map(async (item: string) => {
                 const result = await this.Request(`https://api.github.com/users/${item}/gists`, { onError: () => {}});
                 const gistResult = await this.handleCommonRes(result);
                return gistResult;
             });
 
             return Promise.all(promiseList);
        } else {
            return [];
        }
     }

    public async fetchGistSnippets (subscriptions: Array<string>, props: QueryOptions) {
       if (Array.isArray(subscriptions)) {
            const promiseList = subscriptions.filter(s => !!s).map(async (item: string) => {
                const result = await this.Request(`https://api.github.com/users/${item}/gists`, { onError: () => {}});
                const gistResult = await this.handleCommonRes(result);
                return gistResult;
            });

            return Promise.all(promiseList);
       } else {
           return [];
       }
    }

    public async fetchSource () {
        
    }
}
