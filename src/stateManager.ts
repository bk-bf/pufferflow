import * as vscode from 'vscode';

/**
 * StateManager interface for task completion tracking
 */
export interface StateManagerInterface {
	markTaskComplete(document: vscode.TextDocument, lineNumber: number): Promise<boolean>;
	markTaskIncomplete(document: vscode.TextDocument, lineNumber: number): Promise<boolean>;
	markTaskExecuting(document: vscode.TextDocument, lineNumber: number): Promise<boolean>;
	isTaskExecuting(document: vscode.TextDocument, lineNumber: number): boolean;
	isTaskCompleted(document: vscode.TextDocument, lineNumber: number): boolean;
	saveDocument(document: vscode.TextDocument): Promise<void>;
}

/**
 * StateManager implementation for managing task completion state
 */
export class StateManager implements StateManagerInterface {
	private outputChannel: vscode.OutputChannel;

	constructor(outputChannel: vscode.OutputChannel) {
		this.outputChannel = outputChannel;
	}

	/**
	 * Mark a task as complete by changing [ ] or [-] to [x]
	 */
	async markTaskComplete(document: vscode.TextDocument, lineNumber: number): Promise<boolean> {
		try {
			const line = document.lineAt(lineNumber);
			const lineText = line.text;

			// Replace any incomplete or executing task with completed
			let completedText = lineText;
			if (lineText.includes('- [ ]')) {
				completedText = lineText.replace('- [ ]', '- [x]');
			} else if (lineText.includes('- [-]')) {
				completedText = lineText.replace('- [-]', '- [x]');
			} else {
				return false; // No task found to mark as complete
			}

			const editor = vscode.window.activeTextEditor;
			if (editor && editor.document === document) {
				await editor.edit(editBuilder => {
					editBuilder.replace(line.range, completedText);
				});

				this.log(`Marked task as complete: line ${lineNumber + 1}`);
				return true;
			}

			return false;
		} catch (error) {
			this.logError(`Error marking task as complete: ${error}`);
			return false;
		}
	}

	/**
	 * Mark a task as incomplete by changing [x] or [-] to [ ]
	 */
	async markTaskIncomplete(document: vscode.TextDocument, lineNumber: number): Promise<boolean> {
		try {
			const line = document.lineAt(lineNumber);
			const lineText = line.text;

			// Replace any completed or executing task with incomplete
			let incompleteText = lineText;
			if (lineText.includes('- [x]')) {
				incompleteText = lineText.replace('- [x]', '- [ ]');
			} else if (lineText.includes('- [-]')) {
				incompleteText = lineText.replace('- [-]', '- [ ]');
			} else {
				return false; // No task found to mark as incomplete
			}

			const editor = vscode.window.activeTextEditor;
			if (editor && editor.document === document) {
				await editor.edit(editBuilder => {
					editBuilder.replace(line.range, incompleteText);
				});

				this.log(`Marked task as incomplete: line ${lineNumber + 1}`);
				return true;
			}

			return false;
		} catch (error) {
			this.logError(`Error marking task as incomplete: ${error}`);
			return false;
		}
	}

	/**
	 * Mark task as executing by changing [ ] to [-]
	 */
	async markTaskExecuting(document: vscode.TextDocument, lineNumber: number): Promise<boolean> {
		try {
			const line = document.lineAt(lineNumber);
			const lineText = line.text;

			// Check if it's an incomplete task
			if (lineText.includes('- [ ]')) {
				const executingText = lineText.replace('- [ ]', '- [-]');

				const editor = vscode.window.activeTextEditor;
				if (editor && editor.document === document) {
					await editor.edit(editBuilder => {
						editBuilder.replace(line.range, executingText);
					});

					this.log(`Marked task as executing: line ${lineNumber + 1}`);
					return true;
				}
			}

			return false;
		} catch (error) {
			this.logError(`Error marking task as executing: ${error}`);
			return false;
		}
	}

	/**
	 * Check if a task is currently executing (has [-] marker)
	 */
	isTaskExecuting(document: vscode.TextDocument, lineNumber: number): boolean {
		try {
			const line = document.lineAt(lineNumber);
			return line.text.includes('- [-]');
		} catch (error) {
			return false;
		}
	}

	/**
	 * Check if a task is completed (has [x] marker)
	 */
	isTaskCompleted(document: vscode.TextDocument, lineNumber: number): boolean {
		try {
			const line = document.lineAt(lineNumber);
			return line.text.includes('- [x]') || line.text.includes('-[x]');
		} catch (error) {
			return false;
		}
	}

	/**
	 * Save document changes to disk
	 */
	async saveDocument(document: vscode.TextDocument): Promise<void> {
		try {
			if (document.isDirty) {
				await document.save();
				this.log(`Document saved: ${document.fileName}`);
			}
		} catch (error) {
			this.logError(`Error saving document: ${error}`);
		}
	}

	private log(message: string): void {
		const timestamp = new Date().toISOString();
		this.outputChannel.appendLine(`[${timestamp}] ${message}`);
		console.log(`PufferFlow StateManager: ${message}`);
	}

	private logError(message: string): void {
		const timestamp = new Date().toISOString();
		this.outputChannel.appendLine(`[${timestamp}] ERROR: ${message}`);
		console.error(`PufferFlow StateManager Error: ${message}`);
	}
}
