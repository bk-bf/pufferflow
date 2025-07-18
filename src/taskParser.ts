import * as vscode from 'vscode';

/**
 * TaskItem interface representing a task in markdown
 */
export interface TaskItem {
	lineNumber: number;
	taskText: string;
	isCompleted: boolean;
	isExecuting?: boolean; // New property for [-] state
	indentationLevel: number;
}

/**
 * Cached parse result interface
 */
interface CachedParseResult {
	tasks: TaskItem[];
	version: number;
	lastModified: number;
	documentUri: string;
}

/**
 * Document change tracking interface
 */
interface DocumentChangeInfo {
	version: number;
	lastModified: number;
}

/**
 * TaskParser interface for parsing markdown documents
 */
export interface TaskParserInterface {
	parseDocument(document: vscode.TextDocument): TaskItem[];
	isTasksDocument(document: vscode.TextDocument): boolean;
}

/**
 * TaskParser implementation for detecting and parsing markdown task items
 * with efficient caching and change detection
 */
export class TaskParser implements TaskParserInterface {

	private readonly taskPatterns = [
		/^(\s*)-\s*\[([ xX\-])\]\s*(.+)$/,  // Standard: - [ ] or - [x] or - [-]
		/^(\s*)\*\s*\[([ xX\-])\]\s*(.+)$/,  // Asterisk: * [ ] or * [x] or * [-]
		/^(\s*)\+\s*\[([ xX\-])\]\s*(.+)$/   // Plus: + [ ] or + [x] or + [-]
	];

	// Cache for parsed results
	private readonly parseCache = new Map<string, CachedParseResult>();

	// Document change tracking
	private readonly documentVersions = new Map<string, DocumentChangeInfo>();

	// Cache cleanup interval (5 minutes)
	private readonly CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000;

	// Maximum cache age (10 minutes)
	private readonly MAX_CACHE_AGE = 10 * 60 * 1000;

	constructor() {
		// Set up periodic cache cleanup
		setInterval(() => this.cleanupCache(), this.CACHE_CLEANUP_INTERVAL);
	}

	/**
	 * Parse a document and extract task items with caching
	 */
	parseDocument(document: vscode.TextDocument): TaskItem[] {
		const documentUri = document.uri.toString();
		const currentVersion = document.version;
		const currentTime = Date.now();

		// Check if we have a cached result that's still valid
		const cachedResult = this.parseCache.get(documentUri);
		if (this.isCacheValid(cachedResult, currentVersion, currentTime)) {
			return [...cachedResult!.tasks]; // Return a copy to prevent mutation
		}

		// Parse the document
		const tasks = this.performParsing(document);

		// Cache the result
		this.cacheParseResult(documentUri, tasks, currentVersion, currentTime);

		// Update document version tracking
		this.updateDocumentVersion(documentUri, currentVersion, currentTime);

		return tasks;
	}

	/**
	 * Check if cached result is still valid
	 */
	private isCacheValid(cachedResult: CachedParseResult | undefined, currentVersion: number, currentTime: number): boolean {
		if (!cachedResult) {
			return false;
		}

		// Check if version matches (document hasn't changed)
		if (cachedResult.version !== currentVersion) {
			return false;
		}

		// Check if cache hasn't expired
		if (currentTime - cachedResult.lastModified > this.MAX_CACHE_AGE) {
			return false;
		}

		return true;
	}

	/**
	 * Perform the actual parsing without caching
	 */
	private performParsing(document: vscode.TextDocument): TaskItem[] {
		const tasks: TaskItem[] = [];

		for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
			const line = document.lineAt(lineIndex);
			const lineText = line.text;

			const taskItem = this.parseTaskLine(lineText, lineIndex);
			if (taskItem) {
				tasks.push(taskItem);
			}
		}

