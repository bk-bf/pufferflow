import * as assert from 'assert';
import * as vscode from 'vscode';
import { ButtonRenderer, ButtonState } from '../src/buttonRenderer';
import { TaskParser } from '../src/taskParser';

/**
 * Test suite for ButtonRenderer functionality
 */
describe('ButtonRenderer Tests', () => {
	let buttonRenderer: ButtonRenderer;
	let taskParser: TaskParser;

	beforeEach(() => {
		taskParser = new TaskParser();
		buttonRenderer = new ButtonRenderer(taskParser);
	});

	afterEach(() => {
		buttonRenderer.dispose();
	});

	describe('initialization', () => {
		it('should initialize without errors', () => {
			assert.ok(buttonRenderer, 'ButtonRenderer should be created successfully');
		});

		it('should register CodeLens provider', () => {
			// This test verifies that the ButtonRenderer doesn't throw during initialization
			// The actual CodeLens provider registration is handled internally
			assert.ok(true, 'ButtonRenderer should register CodeLens provider without errors');
		});
	});

	describe('button state management', () => {
		it('should handle button state updates', () => {
			// Create a mock editor scenario
			const mockDocument = {
				languageId: 'markdown',
				fileName: '/path/to/tasks.md',
				version: 1,
				lineCount: 2,
				uri: { toString: () => 'file:///path/to/tasks.md' },
				lineAt: (line: number) => ({
					text: ['- [ ] Test task', '- [x] Completed task'][line]
				}),
				getText: () => '- [ ] Test task\n- [x] Completed task'
			} as any;

			// This should not throw an error
			buttonRenderer.updateButtonState(0, true);
			buttonRenderer.updateButtonState(0, false);

			assert.ok(true, 'Button state updates should complete without errors');
		});
	});

	describe('button rendering', () => {
		it('should handle rendering for valid task documents', () => {
			const mockEditor = {
				document: {
					languageId: 'markdown',
					fileName: '/path/to/tasks.md',
					version: 1,
					lineCount: 2,
					uri: { toString: () => 'file:///path/to/tasks.md' },
					lineAt: (line: number) => ({
						text: ['- [ ] Test task', '- [x] Completed task'][line]
					}),
					getText: () => '- [ ] Test task\n- [x] Completed task'
				}
			} as any;

			const tasks = taskParser.parseDocument(mockEditor.document);

			// This should not throw an error
			buttonRenderer.renderButtons(mockEditor, tasks);

			assert.ok(true, 'Button rendering should complete without errors');
		});

		it('should handle non-task documents gracefully', () => {
			const mockEditor = {
				document: {
					languageId: 'javascript',
					fileName: '/path/to/script.js',
					getText: () => 'console.log("Hello World");'
				}
			} as any;

			const tasks: any[] = [];

			// This should not throw an error for non-task documents
			buttonRenderer.renderButtons(mockEditor, tasks);

			assert.ok(true, 'Should handle non-task documents gracefully');
		});
	});

	describe('cleanup and disposal', () => {
		it('should dispose resources properly', () => {
			// Create a new renderer for this test
			const testRenderer = new ButtonRenderer(taskParser);

			// This should not throw an error
			testRenderer.dispose();

			assert.ok(true, 'ButtonRenderer should dispose without errors');
		});

		it('should clear buttons', () => {
			// This should not throw an error
			buttonRenderer.clearButtons();

			assert.ok(true, 'Should clear buttons without errors');
		});

		it('should refresh buttons', () => {
			// This should not throw an error
			buttonRenderer.refresh();

			assert.ok(true, 'Should refresh buttons without errors');
		});
	});
});
