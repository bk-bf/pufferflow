import * as vscode from 'vscode';
import { TaskItem } from './taskParser';
import { PromptConstructor } from './chat/promptConstructor';
import { SteeringDocumentManager } from './chat/steeringDocumentManager';
import { ChatPromptInjector } from './chat/chatPromptInjector';
import { ChatCapabilityDetector } from './chat/chatCapabilityDetector';

/**
 * Simplified chat integration for TaskFlow
 * Refactored into modular components for better maintainability
 */
export class ChatIntegrator {
    private context: vscode.ExtensionContext;
    private outputChannel: vscode.OutputChannel;
    private steeringManager: SteeringDocumentManager;
    private promptInjector: ChatPromptInjector;
    private capabilityDetector: ChatCapabilityDetector;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.outputChannel = vscode.window.createOutputChannel('TaskFlow Chat');

        // Initialize modular components
        this.steeringManager = new SteeringDocumentManager(this.outputChannel);
        this.promptInjector = new ChatPromptInjector(this.outputChannel);
        this.capabilityDetector = new ChatCapabilityDetector(this.outputChannel);
    }

    /**
     * Handle task execution by opening chat with prepared prompt and attachments
     */
    async executeTask(task: TaskItem): Promise<{ success: boolean; message: string; keepLoading?: boolean }> {
        try {
            this.log(`Executing task: ${task.taskText}`);

            // Get steering files first
            const steeringFiles = await this.steeringManager.getSteeringFilePaths();

            // Construct prompt with steering file information included
            const prompt = PromptConstructor.constructPrompt(task, steeringFiles);

            // Try to open VS Code chat with the prompt
            const success = await this.openChatWithPrompt(prompt, steeringFiles);

            return {
                success,
                message: success ? 'Task sent to VS Code chat successfully' : 'Failed to send task to chat',
                keepLoading: success // Keep button in loading state if successfully sent to chat
            };

        } catch (error) {
            this.logError(`Failed to execute task: ${error}`);
            return {
                success: false,
                message: `Failed to open chat: ${error}`,
                keepLoading: false
            };
        }
    }

    /**
     * Open VS Code chat panel with the constructed prompt
     */
    private async openChatWithPrompt(prompt: string, steeringFiles: vscode.Uri[]): Promise<boolean> {
        try {
            // Method 1: Try to focus chat panel and inject prompt
            await vscode.commands.executeCommand('workbench.panel.chat.view.copilot.focus');
            await this.sleep(300);

            // Try to send the prompt automatically
            if (await this.promptInjector.injectPromptIntoChat(prompt)) {
                this.log('Prompt sent to chat successfully');
                if (steeringFiles.length > 0) {
                    this.log(`Steering files available for manual attachment: ${steeringFiles.map(f => f.fsPath.split('/').pop()).join(', ')}`);
                }
                return true;
            }

            // Method 2: Try alternative chat APIs
            if (await this.promptInjector.trySendToVSCodeAgent(prompt, steeringFiles)) {
                return true;
            }

            if (await this.promptInjector.trySendToCopilotChat(prompt, steeringFiles)) {
                return true;
            }

            // Fallback: Copy to clipboard and show in output
            this.log('Automatic prompt submission failed, falling back to clipboard method');
            await this.fallbackChatIntegration(prompt, steeringFiles);
            return true; // Still consider it successful since we provided the prompt

        } catch (error) {
            this.logError(`Error opening chat: ${error}`);
            await this.fallbackChatIntegration(prompt, steeringFiles);
            return false;
        }
    }

    /**
     * Fallback chat integration when automatic injection fails
     */
    private async fallbackChatIntegration(prompt: string, steeringFiles: vscode.Uri[]): Promise<void> {
        try {
            // Copy prompt to clipboard
            await vscode.env.clipboard.writeText(prompt);

            this.log('Could not open chat automatically. Prompt copied to clipboard.');
            if (steeringFiles.length > 0) {
                this.log(`Steering files available for manual attachment: ${steeringFiles.map(f => f.fsPath.split('/').pop()).join(', ')}`);
            }

            // Show the prompt in output for reference
            this.steeringManager.showPromptInOutput(prompt, steeringFiles);

        } catch (error) {
            this.logError(`Fallback chat integration failed: ${error}`);
        }
    }

    /**
     * Test chat integration
     */
    async testChatIntegration(): Promise<{ success: boolean; message: string; capabilities: string[] }> {
        try {
            const isAvailable = await this.capabilityDetector.isChatAvailable();
            const capabilities = await this.capabilityDetector.getChatCapabilities();

            if (isAvailable) {
                const testPrompt = PromptConstructor.createTestPrompt();
                await this.openChatWithPrompt(testPrompt, []);
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
     * Sleep utility for timing delays
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
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
