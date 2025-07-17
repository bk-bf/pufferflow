import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { TaskItem } from './taskParser';

/**
 * Simple chat integration for TaskFlow
 * Replaces complex agent communication with direct VS Code chat integration
 */
export class ChatIntegrator {
    private context: vscode.ExtensionContext;
    private outputChannel: vscode.OutputChannel;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.outputChannel = vscode.window.createOutputChannel('TaskFlow Chat');
    }

    /**
     * Construct a complete prompt with task info and steering file instructions
     */
    private constructPrompt(task: TaskItem, steeringFiles: vscode.Uri[] = []): string {
        const parts: string[] = [];

        // Add task information
        parts.push('# 🎯 Task to Execute\n');
        parts.push(`**Task:** ${task.taskText}`);
        parts.push(`**Status:** ${task.isCompleted ? 'Completed (retry)' : 'New task'}`);
        parts.push(`**Line:** ${task.lineNumber + 1}`);

        // Add steering files information if available
        if (steeringFiles.length > 0) {
            parts.push('\n# 📎 Please Attach Steering Documents\n');
            parts.push('The following steering documents contain important guidelines for this project:');
            steeringFiles.forEach(file => {
                parts.push(`- ${path.basename(file.fsPath)} (${file.fsPath})`);
            });
            parts.push('\n**Please attach these files to your chat for context before proceeding.**');
        }

        // Add instructions
        parts.push('\n# 🚀 Instructions\n');
        parts.push('Please execute the task above following any guidelines provided in the attached steering documents.');
        parts.push('When the task is complete, you can mark it as done by changing `- [ ]` to `- [x]` in the markdown file.');
        parts.push('\n**After completing the task, please provide a brief summary of what you accomplished, including:**');
        parts.push('- What files were created, modified, or deleted');
        parts.push('- Key changes or implementations made');
        parts.push('- Any important decisions or considerations');
        parts.push('- Next steps or recommendations (if applicable)');

        // Add file context if available
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            parts.push(`\n**Current file:** ${editor.document.fileName}`);
        }

        return parts.join('\n');
    }

    /**
     * Get steering document file paths for attachment
     */
    private async getSteeringFilePaths(): Promise<vscode.Uri[]> {
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
     * Open VS Code chat panel with the constructed prompt and attached steering docs
     */
    private async openChatWithPrompt(prompt: string): Promise<void> {
        try {
            // Get steering document file paths
            const steeringFiles = await this.getSteeringFilePaths();

            // Method 1: Try to use VS Code Chat API with attachments (if available)
            if (await this.tryOpenChatWithAttachments(prompt, steeringFiles)) {
                return;
            }

            // Method 2: Focus chat panel and try to send prompt automatically
            await vscode.commands.executeCommand('workbench.panel.chat.view.copilot.focus');

            // Wait for panel to load
            await this.sleep(300);

            // Try to send the prompt automatically first
            if (await this.tryDirectChatInput(prompt)) {
                // Success! Just log it, no popup notifications
                this.log('Prompt sent to chat successfully');
                if (steeringFiles.length > 0) {
                    this.log(`Steering files available for manual attachment: ${steeringFiles.map(f => path.basename(f.fsPath)).join(', ')}`);
                }
                return;
            }

            // If automatic submission failed, fall back to clipboard with clear instructions
            this.log('Automatic prompt submission failed, falling back to clipboard method');

            // Fallback: Copy to clipboard and show instructions
            await vscode.env.clipboard.writeText(prompt);

            // Just log the fallback, no popup notifications
            this.log('Prompt copied to clipboard - please paste into chat');
            if (steeringFiles.length > 0) {
                this.log(`Steering files available: ${steeringFiles.map(f => path.basename(f.fsPath)).join(', ')}`);
                this.log('Open .kiro/steering folder to manually attach files');
            }

        } catch (error) {
            this.logError(`Error opening chat: ${error}`);
            await this.fallbackChatIntegration(prompt);
        }
    }

    /**
     * Try to open chat with attachments using VS Code Chat API
     */
    private async tryOpenChatWithAttachments(prompt: string, attachments: vscode.Uri[]): Promise<boolean> {
        try {
            // Method 1: Try to send directly to VS Code agent using commands
            if (await this.trySendToVSCodeAgent(prompt, attachments)) {
                return true;
            }

            // Method 2: Try GitHub Copilot Chat extension API (if available)
            const copilotChat = vscode.extensions.getExtension('GitHub.copilot-chat');
            if (copilotChat && copilotChat.isActive) {
                this.log('Attempting GitHub Copilot Chat integration');

                // Try to send prompt directly to Copilot Chat
                if (await this.trySendToCopilotChat(prompt, attachments)) {
                    return true;
                }
            }

            // Method 3: Try newer VS Code Chat API (if available in future versions)
            if (vscode.chat && typeof vscode.chat.createChatParticipant === 'function') {
                this.log('Using VS Code Chat API with attachments');

                // Future implementation when VS Code supports this
                // await vscode.commands.executeCommand('workbench.action.chat.open', {
                //     prompt: prompt,
                //     attachments: attachments
                // });

                return false; // Not yet implemented in stable VS Code
            }

            return false;
        } catch (error) {
            this.logError(`Error using chat API with attachments: ${error}`);
            return false;
        }
    }

    /**
     * Try to send prompt directly to VS Code agent
     */
    private async trySendToVSCodeAgent(prompt: string, attachments: vscode.Uri[]): Promise<boolean> {
        try {
            this.log('Attempting to send prompt directly to VS Code agent');

            // Method 1: Try to open chat and then inject the prompt
            await vscode.commands.executeCommand('workbench.panel.chat.view.copilot.focus');

            // Wait for panel to load
            await this.sleep(500);

            // Now try to inject the prompt using various methods
            if (await this.injectPromptIntoChat(prompt)) {
                this.log('Successfully injected prompt into chat');
                return true;
            }            // Method 2: Try specific chat commands (these likely won't work but worth trying)
            const chatCommands = [
                { cmd: 'github.copilot.chat.sendMessage', param: prompt },
                { cmd: 'workbench.action.chat.submit', param: { text: prompt } },
                { cmd: 'github.copilot.chat.submit', param: { message: prompt } }
            ];

            for (const { cmd, param } of chatCommands) {
                try {
                    await vscode.commands.executeCommand(cmd, param);
                    this.log(`Successfully sent prompt using command: ${cmd}`);
                    return true;
                } catch (cmdError) {
                    this.log(`Command ${cmd} failed: ${cmdError}`);
                    continue;
                }
            } return false;
        } catch (error) {
            this.logError(`Error sending to VS Code agent: ${error}`);
            return false;
        }
    }

    /**
     * Try to inject prompt directly into the chat input
     */
    private async injectPromptIntoChat(prompt: string): Promise<boolean> {
        try {
            this.log('Attempting to inject prompt into chat input');

            // Method 1: Try to focus chat input and use clipboard
            await vscode.env.clipboard.writeText(prompt);

            // Try to focus the chat input specifically
            await vscode.commands.executeCommand('workbench.action.chat.focusInput');
            await this.sleep(200);

            // Try to paste the content
            await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
            await this.sleep(200);

            // Try to submit by pressing Enter
            await vscode.commands.executeCommand('workbench.action.chat.submit');

            this.log('Prompt injection method 1 completed');
            return true;

        } catch (error) {
            this.log(`Prompt injection method 1 failed: ${error}`);

            // Method 2: Alternative approach using type command
            try {
                // Focus the chat input first
                await vscode.commands.executeCommand('workbench.panel.chat.view.copilot.focus');
                await this.sleep(300);

                // Try to type directly (this may not work in all contexts)
                await vscode.commands.executeCommand('type', { text: prompt });
                await this.sleep(200);

                // Try to submit
                await vscode.commands.executeCommand('workbench.action.acceptSelectedQuickOpenItem');

                this.log('Prompt injection method 2 completed');
                return true;

            } catch (altError) {
                this.log(`Prompt injection method 2 failed: ${altError}`);

                // Method 3: Fallback using workbench commands
                try {
                    // Copy to clipboard and show instructions
                    await vscode.env.clipboard.writeText(prompt);

                    // Try a few more submission commands
                    const submitCommands = [
                        'workbench.action.chat.submit',
                        'workbench.action.submitQuickOpen',
                        'workbench.action.acceptSelectedQuickOpenItem'
                    ];

                    for (const cmd of submitCommands) {
                        try {
                            await vscode.commands.executeCommand(cmd);
                            this.log(`Prompt submission attempted with: ${cmd}`);
                        } catch (cmdError) {
                            this.log(`Command ${cmd} failed: ${cmdError}`);
                        }
                    }

                    // This method at least gets the prompt ready for manual submission
                    this.log('Prompt injection method 3 completed (clipboard ready)');
                    return false; // Return false since auto-submission likely didn't work

                } catch (finalError) {
                    this.logError(`All prompt injection methods failed: ${finalError}`);
                    return false;
                }
            }
        }
    }

    /**
     * Try to send prompt directly to Copilot Chat
     */
    private async trySendToCopilotChat(prompt: string, attachments: vscode.Uri[]): Promise<boolean> {
        try {
            // Try to use Copilot Chat commands
            const copilotCommands = [
                'github.copilot.chat.openInEditor',
                'github.copilot.chat.open',
                'github.copilot.chat.sendMessage'
            ];

            for (const command of copilotCommands) {
                try {
                    await vscode.commands.executeCommand(command, prompt);
                    this.log(`Successfully sent prompt to Copilot using: ${command}`);
                    return true;
                } catch (cmdError) {
                    this.log(`Copilot command ${command} not available: ${cmdError}`);
                    continue;
                }
            }

            return false;
        } catch (error) {
            this.logError(`Error sending to Copilot Chat: ${error}`);
            return false;
        }
    }

    /**
     * Try to input text directly into the chat input box
     */
    private async tryDirectChatInput(prompt: string): Promise<boolean> {
        // Use the more sophisticated injection method
        return await this.injectPromptIntoChat(prompt);
    }

    /**
     * Sleep utility for timing delays
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Fallback chat integration when attachments aren't supported
     */
    private async fallbackChatIntegration(prompt: string): Promise<void> {
        try {
            const steeringFiles = await this.getSteeringFilePaths();

            // Copy prompt to clipboard
            await vscode.env.clipboard.writeText(prompt);

            // Just log the fallback information, no popup
            this.log('Could not open chat automatically. Prompt copied to clipboard.');
            if (steeringFiles.length > 0) {
                this.log(`Steering files available for manual attachment: ${steeringFiles.map(f => path.basename(f.fsPath)).join(', ')}`);
            }

            // Automatically show the prompt in output for reference
            this.showPromptInOutput(prompt, steeringFiles);

        } catch (error) {
            this.logError(`Fallback chat integration failed: ${error}`);
        }
    }

    /**
     * Show prompt and file information in output channel
     */
    private showPromptInOutput(prompt: string, steeringFiles: vscode.Uri[]): void {
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

    /**
     * Handle task execution by opening chat with prepared prompt and attachments
     */
    async executeTask(task: TaskItem): Promise<{ success: boolean; message: string }> {
        try {
            this.log(`Executing task: ${task.taskText}`);

            // Get steering files first
            const steeringFiles = await this.getSteeringFilePaths();

            // Construct prompt with steering file information included
            const prompt = this.constructPrompt(task, steeringFiles);

            // Open VS Code chat with the prompt
            await this.openChatWithPrompt(prompt);

            return {
                success: true,
                message: 'Task sent to VS Code chat successfully'
            };

        } catch (error) {
            this.logError(`Failed to execute task: ${error}`);
            return {
                success: false,
                message: `Failed to open chat: ${error}`
            };
        }
    }

    // Remove the old readSteeringDocs method since we're now using file attachments
    // ...existing code...
    /**
     * Check if chat integration is available
     */
    async isChatAvailable(): Promise<boolean> {
        try {
            // Check if GitHub Copilot Chat extension is available
            const copilotChat = vscode.extensions.getExtension('GitHub.copilot-chat');
            if (copilotChat) {
                return true;
            }

            // Check for other chat extensions
            const extensions = vscode.extensions.all;
            const chatExtensions = extensions.filter(ext =>
                ext.id.includes('chat') ||
                ext.id.includes('copilot') ||
                ext.id.includes('ai')
            );

            return chatExtensions.length > 0;
        } catch (error) {
            this.logError(`Error checking chat availability: ${error}`);
            return false;
        }
    }

    /**
     * Get available chat capabilities
     */
    async getChatCapabilities(): Promise<string[]> {
        const capabilities: string[] = [];

        try {
            // Check for GitHub Copilot Chat
            const copilotChat = vscode.extensions.getExtension('GitHub.copilot-chat');
            if (copilotChat && copilotChat.isActive) {
                capabilities.push('GitHub Copilot Chat');
            }

            // Check for other AI/chat extensions
            const extensions = vscode.extensions.all;
            const aiExtensions = extensions.filter(ext =>
                (ext.id.includes('chat') || ext.id.includes('ai')) &&
                ext.isActive &&
                ext.id !== 'GitHub.copilot-chat'
            );

            for (const ext of aiExtensions) {
                capabilities.push(ext.packageJSON?.displayName || ext.id);
            }

            if (capabilities.length === 0) {
                capabilities.push('Basic clipboard integration');
            }

        } catch (error) {
            this.logError(`Error getting chat capabilities: ${error}`);
            capabilities.push('Error detecting capabilities');
        }

        return capabilities;
    }

    /**
     * Test chat integration
     */
    async testChatIntegration(): Promise<{ success: boolean; message: string; capabilities: string[] }> {
        try {
            const isAvailable = await this.isChatAvailable();
            const capabilities = await this.getChatCapabilities();

            // Create a simple test prompt
            const testPrompt = '# 🧪 TaskFlow Test\n\nHello! This is a test from TaskFlow extension. Please respond to confirm the chat integration is working.';

            if (isAvailable) {
                await this.openChatWithPrompt(testPrompt);
                return {
                    success: true,
                    message: 'Chat integration test completed successfully',
                    capabilities
                };
            } else {
                return {
                    success: false,
                    message: 'No chat extensions detected',
                    capabilities
                };
            }

        } catch (error) {
            return {
                success: false,
                message: `Chat integration test failed: ${error}`,
                capabilities: []
            };
        }
    }

    /**
     * Log information to output channel
     */
    private log(message: string): void {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[${timestamp}] ${message}`);
        console.log(`TaskFlow Chat: ${message}`);
    }

    /**
     * Log error to output channel
     */
    private logError(message: string): void {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[${timestamp}] ERROR: ${message}`);
        console.error(`TaskFlow Chat Error: ${message}`);
    }

    /**
     * Show output channel
     */
    showOutput(): void {
        this.outputChannel.show();
    }

    /**
     * Dispose of resources
     */
    dispose(): void {
        this.outputChannel.dispose();
    }
}
