import * as vscode from 'vscode';
import { TaskItem } from './taskParser';
import { StateManager } from './stateManager';

/**
 * Button position interface
 */
export interface ButtonPosition {
	line: number;
	character: number;
}

/**
 * Button state enum
 */
export enum ButtonState {
	Normal,
	Loading,
	Disabled
}

/**
 * Button data interface
 */
export interface ButtonData {
	id: string;
	lineNumber: number;
	state: ButtonState;
	type: 'start' | 'retry';
	taskItem: TaskItem;
}

/**
 * ButtonRenderer interface for UI components
 */
export interface ButtonRendererInterface {
	renderButtons(editor: vscode.TextEditor, tasks: TaskItem[]): void;
	updateButtonState(lineNumber: number, isLoading: boolean): void;
	startTaskExecution(lineNumber: number): void;
	endTaskExecution(lineNumber: number, success?: boolean): void;
	disableButton(lineNumber: number): void;
	enableButton(lineNumber: number): void;
	clearButtons(): void;
}

/**
 * TaskFlow CodeLens Provider for rendering interactive buttons
 */
class TaskFlowCodeLensProvider implements vscode.CodeLensProvider {
	private _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
	public readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

	private buttons: Map<string, ButtonData> = new Map();
	private taskParser: any; // Will be injected
	private buttonRenderer: ButtonRenderer; // Reference back to renderer

	constructor(taskParser: any, buttonRenderer: ButtonRenderer) {
		this.taskParser = taskParser;
		this.buttonRenderer = buttonRenderer;
	}

	provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
		if (!this.taskParser.isTasksDocument(document)) {
			return [];
		}

		const tasks = this.taskParser.parseDocument(document);
		const codeLenses: vscode.CodeLens[] = [];

		for (const task of tasks) {
			const line = task.lineNumber;
			const range = new vscode.Range(line, 0, line, 0);

			// Check if this button is in loading state
			const buttonId = `${document.uri.toString()}-${line}`;
			const existingButton = this.buttons.get(buttonId);
			const isLoading = existingButton?.state === ButtonState.Loading;
			const isDisabled = existingButton?.state === ButtonState.Disabled;

			// Check if task is currently executing (has [-] marker)
			const isExecuting = task.isExecuting || false;

			// Debug logging
			if (existingButton) {
				console.log(`TaskFlow: Button state for line ${line + 1}: ${ButtonState[existingButton.state]} (isLoading: ${isLoading}, isExecuting: ${isExecuting})`);
			}

			if (task.isCompleted) {
				// For completed tasks, show "Task completed" indicator with green checkmark
				const completedIndicator = new vscode.CodeLens(range, {
					title: '$(check-all)  Task completed',  // check-all is typically green
					command: '' // No command, just an indicator
				});
				codeLenses.push(completedIndicator);

				// Add a separate retry button with state-aware styling
				let retryTitle = '$(refresh)';
				let retryCommand = 'taskflow.retryTask';

				if (isLoading || isExecuting) {
					retryTitle = '$(sync~spin)  Retrying...';
					retryCommand = ''; // Disable command when loading
				} else if (isDisabled) {
					retryTitle = '$(circle-slash)  Retry';
					retryCommand = ''; // Disable command when disabled
				}

				const retryButton = new vscode.CodeLens(range, {
					title: retryTitle,
					command: retryCommand,
					arguments: retryCommand ? [line, task] : undefined
				});
				codeLenses.push(retryButton);

				// Add abort button if task is executing
				if (isLoading || isExecuting) {
					const abortButton = new vscode.CodeLens(range, {
						title: '$(x)  Abort',
						command: 'taskflow.abortTask',
						arguments: [line, task]
					});
					codeLenses.push(abortButton);
				}
			} else {
				// For incomplete tasks, show start button with state-aware styling
				let startTitle = '$(play)  Start Task';
				let startCommand = 'taskflow.startTask';

				if (isLoading || isExecuting) {
					startTitle = '$(sync~spin)  Executing...';
					startCommand = ''; // Disable command when loading
				} else if (isDisabled) {
					startTitle = '$(circle-slash)  Start Task';
					startCommand = ''; // Disable command when disabled
				}

				const startButton = new vscode.CodeLens(range, {
					title: startTitle,
					command: startCommand,
					arguments: startCommand ? [line, task] : undefined
				});
				codeLenses.push(startButton);

				// Add abort button if task is executing
				if (isLoading || isExecuting) {
					const abortButton = new vscode.CodeLens(range, {
						title: '$(x)  Abort',
						command: 'taskflow.abortTask',
						arguments: [line, task]
					});
					codeLenses.push(abortButton);
				}
			}

			// Store/update button data for state management
			this.buttons.set(buttonId, {
				id: buttonId,
				lineNumber: line,
				state: existingButton?.state || ButtonState.Normal,
				type: task.isCompleted ? 'retry' : 'start',
				taskItem: task
			});
		}

