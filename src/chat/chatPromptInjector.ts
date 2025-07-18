import * as vscode from 'vscode';

/**
 * Handles chat prompt injection and submission
 */
export class ChatPromptInjector {
    private outputChannel: vscode.OutputChannel;

    constructor(outputChannel: vscode.OutputChannel) {
        this.outputChannel = outputChannel;
    }

    /**
     * Try to inject prompt directly into the chat input
     */
    async injectPromptIntoChat(prompt: string): Promise<boolean> {
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
     * Try to send prompt directly to VS Code agent
     */
    async trySendToVSCodeAgent(prompt: string, attachments: vscode.Uri[]): Promise<boolean> {
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
            }

            // Method 2: Try specific chat commands (these likely won't work but worth trying)
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
            }

            return false;
        } catch (error) {
            this.logError(`Error sending to VS Code agent: ${error}`);
            return false;
        }
    }

    /**
     * Try to send prompt directly to Copilot Chat
     */
    async trySendToCopilotChat(prompt: string, attachments: vscode.Uri[]): Promise<boolean> {
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
     * Sleep utility for timing delays
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private log(message: string): void {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[${timestamp}] ${message}`);
        console.log(`PufferFlow Chat: ${message}`);
    }

    private logError(message: string): void {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[${timestamp}] ERROR: ${message}`);
        console.error(`PufferFlow Chat Error: ${message}`);
    }
}
