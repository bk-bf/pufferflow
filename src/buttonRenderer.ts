import * as vscode from 'vscode';
import { TaskItem } from './taskParser';

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

			if (task.isCompleted) {
				// For completed tasks, show "Task completed" indicator with green checkmark
				const completedIndicator = new vscode.CodeLens(range, {
					title: '$(check-all)  Task completed',  // check-all is typically green
					command: '' // No command, just an indicator
				});
				codeLenses.push(completedIndicator);

				// Add a separate retry button next to it
				const retryButton = new vscode.CodeLens(range, {
					title: '$(refresh)',
					command: 'taskflow.retryTask',
					arguments: [line, task]
				});
				codeLenses.push(retryButton);
			} else {
				// For incomplete tasks, show start button
				const startButton = new vscode.CodeLens(range, {
					title: '$(play)  Start Task',
					command: 'taskflow.startTask',
					arguments: [line, task]
				});
				codeLenses.push(startButton);
			}

			// Store button data for state management
			const buttonId = `${document.uri.toString()}-${line}`;
			this.buttons.set(buttonId, {
				id: buttonId,
				lineNumber: line,
				state: ButtonState.Normal,
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
			button.state = state;
			this._onDidChangeCodeLenses.fire();
		}
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

	// Decoration types for visual feedback
	private loadingDecorationType!: vscode.TextEditorDecorationType;
	private errorDecorationType!: vscode.TextEditorDecorationType;
	private successDecorationType!: vscode.TextEditorDecorationType;
	private buttonHighlightDecorationType!: vscode.TextEditorDecorationType;

	constructor(taskParser: any) {
		this.taskParser = taskParser;
		this.codeLensProvider = new TaskFlowCodeLensProvider(taskParser, this);

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

		// Listen for document changes
		const documentChangeListener = vscode.workspace.onDidChangeTextDocument((event) => {
			if (this.taskParser.isTasksDocument(event.document)) {
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
		this.loadingDecorationType = vscode.window.createTextEditorDecorationType({
			before: {
				contentText: '$(loading~spin) ',
				color: new vscode.ThemeColor('editorWarning.foreground'),
				fontWeight: 'normal'
			},
			rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
		});

		this.errorDecorationType = vscode.window.createTextEditorDecorationType({
			before: {
				contentText: '$(error) ',
				color: new vscode.ThemeColor('errorForeground'),
				fontWeight: 'normal'
			},
			rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
		});

		this.successDecorationType = vscode.window.createTextEditorDecorationType({
			before: {
				contentText: '$(check) ',
				color: new vscode.ThemeColor('editorInfo.foreground'),
				fontWeight: 'normal'
			},
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
	 * Show loading decoration on a specific line
	 */
	private showLoadingDecoration(editor: vscode.TextEditor, lineNumber: number): void {
		const range = new vscode.Range(lineNumber, 0, lineNumber, 0);
		editor.setDecorations(this.loadingDecorationType, [range]);
	}

	/**
	 * Show success decoration on a specific line
	 */
	showSuccessDecoration(editor: vscode.TextEditor, lineNumber: number): void {
		const range = new vscode.Range(lineNumber, 0, lineNumber, 0);
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
		const range = new vscode.Range(lineNumber, 0, lineNumber, 0);
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
		const range = new vscode.Range(lineNumber, 0, lineNumber, 0);
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