		return codeLenses;
	}

	/**
	 * Update button state and refresh CodeLenses
	 */
	updateButtonState(documentUri: string, lineNumber: number, state: ButtonState): void {
		const buttonId = `${documentUri}-${lineNumber}`;
		const button = this.buttons.get(buttonId);

		if (button) {
			console.log(`TaskFlow: Updating button state for line ${lineNumber + 1} to ${ButtonState[state]}`);
			button.state = state;
		} else {
			console.log(`TaskFlow: Creating new button state for line ${lineNumber + 1} with state ${ButtonState[state]}`);
			// Create a temporary button entry if it doesn't exist
			this.buttons.set(buttonId, {
				id: buttonId,
				lineNumber: lineNumber,
				state: state,
				type: 'start', // Will be updated when provideCodeLenses runs
				taskItem: {} as TaskItem // Will be updated when provideCodeLenses runs
			});
		}

		// Always fire the change event to refresh the CodeLenses
		this._onDidChangeCodeLenses.fire();
	}

	/**
	 * Clear all buttons
	 */
	clearButtons(): void {
		this.buttons.clear();
		this._onDidChangeCodeLenses.fire();
	}

	/**
	 * Get button data for a specific line
	 */
	getButtonData(documentUri: string, lineNumber: number): ButtonData | undefined {
		const buttonId = `${documentUri}-${lineNumber}`;
		return this.buttons.get(buttonId);
	}

	/**
	 * Refresh CodeLenses
	 */
	refresh(): void {
		this._onDidChangeCodeLenses.fire();
	}
}

/**
 * ButtonRenderer implementation for creating UI overlays
 */
export class ButtonRenderer implements ButtonRendererInterface {
	private codeLensProvider: TaskFlowCodeLensProvider;
	private taskParser: any;
	private disposables: vscode.Disposable[] = [];
	public stateManager: StateManager;

	// Decoration types for visual feedback
	private loadingDecorationType!: vscode.TextEditorDecorationType;
	private errorDecorationType!: vscode.TextEditorDecorationType;
	private successDecorationType!: vscode.TextEditorDecorationType;
	private buttonHighlightDecorationType!: vscode.TextEditorDecorationType;

	// Track tasks that are currently in loading state with timeout handling
	private loadingTasks: Map<string, { lineNumber: number; documentUri: string; timeoutId: NodeJS.Timeout }> = new Map();

	constructor(taskParser: any) {
		this.taskParser = taskParser;
		this.codeLensProvider = new TaskFlowCodeLensProvider(taskParser, this);
		this.stateManager = new StateManager(vscode.window.createOutputChannel('TaskFlow State'));

		// Register CodeLens provider
		const codeLensDisposable = vscode.languages.registerCodeLensProvider(
			{ language: 'markdown' },
			this.codeLensProvider
		);
		this.disposables.push(codeLensDisposable);

		// Create decoration types for visual feedback
		this.createDecorationTypes();

		// Listen for active editor changes
		const editorChangeListener = vscode.window.onDidChangeActiveTextEditor(() => {
			this.codeLensProvider.refresh();
		});
		this.disposables.push(editorChangeListener);

		// Listen for document changes to detect task completion
		const documentChangeListener = vscode.workspace.onDidChangeTextDocument((event) => {
			if (this.taskParser.isTasksDocument(event.document)) {
				// Check if any loading tasks got completed
				this.checkForTaskCompletion(event);

				// Slight delay to allow for multiple rapid changes
				setTimeout(() => {
					this.codeLensProvider.refresh();
				}, 100);
			}
		});
		this.disposables.push(documentChangeListener);
	}

