'use strict';

import { commands, ExtensionContext } from 'vscode';
import { UpdateHelper } from './updateHelper';
import SnippetHandler from './snippetHelper';
import { StatusHelper } from './statusHelper';
import { UPDATE_COMMAND, CONFIG_COMMAND, MAP_COMMAND } from './static';

export function activate(context: ExtensionContext) {
    const statusBar = new StatusHelper();
    context.subscriptions.push(statusBar);

    context.subscriptions.push(commands.registerCommand(UPDATE_COMMAND, async () => {
        UpdateHelper.update();
    }));

    context.subscriptions.push(commands.registerCommand(MAP_COMMAND, async () => {
        SnippetHandler.generateSnippetsMap();
    }));

    context.subscriptions.push(commands.registerCommand(CONFIG_COMMAND, async () => {
        UpdateHelper.config();
    }));
}

export function deactivate() {
    
}