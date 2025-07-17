import * as assert from 'assert';
import * as vscode from 'vscode';
import { TaskParser, TaskItem } from '../src/taskParser';

/**
 * Test suite for TaskParser functionality
 */
describe('TaskParser Tests', () => {
	let taskParser: TaskParser;

	beforeEach(() => {
		taskParser = new TaskParser();
	});

	describe('parseTaskLine - standard format', () => {
		it('should parse various task formats correctly', () => {
			const testCases = [
				{ line: '- [ ] This is a task', expected: { isCompleted: false, taskText: 'This is a task', indentationLevel: 0 } },
				{ line: '- [x] Completed task', expected: { isCompleted: true, taskText: 'Completed task', indentationLevel: 0 } },
				{ line: '  - [ ] Indented task', expected: { isCompleted: false, taskText: 'Indented task', indentationLevel: 2 } },
				{ line: '    - [X] Double indented', expected: { isCompleted: true, taskText: 'Double indented', indentationLevel: 4 } }
			];

			testCases.forEach(testCase => {
				const result = taskParser.parseTaskLine(testCase.line, 0);
				assert.ok(result, `Should parse line: ${testCase.line}`);
				assert.strictEqual(result!.isCompleted, testCase.expected.isCompleted);
				assert.strictEqual(result!.taskText, testCase.expected.taskText);
				assert.strictEqual(result!.indentationLevel, testCase.expected.indentationLevel);
			});
		});
	});

	describe('parseTaskLine - different bullet types', () => {
		it('should parse different bullet types', () => {
			const testCases = [
				'- [ ] Dash bullet',
				'* [ ] Asterisk bullet',
				'+ [ ] Plus bullet'
			];

			testCases.forEach(line => {
				const result = taskParser.parseTaskLine(line, 0);
				assert.ok(result, `Should parse line with different bullet: ${line}`);
				assert.strictEqual(result!.isCompleted, false);
			});
		});
	});

	describe('parseTaskLine - invalid formats', () => {
		it('should return null for invalid task formats', () => {
			const invalidLines = [
				'Just plain text',
				'- No checkbox here',
				'[ ] Missing bullet',
				'- [?] Invalid checkbox state'
			];

			invalidLines.forEach(line => {
				const result = taskParser.parseTaskLine(line, 0);
				assert.strictEqual(result, null, `Should not parse invalid line: ${line}`);
			});
		});
	});

	describe('isTasksDocument - filename detection', () => {
		it('should detect tasks.md files', () => {
			// Mock document with tasks.md filename
			const mockDocument = {
				languageId: 'markdown',
				fileName: '/path/to/tasks.md',
				getText: () => ''
			} as vscode.TextDocument;

			const result = taskParser.isTasksDocument(mockDocument);
			assert.strictEqual(result, true, 'Should detect tasks.md file');
		});
	});

	describe('isTasksDocument - content detection', () => {
		it('should detect tasks by content in any markdown file', () => {
			// Mock document with task content but different filename
			const mockDocument = {
				languageId: 'markdown',
				fileName: '/path/to/readme.md',
				getText: () => '# My tasks\n- [ ] Do something\n- [x] Done task'
			} as vscode.TextDocument;

			const result = taskParser.isTasksDocument(mockDocument);
			assert.strictEqual(result, true, 'Should detect tasks by content');
		});
	});

	describe('isTasksDocument - non-markdown file', () => {
		it('should not detect tasks in non-markdown files', () => {
			const mockDocument = {
				languageId: 'javascript',
				fileName: '/path/to/script.js',
				getText: () => '// - [ ] This looks like a task but is in JS'
			} as vscode.TextDocument;

			const result = taskParser.isTasksDocument(mockDocument);
			assert.strictEqual(result, false, 'Should not detect tasks in non-markdown files');
		});
	});

	describe('caching functionality', () => {
		it('should cache parse results', () => {
			const mockDocument = {
				languageId: 'markdown',
				fileName: '/path/to/tasks.md',
				version: 1,
				lineCount: 3,
				uri: { toString: () => 'file:///path/to/tasks.md' },
				lineAt: (line: number) => ({
					text: ['# Tasks', '- [ ] Task 1', '- [x] Task 2'][line]
				}),
				getText: () => '# Tasks\n- [ ] Task 1\n- [x] Task 2'
			} as any;

			// First parse - should cache
			const tasks1 = taskParser.parseDocument(mockDocument);
			assert.strictEqual(tasks1.length, 2);

			// Second parse with same version - should use cache
			const tasks2 = taskParser.parseDocument(mockDocument);
			assert.strictEqual(tasks2.length, 2);

			// Verify cache stats
			const stats = taskParser.getCacheStats();
			assert.strictEqual(stats.size, 1);
			assert.ok(stats.entries.includes('file:///path/to/tasks.md'));
		});

		it('should detect document changes', () => {
			const mockDocument = {
				languageId: 'markdown',
				fileName: '/path/to/tasks.md',
				version: 1,
				uri: { toString: () => 'file:///path/to/tasks.md' }
			} as vscode.TextDocument;

			// First check - should indicate change (no previous version)
			assert.strictEqual(taskParser.hasDocumentChanged(mockDocument), true);

			// Parse to establish baseline
			taskParser.parseDocument({
				...mockDocument,
				lineCount: 2,
				lineAt: (line: number) => ({ text: ['- [ ] Task 1', '- [x] Task 2'][line] }),
				getText: () => '- [ ] Task 1\n- [x] Task 2'
			} as any);

			// Same version - no change
			assert.strictEqual(taskParser.hasDocumentChanged(mockDocument), false);

			// Different version - changed
			const changedDocument = { ...mockDocument, version: 2 };
			assert.strictEqual(taskParser.hasDocumentChanged(changedDocument), true);
		});

		it('should clear document cache', () => {
			const documentUri = 'file:///path/to/test.md';
			const mockDocument = {
				languageId: 'markdown',
				fileName: '/path/to/test.md',
				version: 1,
				lineCount: 1,
				uri: { toString: () => documentUri },
				lineAt: () => ({ text: '- [ ] Test task' }),
				getText: () => '- [ ] Test task'
			} as any;

			// Parse to cache
			taskParser.parseDocument(mockDocument);
			assert.strictEqual(taskParser.getCacheStats().size, 1);

			// Clear cache
			taskParser.clearDocumentCache(documentUri);
			assert.strictEqual(taskParser.getCacheStats().size, 0);
		});
	});

	describe('efficient parsing methods', () => {
		let mockDocument: any;

		beforeEach(() => {
			mockDocument = {
				languageId: 'markdown',
				fileName: '/path/to/tasks.md',
				version: 1,
				lineCount: 4,
				uri: { toString: () => 'file:///path/to/efficient-test.md' },
				lineAt: (line: number) => ({
					text: ['# Tasks', '- [ ] Uncompleted 1', '- [x] Completed 1', '- [ ] Uncompleted 2'][line]
				}),
				getText: () => '# Tasks\n- [ ] Uncompleted 1\n- [x] Completed 1\n- [ ] Uncompleted 2'
			};
		});

		it('should get uncompleted tasks efficiently', () => {
			const uncompletedTasks = taskParser.getUncompletedTasks(mockDocument);
			assert.strictEqual(uncompletedTasks.length, 2);
			assert.strictEqual(uncompletedTasks[0].taskText, 'Uncompleted 1');
			assert.strictEqual(uncompletedTasks[1].taskText, 'Uncompleted 2');
		});

		it('should get completed tasks efficiently', () => {
			const completedTasks = taskParser.getCompletedTasks(mockDocument);
			assert.strictEqual(completedTasks.length, 1);
			assert.strictEqual(completedTasks[0].taskText, 'Completed 1');
		});

		it('should get task count efficiently', () => {
			const taskCount = taskParser.getTaskCount(mockDocument);
			assert.strictEqual(taskCount.total, 3);
			assert.strictEqual(taskCount.completed, 1);
			assert.strictEqual(taskCount.uncompleted, 2);
		});
	});
});
