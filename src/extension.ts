import * as vscode from 'vscode';
import { TaskParser } from './taskParser';
import { ButtonRenderer } from './buttonRenderer';
import { ChatIntegrator } from './chatIntegrator';

let taskParser: TaskParser;
let buttonRenderer: ButtonRenderer;
let chatIntegrator: ChatIntegrator;

export function activate(context: vscode.ExtensionContext) {
	console.log('PufferFlow: Extension activating...');

	try {
		// Initialize components
		taskParser = new TaskParser();
		buttonRenderer = new ButtonRenderer(taskParser);
		chatIntegrator = new ChatIntegrator(context);

		// Test command to verify extension is working with error handling
		const testCommand = vscode.commands.registerCommand('PufferFlow.test', async () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				console.log('No active editor');
				return;
			}

			console.log('PufferFlow: Test command executed');
			console.log('Document language:', editor.document.languageId);
			console.log('Document filename:', editor.document.fileName);

			if (editor.document.languageId === 'markdown') {
				const tasks = taskParser.parseDocument(editor.document);
				console.log(`PufferFlow: Found ${tasks.length} tasks in this document`);
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
				console.log('PufferFlow: This is not a markdown document');
			}
		});		// Enhanced start task command with agent communication
		const startTaskCommand = vscode.commands.registerCommand('PufferFlow.startTask', async (lineNumber?: number, task?: any) => {
			if (lineNumber === undefined) {
				console.log('PufferFlow: No task line specified');
				return;
			}

			try {
				// Start execution state
				buttonRenderer.startTaskExecution(lineNumber);

				console.log(`PufferFlow: Opening chat for task at line ${lineNumber + 1}...`);

				// Use chat integrator for simple task execution
				const result = await chatIntegrator.executeTask(task);

				if (result.success && result.keepLoading) {
					// Keep button in loading state while chat processes
					// The button will automatically end loading when the task is marked as complete
					console.log('PufferFlow: Task sent to chat, keeping button in loading state until task completion...');

					// The ButtonRenderer now handles the 60-second timeout automatically
					// Don't call endTaskExecution immediately - let task completion detection handle it
				} else {
					// End execution state based on result (for failures)
					buttonRenderer.endTaskExecution(lineNumber, result.success);
				}

				if (!result.success) {
					console.error(`PufferFlow: ${result.message}`);
					chatIntegrator.showOutput();
				}

			} catch (error) {
				// End execution state with error
				buttonRenderer.endTaskExecution(lineNumber, false);
				console.error(`PufferFlow: Task execution failed: ${error}`);
				chatIntegrator.showOutput();
			}
		});

		// Enhanced retry task command with agent communication
		const retryTaskCommand = vscode.commands.registerCommand('PufferFlow.retryTask', async (lineNumber?: number, task?: any) => {
			if (lineNumber === undefined) {
				console.log('PufferFlow: No task line specified');
				return;
			}

			try {
				// Start execution state
				buttonRenderer.startTaskExecution(lineNumber);

				console.log(`PufferFlow: Retrying task at line ${lineNumber + 1}...`);

				// Use chat integrator for task retry
				const result = await chatIntegrator.executeTask(task);

				// End execution state based on result
				buttonRenderer.endTaskExecution(lineNumber, result.success);

				if (!result.success) {
					console.error(`PufferFlow: Task retry failed: ${result.message}`);
					chatIntegrator.showOutput();
				}

			} catch (error) {
				// End execution state with error
				buttonRenderer.endTaskExecution(lineNumber, false);
				console.error(`PufferFlow: Task retry failed: ${error}`);
				chatIntegrator.showOutput();
			}
		});

		// Abort task command
		const abortTaskCommand = vscode.commands.registerCommand('PufferFlow.abortTask', async (lineNumber?: number) => {
			if (lineNumber === undefined) {
				console.log('PufferFlow: No task line specified');
				return;
			}

			try {
				console.log(`PufferFlow: Aborting task at line ${lineNumber + 1}...`);
				await buttonRenderer.abortTask(lineNumber);

			} catch (error) {
				console.error(`PufferFlow: Task abort failed: ${error}`);
			}
		});		// Register all commands
		context.subscriptions.push(testCommand);
		context.subscriptions.push(startTaskCommand);
		context.subscriptions.push(retryTaskCommand);
		context.subscriptions.push(abortTaskCommand);
		context.subscriptions.push(buttonRenderer);
		context.subscriptions.push(chatIntegrator);

		// Test with current editor
		const currentEditor = vscode.window.activeTextEditor;
		if (currentEditor && currentEditor.document.languageId === 'markdown') {
			console.log('PufferFlow: Initial markdown file detected');
			const tasks = taskParser.parseDocument(currentEditor.document);
			console.log(`PufferFlow: Found ${tasks.length} tasks initially`);
			buttonRenderer.renderButtons(currentEditor, tasks);
		}

		console.log('PufferFlow: Extension activated successfully!');

	} catch (error) {
		console.error('PufferFlow: Error during activation:', error);
	}
}

export function deactivate() {
	if (buttonRenderer) {
		buttonRenderer.dispose();
	}
	if (chatIntegrator) {
		chatIntegrator.dispose();
	}
	console.log('PufferFlow extension is now deactivated');
}
