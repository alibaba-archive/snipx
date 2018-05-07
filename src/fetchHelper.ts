'use strict';

import { window } from 'vscode';
import { URLSearchParams } from 'url';
import { ConfigHelper } from './configHelper';
const gitUrlParse = require('git-url-parse');
import fetch from 'node-fetch';
import { SnipItem } from './static';

const noop = () => {};

interface RiddleCode {
    jsx: string,
    css: string,
    compiledJsx: string
}

interface RiddleItem {
    code?: RiddleCode,
    title?: string
}

interface RiddleResult {
    list?: Array<any>
}

interface QueryOptions {
    onError: (e: any) => void,
    json?: any
}

function entries (obj: any) {
    return Object.keys(obj).map((key) => {
        return [key, obj[key]]
    });
}

export default class FetchHelper {
    public Request (url: string, props: QueryOptions) {
        const { json = null, onError = noop } = props || {};
        let queryOpts = {};
        if (json) queryOpts = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(json)
        };

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

    private getGitlabId (url: string) {
        if (url.startsWith('gitlab')) url += 'http://'
        const parseGitModule = gitUrlParse(url)
        const { name = '', owner ='' } = parseGitModule || {}
        return `${owner}/${name}`
    }

    public async fetchRiddleSnippets (tags: string[], props: QueryOptions) {
        const { onError: rootOnError } = props;
        const riddleList = tags.map(async (tag: string) => {            
            let url = `http://riddle.alibaba-inc.com/api/riddles?tag=${encodeURI(tag)}`;

            return new Promise(async (resolveTag, reject) => {
                const result: RiddleResult = await this.Request(url, { onError: (e) => {
                    rootOnError && rootOnError(e);
                }});

                const { list = [] } = result || {};

                if (Array.isArray(list)) {
                    const promiseList = list.map(async (item: any) => {
                        const { id } = item
                        return new Promise(async (resolve) => {
                            const riddleItem: RiddleItem = await this.Request(`http://riddle.alibaba-inc.com/api/riddles/${id}`, { onError: (e) => {
                                rootOnError(e);
                            }});

                            const { code, title = '' } = riddleItem;
                            const { jsx = '' } = code || {};
                            
                            const fullItem: SnipItem = {
                                title,
                                content: jsx
                            };
                    
                            resolve(fullItem)
                        })
                    })
                
                    resolveTag(Promise.all(promiseList));
                } else {
                    rootOnError && rootOnError('拉取riddle代码片段失败，请检查是否在公司内网环境!');
                    reject(Promise.resolve(null));
                }
            });
        });

        return Promise.all(riddleList);
    }

    private async gitlabRequest (api: string, body: any) {        
        const PRIVATE_TOKEN = ConfigHelper.gitlabPrivateToken;
        const API_URL = ConfigHelper.gitlabApiUrl;

        if (!PRIVATE_TOKEN || !API_URL) {
            window.showInformationMessage('请完成gitlabPrivateToken或gitlabApiUrl的配置');
            return null;
        } else {
            let url = API_URL + api
    
            let queryObj = Object.assign({}, body)
            const queryParams = new URLSearchParams(<Array<any>>entries(queryObj)).toString()
            url += `?${queryParams}&private_token=${PRIVATE_TOKEN}`
        
            let result: any = await this.Request(url, { onError: () => {}});
            return result
        }        
    }

    public async fetchGitlabSnippets (rawUrl: string, props: QueryOptions) {
        const { onError: rootOnError } = props;
        let url = this.getGitlabId(rawUrl);
        let id = encodeURIComponent(url)
        let snippets: any = await this.gitlabRequest(`projects/${id}/snippets`, { onError: (e: any) => {
            rootOnError(e);
        }});

        if (Array.isArray(snippets)) {
            const promiseList = snippets.map(async (item: any) => {
                const { id: itemId } = item
                return new Promise(async (resolve, reject) => {
                  const rawContent = await this.gitlabRequest(`projects/${id}/snippets/${itemId}/raw`, {
                      onError: () => {
                          reject();
                      }
                  })
                  const fullItem = {
                    ...item,
                    content: rawContent
                  }
          
                  resolve(fullItem)
                })
              })
          
            return Promise.all(promiseList);
        } else if (snippets && snippets.message) {
            window.showInformationMessage('拉取代码片段失败，请检查是否在公司内网环境!');
            return Promise.resolve(null);
        }
    }

    public async fetchSource () {
        
    }
}
