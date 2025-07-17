import * as vscode from 'vscode';
import { TaskParser } from './taskParser';
import { ButtonRenderer } from './buttonRenderer';
import { ChatIntegrator } from './chatIntegrator';

let taskParser: TaskParser;
let buttonRenderer: ButtonRenderer;
let chatIntegrator: ChatIntegrator;

export function activate(context: vscode.ExtensionContext) {
	console.log('TaskFlow: Extension activating...');

	try {
		// Initialize components
		taskParser = new TaskParser();
		buttonRenderer = new ButtonRenderer(taskParser);
		chatIntegrator = new ChatIntegrator(context);

		// Test command to verify extension is working with error handling
		const testCommand = vscode.commands.registerCommand('taskflow.test', async () => {
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

				// Test chat integration
				try {
					const chatTest = await chatIntegrator.testChatIntegration();
					console.log('Chat integration test:', chatTest);

					let statusMessage = `Chat Status: ${chatTest.success ? 'Available' : 'Not Available'}`;

					if (chatTest.capabilities.length > 0) {
						statusMessage += `\nCapabilities: ${chatTest.capabilities.join(', ')}`;
					}

					if (!chatTest.success && chatTest.message) {
						statusMessage += `\nError: ${chatTest.message}`;
					}

					vscode.window.showInformationMessage(statusMessage);

				} catch (error) {
					vscode.window.showErrorMessage(`Error testing chat integration: ${error}`);
					chatIntegrator.showOutput();
				}
			} else {
				vscode.window.showWarningMessage('TaskFlow: This is not a markdown document');
			}
		});		// Enhanced start task command with agent communication
		const startTaskCommand = vscode.commands.registerCommand('taskflow.startTask', async (lineNumber?: number, task?: any) => {
			if (lineNumber === undefined) {
				vscode.window.showErrorMessage('TaskFlow: No task line specified');
				return;
			}

			try {
				// Start execution state
				buttonRenderer.startTaskExecution(lineNumber);

				// Show user feedback
				vscode.window.showInformationMessage(`TaskFlow: Opening chat for task at line ${lineNumber + 1}...`);

				// Use chat integrator for simple task execution
				const result = await chatIntegrator.executeTask(task);

				// End execution state based on result
				buttonRenderer.endTaskExecution(lineNumber, result.success);

				if (result.success) {
					vscode.window.showInformationMessage(`TaskFlow: ${result.message}`);
				} else {
					const action = await vscode.window.showErrorMessage(
						`TaskFlow: ${result.message}`,
						'Show Details', 'Retry'
					);

					if (action === 'Retry') {
						// Retry the task
						vscode.commands.executeCommand('taskflow.startTask', lineNumber, task);
					} else if (action === 'Show Details') {
						chatIntegrator.showOutput();
					}
				}

			} catch (error) {
				// End execution state with error
				buttonRenderer.endTaskExecution(lineNumber, false);
				vscode.window.showErrorMessage(`TaskFlow: Task execution failed: ${error}`);
				chatIntegrator.showOutput();
			}
		});

		// Enhanced retry task command with agent communication
		const retryTaskCommand = vscode.commands.registerCommand('taskflow.retryTask', async (lineNumber?: number, task?: any) => {
			if (lineNumber === undefined) {
				vscode.window.showErrorMessage('TaskFlow: No task line specified');
				return;
			}

			try {
				// Start execution state
				buttonRenderer.startTaskExecution(lineNumber);

				// Show user feedback
				vscode.window.showInformationMessage(`TaskFlow: Retrying task at line ${lineNumber + 1}...`);

				// Use chat integrator for task retry
				const result = await chatIntegrator.executeTask(task);

				// End execution state based on result
				buttonRenderer.endTaskExecution(lineNumber, result.success);

				if (result.success) {
					vscode.window.showInformationMessage(`TaskFlow: ${result.message}`);
				} else {
					const action = await vscode.window.showErrorMessage(
						`TaskFlow: Task retry failed: ${result.message}`,
						'Show Details', 'Retry Again'
					);

					if (action === 'Retry Again') {
						// Retry the task again
						vscode.commands.executeCommand('taskflow.retryTask', lineNumber, task);
					} else if (action === 'Show Details') {
						chatIntegrator.showOutput();
					}
				}

			} catch (error) {
				// End execution state with error
				buttonRenderer.endTaskExecution(lineNumber, false);
				vscode.window.showErrorMessage(`TaskFlow: Task retry failed: ${error}`);
				chatIntegrator.showOutput();
			}
		});

		// Register all commands
		context.subscriptions.push(testCommand);
		context.subscriptions.push(startTaskCommand);
		context.subscriptions.push(retryTaskCommand);
		context.subscriptions.push(buttonRenderer);
		context.subscriptions.push(chatIntegrator);

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
	if (chatIntegrator) {
		chatIntegrator.dispose();
	}
	console.log('TaskFlow extension is now deactivated');
}
