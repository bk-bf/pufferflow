# Design Document: TaskFlow Extension

## Overview

TaskFlow is a VS Code extension that adds interactive "Start Task" and "Retry" buttons above markdown task items in tasks.md files. The extension enables instant agent execution with zero friction by allowing users to execute tasks directly from their markdown files without manual copy-paste or context switching.

The design follows strict scope discipline with a focus on the weekend MVP timeline and zero-friction goal. The extension will detect task items in markdown files, render appropriate buttons, handle agent communication, and manage task completion state.

## Architecture

The TaskFlow extension follows a modular architecture with clear separation of concerns:

```
TaskFlow Extension
├── Markdown Parser (tasks.md detection)
├── Button Renderer (UI overlay)
├── Agent Communicator (VS Code API)
└── Task State Manager (completion tracking)
```

### System Components

1. **Extension Entry Point** (`extension.ts`)
   - Handles activation events
   - Registers commands
   - Initializes other components
   - Manages extension lifecycle

2. **Task Parser** (`taskParser.ts`)
   - Detects markdown files with task items
   - Parses task items and their completion state
   - Identifies task content and structure
   - Provides task data to other components

3. **Button Renderer** (`buttonRenderer.ts`)
   - Creates UI overlay for buttons
   - Positions buttons above task items
   - Handles button click events
   - Manages button states (normal, loading)

4. **Agent Communicator** (`agentCommunicator.ts`)
   - Constructs prompts for agent execution
   - Communicates with VS Code's agent API
   - Processes agent responses
   - Handles success and error states

5. **State Manager** (`stateManager.ts`)
   - Tracks task completion state
   - Updates markdown file when tasks complete
   - Toggles between `[ ]` and `[x]` states
   - Persists changes to the file system

## Components and Interfaces

### Extension Activation

```typescript
// Activation events in package.json
"activationEvents": [
  "onLanguage:markdown"
]

// Extension activation in extension.ts
export function activate(context: vscode.ExtensionContext) {
  // Register document content provider
  // Initialize components
  // Register commands
}
```

### Task Parser Interface

```typescript
interface TaskItem {
  lineNumber: number;
  taskText: string;
  isCompleted: boolean;
  indentationLevel: number;
}

interface TaskParserInterface {
  parseDocument(document: vscode.TextDocument): TaskItem[];
  isTasksDocument(document: vscode.TextDocument): boolean;
}
```

### Button Renderer Interface

```typescript
interface ButtonPosition {
  line: number;
  character: number;
}

interface ButtonRendererInterface {
  renderButtons(editor: vscode.TextEditor, tasks: TaskItem[]): void;
  updateButtonState(lineNumber: number, isLoading: boolean): void;
  clearButtons(): void;
}
```

### Agent Communicator Interface

```typescript
interface AgentPrompt {
  context: string;
  task: string;
  requirements: string[];
}

interface AgentResponse {
  success: boolean;
  summary: string;
  error?: string;
}

interface AgentCommunicatorInterface {
  constructPrompt(task: TaskItem): AgentPrompt;
  executeTask(prompt: AgentPrompt): Promise<AgentResponse>;
}
```

### State Manager Interface

```typescript
interface StateManagerInterface {
  markTaskComplete(document: vscode.TextDocument, lineNumber: number): Promise<boolean>;
  markTaskIncomplete(document: vscode.TextDocument, lineNumber: number): Promise<boolean>;
  saveDocument(document: vscode.TextDocument): Promise<void>;
}
```

## Data Models

### Task Item Model

The core data model is the TaskItem, which represents a single task in a markdown file:

```typescript
interface TaskItem {
  lineNumber: number;     // Line number in the document
  taskText: string;       // Text content of the task
  isCompleted: boolean;   // Whether the task is completed ([ ] vs [x])
  indentationLevel: number; // Level of indentation for hierarchical tasks
}
```

### Button State Model

```typescript
enum ButtonState {
  Normal,
  Loading,
  Disabled
}

interface ButtonData {
  id: string;
  lineNumber: number;
  state: ButtonState;
  type: 'start' | 'retry';
}
```

### Agent Communication Model

```typescript
interface AgentPrompt {
  context: string;    // Steering docs content
  task: string;       // Task description
  requirements: string[]; // Specific requirements
}

interface AgentResponse {
  success: boolean;   // Whether execution succeeded
  summary: string;    // Summary of what was accomplished
  error?: string;     // Error message if failed
}
```

## Error Handling

The extension will implement basic error handling for the MVP:

1. **Parsing Errors**
   - Log errors to output channel
   - Continue parsing rest of document
   - Skip problematic task items

2. **Button Rendering Errors**
   - Gracefully degrade if button can't be rendered
   - Log errors to output channel
   - Continue rendering other buttons

3. **Agent Communication Errors**
   - Show error state on button
   - Log detailed error to output channel
   - Provide retry capability
   - Keep task in original state

4. **State Management Errors**
   - Attempt to retry state changes
   - Log errors to output channel
   - Notify user if state can't be updated

## Testing Strategy

For the MVP, testing will focus on core functionality:

1. **Unit Tests**
   - Task parsing logic
   - Button state management
   - Prompt construction
   - Task state toggling

2. **Integration Tests**
   - End-to-end task execution flow
   - Document updates after task completion
   - Button rendering and interaction

3. **Manual Testing**
   - UI component rendering
   - Visual feedback during execution
   - Error state handling

## Implementation Approach

The implementation will follow the weekend MVP timeline with a focus on core functionality:

1. **Day 1 (Saturday)**
   - Set up extension scaffolding
   - Implement markdown parsing
   - Create basic button rendering
   - Establish agent API integration

2. **Day 2 (Sunday)**
   - Implement prompt construction
   - Add task completion state management
   - Add basic error handling
   - Package MVP for testing

The implementation will strictly adhere to the scope discipline rules, focusing only on the core features and avoiding any feature creep.