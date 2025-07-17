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
				console.log('No active editor');
				return;
			}

			console.log('TaskFlow: Test command executed');
			console.log('Document language:', editor.document.languageId);
			console.log('Document filename:', editor.document.fileName);

			if (editor.document.languageId === 'markdown') {
				const tasks = taskParser.parseDocument(editor.document);
				console.log(`TaskFlow: Found ${tasks.length} tasks in this document`);
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

					console.log(statusMessage);

				} catch (error) {
					console.error(`Error testing chat integration: ${error}`);
					chatIntegrator.showOutput();
				}
			} else {
				console.log('TaskFlow: This is not a markdown document');
			}
		});		// Enhanced start task command with agent communication
		const startTaskCommand = vscode.commands.registerCommand('taskflow.startTask', async (lineNumber?: number, task?: any) => {
			if (lineNumber === undefined) {
				console.log('TaskFlow: No task line specified');
				return;
			}

			try {
				// Start execution state
				buttonRenderer.startTaskExecution(lineNumber);

				console.log(`TaskFlow: Opening chat for task at line ${lineNumber + 1}...`);

				// Use chat integrator for simple task execution
				const result = await chatIntegrator.executeTask(task);

				// End execution state based on result
				buttonRenderer.endTaskExecution(lineNumber, result.success);

				if (!result.success) {
					console.error(`TaskFlow: ${result.message}`);
					chatIntegrator.showOutput();
				}

			} catch (error) {
				// End execution state with error
				buttonRenderer.endTaskExecution(lineNumber, false);
				console.error(`TaskFlow: Task execution failed: ${error}`);
				chatIntegrator.showOutput();
			}
		});

		// Enhanced retry task command with agent communication
		const retryTaskCommand = vscode.commands.registerCommand('taskflow.retryTask', async (lineNumber?: number, task?: any) => {
			if (lineNumber === undefined) {
				console.log('TaskFlow: No task line specified');
				return;
			}

			try {
				// Start execution state
				buttonRenderer.startTaskExecution(lineNumber);

				console.log(`TaskFlow: Retrying task at line ${lineNumber + 1}...`);

				// Use chat integrator for task retry
				const result = await chatIntegrator.executeTask(task);

				// End execution state based on result
				buttonRenderer.endTaskExecution(lineNumber, result.success);

				if (!result.success) {
					console.error(`TaskFlow: Task retry failed: ${result.message}`);
					chatIntegrator.showOutput();
				}

			} catch (error) {
				// End execution state with error
				buttonRenderer.endTaskExecution(lineNumber, false);
				console.error(`TaskFlow: Task retry failed: ${error}`);
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

	} catch (error) {
		console.error('TaskFlow: Error during activation:', error);
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
