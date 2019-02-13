'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { workspace, languages, window, commands, ExtensionContext, Disposable } from 'vscode';
//import ContentProvider, { encodeLocation } from './provider';


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

//region
import { spawn, fork, spawnSync } from "child_process";

class GTTContentProvider
    implements vscode.TextDocumentContentProvider {
    static scheme = 'gtt-html';
    private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
    private _documents = new Map<string, string>();
    private _subscriptions: vscode.Disposable;


    constructor() {
        //listener for cleaning up on document close
        this._subscriptions =
            vscode.workspace.onDidCloseTextDocument(doc => this._documents.delete(doc.uri.toString()));
    }

    get onDidChange() {
        return this._onDidChange.event;
    }
    provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): string {
        let document = this._documents.get(uri.toString());
        if (document) { }

        console.log("/home/weigl/work/verifaps-lib/casestudies/build/install/casestudies/bin/ttprint",
            ["--format", "html", uri.fsPath], { 'cwd': '.' });

        let process = spawnSync("/home/weigl/work/verifaps-lib/casestudies/build/install/casestudies/bin/ttprint",
            ["--format", "html", uri.fsPath], { 'cwd': '.' });

        let content = process.stdout+"";
        return content;
    }
}

export function encodeLocation(uri: vscode.Uri, pos: vscode.Position): vscode.Uri {
    const query = JSON.stringify([uri.toString(), pos.line, pos.character]);
    return vscode.Uri.parse(`${GTTContentProvider.scheme}://${uri.fsPath}`);
}
//endregion


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "geteta-vscode" is now active!');
    let disposable = vscode.commands.registerCommand('extension.sayHello', () => {
        vscode.window.showInformationMessage('Hello World!');
    });

    const provider = new GTTContentProvider();

    // register content provider for scheme `references`
    // register document link provider for scheme `references`
    const providerRegistrations = Disposable.from(
        workspace.registerTextDocumentContentProvider(GTTContentProvider.scheme, provider)
        , vscode.languages.registerDocumentFormattingEditProvider("gtt", new GTTFormattingProvider())
        , disposable
        //, languages.registerDocumentLinkProvider({ scheme: GTTContentProvider.scheme }, provider)
    );

    // register command that crafts an uri with the `references` scheme,
    // open the dynamic document, and shows it in the next editor
    const commandRegistration = commands.registerTextEditorCommand('editor.previewGtt', editor => {
        const uri = encodeLocation(editor.document.uri, editor.selection.active);
        return workspace.openTextDocument(uri)
            .then(doc => window.showTextDocument(doc, editor.viewColumn + 1));
    });

    context.subscriptions.push(
        //provider,
        commandRegistration,
        providerRegistrations
    );


    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }
