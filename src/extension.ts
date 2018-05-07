'use strict';

import { commands, ExtensionContext } from 'vscode';
import UpdateHandler from './updateHelper';
import SnippetHandler from './snippetHelper';
import StatusHandler from './statusHelper';
import ConfigHelper from './configHelper';
import { UPDATE_COMMAND, CONFIG_COMMAND, MAP_COMMAND } from './static';

export function activate(context: ExtensionContext) {
    const statusBar = new StatusHandler();
    commands.registerCommand(UPDATE_COMMAND, async () => {
        // commands.executeCommand('workbench.action.openSettings')
        // window.setStatusBarMessage('abcdegf', 2000)
        // UpdateHandler.updateGitlab();
        UpdateHandler.updateRiddle();
    });

    commands.registerCommand(MAP_COMMAND, async () => {
        SnippetHandler.generateSnippetsMap();
    });

    commands.registerCommand(CONFIG_COMMAND, async () => {
        ConfigHelper.config();
    });

    context.subscriptions.push(statusBar);
}

export function deactivate() {
    
}