	/**
	 * Create decoration types for visual feedback
	 */
	private createDecorationTypes(): void {
		// Use subtle background colors instead of content text to avoid interfering with markdown
		this.loadingDecorationType = vscode.window.createTextEditorDecorationType({
			backgroundColor: new vscode.ThemeColor('editorWarning.background'),
			border: '1px solid',
			borderColor: new vscode.ThemeColor('editorWarning.border'),
			borderRadius: '3px',
			rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
		});

		this.errorDecorationType = vscode.window.createTextEditorDecorationType({
			backgroundColor: new vscode.ThemeColor('errorBackground'),
			border: '1px solid',
			borderColor: new vscode.ThemeColor('errorBorder'),
			borderRadius: '3px',
			rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
		});

		this.successDecorationType = vscode.window.createTextEditorDecorationType({
			backgroundColor: new vscode.ThemeColor('editorInfo.background'),
			border: '1px solid',
			borderColor: new vscode.ThemeColor('editorInfo.border'),
			borderRadius: '3px',
			rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
		});

		// Button highlight decoration for better visibility
		this.buttonHighlightDecorationType = vscode.window.createTextEditorDecorationType({
			backgroundColor: new vscode.ThemeColor('editor.hoverHighlightBackground'),
			border: '1px solid',
			borderColor: new vscode.ThemeColor('focusBorder'),
			borderRadius: '3px',
			rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
		});
	}

	/**
	 * Render buttons above task items
	 */
	renderButtons(editor: vscode.TextEditor, tasks: TaskItem[]): void {
		if (!this.taskParser.isTasksDocument(editor.document)) {
			return;
		}

		// CodeLens provider handles the actual rendering
		// This method can trigger a refresh if needed
		this.codeLensProvider.refresh();
	}

	/**
	 * Update button state (loading, disabled, etc.)
	 */
	updateButtonState(lineNumber: number, isLoading: boolean): void {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}

		const documentUri = editor.document.uri.toString();
		const newState = isLoading ? ButtonState.Loading : ButtonState.Normal;

		// Update CodeLens state
		this.codeLensProvider.updateButtonState(documentUri, lineNumber, newState);

