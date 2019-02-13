'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { setupMaster } from 'cluster';


class GTTFormattingProvider implements vscode.DocumentFormattingEditProvider {
    /**
     * Provide formatting edits for a whole document.
     *
     * @param document The document in which the command was invoked.
     * @param options Options controlling formatting.
     * @param token A cancellation token.
     * @return A set of text edits or a thenable that resolves to such. The lack of a result can be
     * signaled by returning `undefined`, `null`, or an empty array.
     */
    provideDocumentFormattingEdits(document: vscode.TextDocument,
        options: vscode.FormattingOptions,
        token: vscode.CancellationToken) {
        let edits: vscode.TextEdit[] = [];
        let lineCnt = document.lineCount;
        let brace = 0;
        for (let line = 0; line < lineCnt; ++line) {
            let l = document.lineAt(line);
            let wsStart = l.range.start.character;
            for (; wsStart <= l.range.end.character; ++wsStart) {
                let c = l.text.charAt(wsStart);
                if (c != ' ' && c != "\t") break;
            }
            //TODO get current spaces 
            let range: vscode.Range = new vscode.Range(l.range.start,
                new vscode.Position(l.range.end.line, wsStart));
            edits.push(vscode.TextEdit.replace(range, repeatText("    ", brace)));
            brace += countBraces(l.text);
        }
        return edits;
    }
}

function countBraces(text: string): number {
    let sum = 0;
    for (let i = 0; i < text.length; ++i) {
        if (text.charAt(i) == '{') sum++;
        if (text.charAt(i) == '}') sum--;
    }
    return sum;
}

function repeatText(text: string, num: number): string {
    let result = "";
    for (let i = 0; i < num; i++) result += text;
    return result;
}


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "geteta-vscode" is now active!');

    let disposable = vscode.commands.registerCommand('extension.sayHello', () => {
        vscode.window.showInformationMessage('Hello World!');
    });

    vscode.languages.registerDocumentFormattingEditProvider(
        "gtt", new GTTFormattingProvider())


    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
