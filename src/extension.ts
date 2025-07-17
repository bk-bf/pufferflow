import * as vscode from 'vscode';
import { TaskParser } from './taskParser';
import { ButtonRenderer } from './buttonRenderer';
import { AgentCommunicator } from './agentCommunicator';

let taskParser: TaskParser;
let buttonRenderer: ButtonRenderer;
let agentCommunicator: AgentCommunicator;

export function activate(context: vscode.ExtensionContext) {
	console.log('TaskFlow: Extension activating...');

	try {
		// Initialize components
		taskParser = new TaskParser();
		buttonRenderer = new ButtonRenderer(taskParser);
		agentCommunicator = new AgentCommunicator(context);

		// Test command to verify extension is working
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

				// Test agent availability
				const isAgentAvailable = await agentCommunicator.isAgentAvailable();
				const capabilities = await agentCommunicator.getAgentCapabilities();
				console.log('Agent available:', isAgentAvailable);
				console.log('Agent capabilities:', capabilities);

				vscode.window.showInformationMessage(
					`Agent Status: ${isAgentAvailable ? 'Available' : 'Not Available'} - Capabilities: ${capabilities.join(', ')}`
				);
			} else {
				vscode.window.showWarningMessage('TaskFlow: This is not a markdown document');
			}
		});

		// Enhanced start task command with agent communication
		const startTaskCommand = vscode.commands.registerCommand('taskflow.startTask', async (lineNumber?: number, task?: any) => {
			if (lineNumber === undefined) {
				vscode.window.showErrorMessage('TaskFlow: No task line specified');
				return;
			}

			try {
				// Start execution state
				buttonRenderer.startTaskExecution(lineNumber);

				// Show user feedback
				vscode.window.showInformationMessage(`TaskFlow: Starting task at line ${lineNumber + 1}...`);

				// Use agent communicator for actual task execution
				const prompt = agentCommunicator.constructPrompt(task);
				const result = await agentCommunicator.executeTask(prompt);

				// End execution state based on result
				buttonRenderer.endTaskExecution(lineNumber, result.success);

				if (result.success) {
					vscode.window.showInformationMessage(`TaskFlow: ${result.message}`);
					// Show agent output if user wants to see details
					if (result.details && result.details.suggestions && result.details.suggestions.length > 0) {
						const showDetails = await vscode.window.showInformationMessage(
							'Task completed successfully!',
							'Show Details'
						);
						if (showDetails) {
							agentCommunicator.showOutput();
						}
					}
				} else {
					vscode.window.showErrorMessage(`TaskFlow: ${result.message}`);
					agentCommunicator.showOutput();
				}

			} catch (error) {
				// End execution state with error
				buttonRenderer.endTaskExecution(lineNumber, false);
				vscode.window.showErrorMessage(`TaskFlow: Task execution failed: ${error}`);
				agentCommunicator.showOutput();
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

				// Use agent communicator for actual task retry
				const prompt = agentCommunicator.constructPrompt(task, 'This is a retry of a previously completed task.');
				const result = await agentCommunicator.executeTask(prompt);

				// End execution state based on result
				buttonRenderer.endTaskExecution(lineNumber, result.success);

				if (result.success) {
					vscode.window.showInformationMessage(`TaskFlow: ${result.message}`);
					// Show agent output if user wants to see details
					if (result.details && result.details.suggestions && result.details.suggestions.length > 0) {
						const showDetails = await vscode.window.showInformationMessage(
							'Task retry completed successfully!',
							'Show Details'
						);
						if (showDetails) {
							agentCommunicator.showOutput();
						}
					}
				} else {
					vscode.window.showErrorMessage(`TaskFlow: Task retry failed: ${result.message}`);
					agentCommunicator.showOutput();
				}

			} catch (error) {
				// End execution state with error
				buttonRenderer.endTaskExecution(lineNumber, false);
				vscode.window.showErrorMessage(`TaskFlow: Task retry failed: ${error}`);
				agentCommunicator.showOutput();
			}
		});

		// Register all commands
		context.subscriptions.push(testCommand);
		context.subscriptions.push(startTaskCommand);
		context.subscriptions.push(retryTaskCommand);
		context.subscriptions.push(buttonRenderer);
		context.subscriptions.push(agentCommunicator);

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
	if (agentCommunicator) {
		agentCommunicator.dispose();
	}
	console.log('TaskFlow extension is now deactivated');
}