		// Add visual decoration for loading state
		if (isLoading) {
			this.showLoadingDecoration(editor, lineNumber);
		} else {
			this.clearDecorations(editor, lineNumber);
		}
	}

	/**
	 * Start task execution - puts button in loading state and disables interaction
	 */
	startTaskExecution(lineNumber: number): void {
		console.log(`TaskFlow: Starting task execution for line ${lineNumber + 1}`);

		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			console.log('TaskFlow: No active editor for startTaskExecution');
			return;
		}

		const documentUri = editor.document.uri.toString();
		console.log(`TaskFlow: Setting button to loading state for ${documentUri} line ${lineNumber + 1}`);

		// Track this task as loading
		const taskKey = `${documentUri}-${lineNumber}`;

		// Mark task as executing in the document
		this.stateManager.markTaskExecuting(editor.document, lineNumber);

		// Set up timeout to revert to incomplete after 60 seconds
		const timeoutId = setTimeout(async () => {
			try {
				// Get the current document
				const currentDoc = await vscode.workspace.openTextDocument(vscode.Uri.parse(documentUri));
				await this.stateManager.markTaskIncomplete(currentDoc, lineNumber);
				this.loadingTasks.delete(taskKey);
				this.codeLensProvider.refresh();
			} catch (error) {
				console.error('Error reverting task state after timeout:', error);
			}
		}, 60000); // 60 seconds

		this.loadingTasks.set(taskKey, { lineNumber, documentUri, timeoutId });

		// Update button state to loading
		this.codeLensProvider.updateButtonState(documentUri, lineNumber, ButtonState.Loading);

		// Show loading decoration
		this.showLoadingDecoration(editor, lineNumber);
	}

	/**
	 * Check if any loading tasks got completed by monitoring document changes
	 */
	private checkForTaskCompletion(event: vscode.TextDocumentChangeEvent): void {
		if (this.loadingTasks.size === 0) {
			return; // No tasks currently loading
		}

		const documentUri = event.document.uri.toString();

		// Check each change to see if it completed a task
		for (const change of event.contentChanges) {
			// Check if the change contains a completed task checkbox
			const changedText = change.text;
			if (changedText.includes('- [x]') || changedText.includes('-[x]')) {
				console.log('TaskFlow: Detected task completion marker in document change');

				// Get the line numbers that were affected
				const startLine = change.range.start.line;
				const endLine = Math.max(change.range.end.line, startLine + changedText.split('\n').length - 1);

				// Check each loading task to see if it's in the affected range
				for (const [taskKey, taskInfo] of this.loadingTasks.entries()) {
					if (taskInfo.documentUri === documentUri) {
						// Check if the task line was affected or nearby
						if (taskInfo.lineNumber >= startLine - 2 && taskInfo.lineNumber <= endLine + 2) {
							// Double-check by examining the actual line content
							try {
								const line = event.document.lineAt(taskInfo.lineNumber);
								const lineText = line.text;

								// Check if this line now contains a completed task
								if (lineText.includes('- [x]') || lineText.includes('-[x]')) {
									console.log(`TaskFlow: Task on line ${taskInfo.lineNumber + 1} is now completed`);

									// End the loading state for this task (this handles cleanup)
									this.endTaskExecution(taskInfo.lineNumber, true);
									break; // Exit the inner loop since we found the completed task
								}
							} catch (error) {
								console.log(`TaskFlow: Could not check line ${taskInfo.lineNumber + 1}: ${error}`);
							}
						}
					}
				}
			}
		}
	}

	/**
	 * End task execution - removes loading state and restores normal interaction
	 */
	endTaskExecution(lineNumber: number, success: boolean = true): void {
		console.log(`TaskFlow: Ending task execution for line ${lineNumber + 1} (success: ${success})`);

		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}

		const documentUri = editor.document.uri.toString();
		const taskKey = `${documentUri}-${lineNumber}`;

		// Clear timeout if it exists
		const taskInfo = this.loadingTasks.get(taskKey);
		if (taskInfo && taskInfo.timeoutId) {
			clearTimeout(taskInfo.timeoutId);
		}

		// Remove from loading tasks tracking
		this.loadingTasks.delete(taskKey);

		// Update button state back to normal
		this.codeLensProvider.updateButtonState(documentUri, lineNumber, ButtonState.Normal);

		// Clear loading decoration
		this.clearDecorations(editor, lineNumber);

		// Show appropriate feedback decoration
		if (success) {
			this.showSuccessDecoration(editor, lineNumber);
		} else {
			this.showErrorDecoration(editor, lineNumber);
		}
	}

	/**
	 * Abort a currently executing task
	 */
	async abortTask(lineNumber: number): Promise<void> {
		console.log(`TaskFlow: Aborting task execution for line ${lineNumber + 1}`);

		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}

		const documentUri = editor.document.uri.toString();
		const taskKey = `${documentUri}-${lineNumber}`;

		// Try to abort LLM request if it exists
		// Note: We'll need a reference to chatIntegrator for this
		// For now, we'll add a TODO and implement this in the extension.ts

		// Clear timeout if it exists
		const taskInfo = this.loadingTasks.get(taskKey);
		if (taskInfo && taskInfo.timeoutId) {
			clearTimeout(taskInfo.timeoutId);
		}

		// Mark task as incomplete in the document
		await this.stateManager.markTaskIncomplete(editor.document, lineNumber);

		// Remove from loading tasks tracking
		this.loadingTasks.delete(taskKey);

		// Update button state back to normal
		this.codeLensProvider.updateButtonState(documentUri, lineNumber, ButtonState.Normal);

		// Clear loading decoration
		this.clearDecorations(editor, lineNumber);

		// Show info message
		console.log(`TaskFlow: Task on line ${lineNumber + 1} aborted`);

		// Refresh CodeLens to update button states
		this.codeLensProvider.refresh();
	}

	/**
	 * Disable button temporarily (for multi-execution prevention)
	 */
	disableButton(lineNumber: number): void {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}

		const documentUri = editor.document.uri.toString();
		this.codeLensProvider.updateButtonState(documentUri, lineNumber, ButtonState.Disabled);
	}

	/**
	 * Enable button (restore from disabled state)
	 */
	enableButton(lineNumber: number): void {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}

		const documentUri = editor.document.uri.toString();
		this.codeLensProvider.updateButtonState(documentUri, lineNumber, ButtonState.Normal);
	}

	/**
	 * Show loading decoration on a specific line
	 */
	private showLoadingDecoration(editor: vscode.TextEditor, lineNumber: number): void {
		const line = editor.document.lineAt(lineNumber);
		const range = new vscode.Range(lineNumber, 0, lineNumber, line.text.length);
		editor.setDecorations(this.loadingDecorationType, [range]);
	}

	/**
	 * Show success decoration on a specific line
	 */
	showSuccessDecoration(editor: vscode.TextEditor, lineNumber: number): void {
		const line = editor.document.lineAt(lineNumber);
		const range = new vscode.Range(lineNumber, 0, lineNumber, line.text.length);
		editor.setDecorations(this.successDecorationType, [range]);

		// Clear after 2 seconds
		setTimeout(() => {
			this.clearDecorations(editor, lineNumber);
		}, 2000);
	}

	/**
	 * Show error decoration on a specific line
	 */
	showErrorDecoration(editor: vscode.TextEditor, lineNumber: number): void {
		const line = editor.document.lineAt(lineNumber);
		const range = new vscode.Range(lineNumber, 0, lineNumber, line.text.length);
		editor.setDecorations(this.errorDecorationType, [range]);

		// Clear after 3 seconds
		setTimeout(() => {
			this.clearDecorations(editor, lineNumber);
		}, 3000);
	}

	/**
	 * Clear decorations from a specific line
	 */
	private clearDecorations(editor: vscode.TextEditor, lineNumber: number): void {
		editor.setDecorations(this.loadingDecorationType, []);
		editor.setDecorations(this.errorDecorationType, []);
		editor.setDecorations(this.successDecorationType, []);
	}

	/**
	 * Clear all rendered buttons
	 */
	clearButtons(): void {
		this.codeLensProvider.clearButtons();

		// Clear all decorations
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			editor.setDecorations(this.loadingDecorationType, []);
			editor.setDecorations(this.errorDecorationType, []);
			editor.setDecorations(this.successDecorationType, []);
		}
	}

	/**
	 * Get button data for a specific line (useful for testing and debugging)
	 */
	getButtonData(lineNumber: number): ButtonData | undefined {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return undefined;
		}

		const documentUri = editor.document.uri.toString();
		return this.codeLensProvider.getButtonData(documentUri, lineNumber);
	}

	/**
	 * Force refresh of all buttons
	 */
	refresh(): void {
		this.codeLensProvider.refresh();
	}

	/**
	 * Dispose of all resources
	 */
	dispose(): void {
		for (const disposable of this.disposables) {
			disposable.dispose();
		}
		this.loadingDecorationType.dispose();
		this.errorDecorationType.dispose();
		this.successDecorationType.dispose();
		this.buttonHighlightDecorationType.dispose();
	}
}
