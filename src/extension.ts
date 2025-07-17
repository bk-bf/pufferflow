import * as vscode from 'vscode';
import { TaskParser } from './taskParser';
import { ButtonRenderer } from './buttonRenderer';

/**
 * TaskFlow Extension Entry Point
 * Handles activation events, registers commands, and initializes components
 */
export function activate(context: vscode.ExtensionContext) {
	console.log('TaskFlow extension is now active!');

	// Initialize components
	const taskParser = new TaskParser();
	const buttonRenderer = new ButtonRenderer(taskParser);

	// Register commands with enhanced functionality
	const startTaskCommand = vscode.commands.registerCommand('taskflow.startTask', async (lineNumber?: number, taskItem?: any) => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor');
			return;
		}

		const document = editor.document;
		if (!taskParser.isTasksDocument(document)) {
			vscode.window.showWarningMessage('This is not a tasks document');
			return;
		}

		// If called from CodeLens, use the provided line number
		const targetLine = lineNumber ?? editor.selection.active.line;

		// Show loading state
		buttonRenderer.updateButtonState(targetLine, true);

		try {
			// Simulate task execution (will be replaced with actual agent communication)
			await new Promise(resolve => setTimeout(resolve, 2000));

			// Show success
			buttonRenderer.showSuccessDecoration(editor, targetLine);

			const taskCount = taskParser.getTaskCount(document);
			vscode.window.showInformationMessage(
				`Task started! Found ${taskCount.total} total tasks, ${taskCount.uncompleted} uncompleted`
			);
		} catch (error) {
			// Show error state
			buttonRenderer.showErrorDecoration(editor, targetLine);
			vscode.window.showErrorMessage(`Failed to start task: ${error}`);
		} finally {
			// Clear loading state
			buttonRenderer.updateButtonState(targetLine, false);
		}
	});

	const retryTaskCommand = vscode.commands.registerCommand('taskflow.retryTask', async (lineNumber?: number, taskItem?: any) => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor');
			return;
		}

		const document = editor.document;
		if (!taskParser.isTasksDocument(document)) {
			vscode.window.showWarningMessage('This is not a tasks document');
			return;
		}

		// If called from CodeLens, use the provided line number
		const targetLine = lineNumber ?? editor.selection.active.line;

		// Show loading state
		buttonRenderer.updateButtonState(targetLine, true);

		try {
			// Simulate task retry (will be replaced with actual agent communication)
			await new Promise(resolve => setTimeout(resolve, 1500));

			// Show success
			buttonRenderer.showSuccessDecoration(editor, targetLine);

			const completedTasks = taskParser.getCompletedTasks(document);
			vscode.window.showInformationMessage(
				`Task retried! Found ${completedTasks.length} completed tasks available for retry`
			);
		} catch (error) {
			// Show error state
			buttonRenderer.showErrorDecoration(editor, targetLine);
			vscode.window.showErrorMessage(`Failed to retry task: ${error}`);
		} finally {
			// Clear loading state
			buttonRenderer.updateButtonState(targetLine, false);
		}
	});

	// Register document change detection with cache invalidation
	const documentChangeListener = vscode.workspace.onDidChangeTextDocument((event) => {
		const document = event.document;
		if (taskParser.isTasksDocument(document)) {
			// Check if document actually changed content-wise
			if (taskParser.hasDocumentChanged(document)) {
				console.log(`Tasks document changed: ${document.fileName}`);

				// Invalidate cache for this document
				taskParser.onDocumentChanged(document);

				// Pre-warm cache in background for better performance
				setTimeout(() => {
					taskParser.preWarmCache(document);
					// Refresh button rendering after cache is warmed
					buttonRenderer.refresh();
				}, 100);
			}
		}
	});

	// Register active editor change detection with efficient parsing
	const editorChangeListener = vscode.window.onDidChangeActiveTextEditor((editor) => {
		if (editor && taskParser.isTasksDocument(editor.document)) {
			console.log(`Switched to tasks document: ${editor.document.fileName}`);

			// Use efficient counting for logging
			const taskCount = taskParser.getTaskCount(editor.document);
			console.log(`Found ${taskCount.total} tasks (${taskCount.uncompleted} uncompleted) in document`);

			// Pre-warm cache for better performance
			taskParser.preWarmCache(editor.document);

			// Render buttons for tasks
			const tasks = taskParser.parseDocument(editor.document);
			buttonRenderer.renderButtons(editor, tasks);
		}
	});

	// Add all subscriptions to context
	context.subscriptions.push(
		startTaskCommand,
		retryTaskCommand,
		documentChangeListener,
		editorChangeListener,
		buttonRenderer // Add button renderer for proper disposal
	);

	// Initialize for currently active editor if it's a tasks document
	const activeEditor = vscode.window.activeTextEditor;
	if (activeEditor && taskParser.isTasksDocument(activeEditor.document)) {
		console.log(`Initial tasks document detected: ${activeEditor.document.fileName}`);

		// Use efficient counting for initial logging
		const taskCount = taskParser.getTaskCount(activeEditor.document);
		console.log(`Initial parsing found ${taskCount.total} tasks (${taskCount.uncompleted} uncompleted)`);

		// Pre-warm cache for this document
		taskParser.preWarmCache(activeEditor.document);

		// Render initial buttons
		const tasks = taskParser.parseDocument(activeEditor.document);
		buttonRenderer.renderButtons(activeEditor, tasks);
	}
}

/**
 * Called when extension is deactivated
 */
export function deactivate() {
	console.log('TaskFlow extension is now deactivated');
}
