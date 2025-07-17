import * as vscode from 'vscode';
import { TaskParser } from './taskParser';
import { ButtonRenderer } from './buttonRenderer';

let taskParser: TaskParser;
let buttonRenderer: ButtonRenderer;

export function activate(context: vscode.ExtensionContext) {
	console.log('TaskFlow: Extension activating...');

	try {
		// Initialize components
		taskParser = new TaskParser();
		buttonRenderer = new ButtonRenderer(taskParser);

		// Test command to verify extension is working
		const testCommand = vscode.commands.registerCommand('taskflow.test', () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				vscode.window.showErrorMessage('No active editor');
				return;
			}

			console.log('TaskFlow: Test command executed');
			console.log('Document language:', editor.document.languageId);
			console.log('Document filename:', editor.document.fileName);

			if (editor.document.languageId === 'markdown') {
				const tasks = taskParser.parseDocument(editor.document);
				vscode.window.showInformationMessage(`TaskFlow: Found ${tasks.length} tasks in this document!`);
				console.log('Tasks found:', tasks);
			} else {
				vscode.window.showWarningMessage('TaskFlow: This is not a markdown document');
			}
		});

		// Simple start task command
		const startTaskCommand = vscode.commands.registerCommand('taskflow.startTask', async (lineNumber?: number) => {
			vscode.window.showInformationMessage(`TaskFlow: Start task at line ${lineNumber || 'current'}`);
		});

		// Simple retry task command  
		const retryTaskCommand = vscode.commands.registerCommand('taskflow.retryTask', async (lineNumber?: number) => {
			vscode.window.showInformationMessage(`TaskFlow: Retry task at line ${lineNumber || 'current'}`);
		});

		// Register all commands
		context.subscriptions.push(testCommand);
		context.subscriptions.push(startTaskCommand);
		context.subscriptions.push(retryTaskCommand);
		context.subscriptions.push(buttonRenderer);

		// Test with current editor
		const currentEditor = vscode.window.activeTextEditor;
		if (currentEditor && currentEditor.document.languageId === 'markdown') {
			console.log('TaskFlow: Initial markdown file detected');
			const tasks = taskParser.parseDocument(currentEditor.document);
			console.log(`TaskFlow: Found ${tasks.length} tasks initially`);
			buttonRenderer.renderButtons(currentEditor, tasks);
		}

		console.log('TaskFlow: Extension activated successfully!');
		vscode.window.showInformationMessage('TaskFlow extension is ready!');

	} catch (error) {
		console.error('TaskFlow: Error during activation:', error);
		vscode.window.showErrorMessage(`TaskFlow activation failed: ${error}`);
	}
}

export function deactivate() {
	if (buttonRenderer) {
		buttonRenderer.dispose();
	}
	console.log('TaskFlow extension is now deactivated');
}
