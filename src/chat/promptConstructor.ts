import * as vscode from 'vscode';
import * as path from 'path';
import { TaskItem } from '../taskParser';

/**
 * Handles prompt construction for chat interactions
 */
export class PromptConstructor {
    /**
     * Construct a complete prompt with task info and steering file instructions
     */
    static constructPrompt(task: TaskItem, steeringFiles: vscode.Uri[] = []): string {
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
     * Create a simple test prompt
     */
    static createTestPrompt(): string {
        return '# 🧪 TaskFlow Test\n\nHello! This is a test from TaskFlow extension. Please respond to confirm the chat integration is working.';
    }
}