		return tasks;
	}

	/**
	 * Cache the parse result
	 */
	private cacheParseResult(documentUri: string, tasks: TaskItem[], version: number, timestamp: number): void {
		this.parseCache.set(documentUri, {
			tasks: [...tasks], // Store a copy
			version,
			lastModified: timestamp,
			documentUri
		});
	}

	/**
	 * Update document version tracking
	 */
	private updateDocumentVersion(documentUri: string, version: number, timestamp: number): void {
		this.documentVersions.set(documentUri, {
			version,
			lastModified: timestamp
		});
	}

	/**
	 * Clean up expired cache entries
	 */
	private cleanupCache(): void {
		const currentTime = Date.now();
		const expiredKeys: string[] = [];

		for (const [key, cachedResult] of this.parseCache) {
			if (currentTime - cachedResult.lastModified > this.MAX_CACHE_AGE) {
				expiredKeys.push(key);
			}
		}

		// Remove expired entries
		for (const key of expiredKeys) {
			this.parseCache.delete(key);
			this.documentVersions.delete(key);
		}

		if (expiredKeys.length > 0) {
			console.log(`TaskParser: Cleaned up ${expiredKeys.length} expired cache entries`);
		}
	}

	/**
	 * Check if document has changed since last parse
	 */
	public hasDocumentChanged(document: vscode.TextDocument): boolean {
		const documentUri = document.uri.toString();
		const versionInfo = this.documentVersions.get(documentUri);

		if (!versionInfo) {
			return true; // No previous version recorded
		}

		return versionInfo.version !== document.version;
	}

	/**
	 * Clear cache for a specific document
	 */
	public clearDocumentCache(documentUri: string): void {
		this.parseCache.delete(documentUri);
		this.documentVersions.delete(documentUri);
	}

	/**
	 * Get cache statistics for debugging
	 */
	public getCacheStats(): { size: number; entries: string[] } {
		return {
			size: this.parseCache.size,
			entries: Array.from(this.parseCache.keys())
		};
	}

	/**
	 * Parse a single line to extract task information
	 * Made public for testing purposes
	 */
	public parseTaskLine(lineText: string, lineNumber: number): TaskItem | null {
		for (const pattern of this.taskPatterns) {
			const match = pattern.exec(lineText);
			if (match) {
				const [, indentation, checkState, taskText] = match;
				const isCompleted = checkState.toLowerCase() === 'x';
				const isExecuting = checkState === '-';
				const indentationLevel = indentation.length;

				return {
					lineNumber,
					taskText: taskText.trim(),
					isCompleted,
					indentationLevel,
					isExecuting // Add this new property
				};
			}
		}
		return null;
	}

	/**
	 * Check if document is a tasks document (tasks.md or contains task patterns)
	 */
	isTasksDocument(document: vscode.TextDocument): boolean {
		// Check if it's a markdown file first
		if (document.languageId !== 'markdown') {
			return false;
		}

		// Check if filename contains 'tasks'
		const fileName = document.fileName.toLowerCase();
		if (fileName.includes('tasks.md') || fileName.endsWith('tasks.md')) {
			return true;
		}

		// Check if document contains task-like patterns
		const text = document.getText();

		// Test each line for task patterns
		const lines = text.split('\n');
		for (const line of lines) {
			if (this.parseTaskLine(line, 0)) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Get tasks by completion state with caching
	 */
	getTasksByState(document: vscode.TextDocument, completed: boolean): TaskItem[] {
		const allTasks = this.parseDocument(document); // Uses cache automatically
		return allTasks.filter(task => task.isCompleted === completed);
	}

	/**
	 * Get uncompleted tasks only (optimized common use case)
	 */
	getUncompletedTasks(document: vscode.TextDocument): TaskItem[] {
		return this.getTasksByState(document, false);
	}

	/**
	 * Get completed tasks only (optimized common use case)
	 */
	getCompletedTasks(document: vscode.TextDocument): TaskItem[] {
		return this.getTasksByState(document, true);
	}

	/**
	 * Get task count by completion state without full parsing (when possible)
	 */
	getTaskCount(document: vscode.TextDocument): { total: number; completed: number; uncompleted: number } {
		const tasks = this.parseDocument(document); // Uses cache
		const completed = tasks.filter(task => task.isCompleted).length;
		const uncompleted = tasks.length - completed;

		return {
			total: tasks.length,
			completed,
			uncompleted
		};
	}

	/**
	 * Get a specific task by line number with caching
	 */
	getTaskAtLine(document: vscode.TextDocument, lineNumber: number): TaskItem | null {
		// For single line queries, we can use the line directly without full parsing
		if (lineNumber >= 0 && lineNumber < document.lineCount) {
			const line = document.lineAt(lineNumber);
			return this.parseTaskLine(line.text, lineNumber);
		}
		return null;
	}

	/**
	 * Batch parse multiple documents efficiently
	 */
	parseMultipleDocuments(documents: vscode.TextDocument[]): Map<string, TaskItem[]> {
		const results = new Map<string, TaskItem[]>();

		for (const document of documents) {
			if (this.isTasksDocument(document)) {
				const tasks = this.parseDocument(document); // Uses cache
				results.set(document.uri.toString(), tasks);
			}
		}

		return results;
	}

	/**
	 * Pre-warm cache for a document (useful for background processing)
	 */
	preWarmCache(document: vscode.TextDocument): void {
		if (this.isTasksDocument(document)) {
			this.parseDocument(document); // This will cache the result
		}
	}

	/**
	 * Invalidate cache when document changes (to be called from extension)
	 */
	onDocumentChanged(document: vscode.TextDocument): void {
		const documentUri = document.uri.toString();
		this.clearDocumentCache(documentUri);
	}
}
