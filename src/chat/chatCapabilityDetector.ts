import * as vscode from 'vscode';

/**
 * Detects available chat capabilities and extensions
 */
export class ChatCapabilityDetector {
    private outputChannel: vscode.OutputChannel;

    constructor(outputChannel: vscode.OutputChannel) {
        this.outputChannel = outputChannel;
    }

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

    private logError(message: string): void {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[${timestamp}] ERROR: ${message}`);
        console.error(`PufferFlow Chat Error: ${message}`);
    }
}
