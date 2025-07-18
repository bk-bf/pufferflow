import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Handles steering document management and file operations
 */
export class SteeringDocumentManager {
    private outputChannel: vscode.OutputChannel;

    constructor(outputChannel: vscode.OutputChannel) {
        this.outputChannel = outputChannel;
    }

    /**
     * Get steering document file paths for attachment
     */
    async getSteeringFilePaths(): Promise<vscode.Uri[]> {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                this.log('No workspace folder found');
                return [];
            }

            const steeringPath = path.join(workspaceFolder.uri.fsPath, '.kiro', 'steering');

            if (!fs.existsSync(steeringPath)) {
                this.log('No .kiro/steering folder found');
                return [];
            }

            const steeringFiles = fs.readdirSync(steeringPath)
                .filter(file => file.endsWith('.md'))
                .sort();

            this.log(`Found ${steeringFiles.length} steering files: ${steeringFiles.join(', ')}`);

            // Convert to URIs
            return steeringFiles.map(file =>
                vscode.Uri.file(path.join(steeringPath, file))
            );

        } catch (error) {
            this.logError(`Error getting steering file paths: ${error}`);
            return [];
        }
    }

    /**
     * Show prompt and file information in output channel
     */
    showPromptInOutput(prompt: string, steeringFiles: vscode.Uri[]): void {
        this.outputChannel.clear();
        this.outputChannel.appendLine('=== TASK PROMPT ===');
        this.outputChannel.appendLine('');
        this.outputChannel.appendLine(prompt);
        this.outputChannel.appendLine('');

        if (steeringFiles.length > 0) {
            this.outputChannel.appendLine('=== STEERING FILES TO ATTACH ===');
            steeringFiles.forEach(file => {
                this.outputChannel.appendLine(`📎 ${file.fsPath}`);
            });
            this.outputChannel.appendLine('');
        }

        this.outputChannel.appendLine('=== END PROMPT ===');
        this.outputChannel.show();
    }

    private log(message: string): void {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[${timestamp}] ${message}`);
        console.log(`TaskFlow Chat: ${message}`);
    }

    private logError(message: string): void {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[${timestamp}] ERROR: ${message}`);
        console.error(`TaskFlow Chat Error: ${message}`);
    }
}
