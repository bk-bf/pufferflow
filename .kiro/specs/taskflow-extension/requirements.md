# Requirements Document

## Introduction

TaskFlow is a VS Code extension that adds interactive "Start Task" and "Retry" buttons above markdown task items to enable instant agent execution with zero friction. The extension focuses on detecting task items in markdown files (specifically tasks.md) and providing a seamless interface for executing tasks through VS Code's agent API while maintaining task completion state.

## Requirements

### Requirement 1

**User Story:** As a developer, I want to see "Start Task" buttons above uncompleted markdown task items, so that I can instantly execute tasks without manual copy-paste or context switching.

#### Acceptance Criteria

1. WHEN a tasks.md file is opened in VS Code THEN the extension SHALL detect all uncompleted task items marked with `- [ ]`
2. WHEN an uncompleted task item is detected THEN the extension SHALL render a "Start Task" button above the task line
3. WHEN the "Start Task" button is clicked THEN the extension SHALL initiate agent execution for that specific task
4. IF a task item does not follow the `- [ ]` format THEN the extension SHALL NOT render any buttons for that item

### Requirement 2

**User Story:** As a developer, I want to see "Retry" buttons above completed markdown task items, so that I can re-execute tasks that may need to be run again.

#### Acceptance Criteria

1. WHEN a tasks.md file contains completed task items marked with `- [x]` THEN the extension SHALL detect these completed tasks
2. WHEN a completed task item is detected THEN the extension SHALL render a "Retry" button above the task line
3. WHEN the "Retry" button is clicked THEN the extension SHALL initiate agent execution for that specific task
4. WHEN a task is re-executed via "Retry" THEN the extension SHALL maintain the task's completed state until execution finishes

### Requirement 3

**User Story:** As a developer, I want tasks to be automatically marked as complete when agent execution finishes successfully, so that I can track progress without manual intervention.

#### Acceptance Criteria

1. WHEN agent execution completes successfully THEN the extension SHALL update the task marker from `- [ ]` to `- [x]` in the markdown file
2. WHEN the task state is updated THEN the extension SHALL save the changes to the tasks.md file automatically
3. WHEN a task is marked complete THEN the "Start Task" button SHALL be replaced with a "Retry" button
4. IF agent execution fails THEN the extension SHALL keep the task in uncompleted state `- [ ]`

### Requirement 4

**User Story:** As a developer, I want to see visual feedback during task execution, so that I know the system is working and can track execution progress.

#### Acceptance Criteria

1. WHEN a task execution begins THEN the extension SHALL show a loading state on the clicked button
2. WHEN task execution is in progress THEN the extension SHALL disable the button to prevent multiple executions
3. WHEN task execution completes THEN the extension SHALL remove the loading state and update button text accordingly
4. IF task execution takes longer than expected THEN the extension SHALL continue showing loading state until completion or timeout

### Requirement 5

**User Story:** As a developer, I want the extension to construct proper prompts for agent execution, so that tasks are executed with appropriate context and guidance.

#### Acceptance Criteria

1. WHEN constructing a prompt for agent execution THEN the extension SHALL include relevant steering documentation as context
2. WHEN a task is executed THEN the extension SHALL include the specific task description from the markdown file
3. WHEN sending prompts to the agent THEN the extension SHALL follow the format: Context → Task Definition → Execution Request → Success Criteria
4. WHEN agent responds THEN the extension SHALL parse the response to determine task completion status

### Requirement 6

**User Story:** As a developer, I want the extension to work reliably with VS Code's agent API, so that task execution integrates seamlessly with my development environment.

#### Acceptance Criteria

1. WHEN the extension activates THEN it SHALL properly integrate with VS Code's built-in agent API
2. WHEN agent API is unavailable THEN the extension SHALL provide appropriate fallback communication methods
3. WHEN agent communication fails THEN the extension SHALL log errors to VS Code's output channel
4. WHEN handling agent responses THEN the extension SHALL process both success and error states gracefully

### Requirement 7

**User Story:** As a developer, I want the extension to only activate for markdown files containing tasks, so that it doesn't interfere with other file types or consume unnecessary resources.

#### Acceptance Criteria

1. WHEN a file is opened in VS Code THEN the extension SHALL only activate for files named tasks.md or containing task-like patterns
2. WHEN a non-markdown file is opened THEN the extension SHALL remain inactive
3. WHEN a markdown file without task items is opened THEN the extension SHALL not render any buttons
4. WHEN switching between files THEN the extension SHALL properly activate/deactivate based on file content

### Requirement 8

**User Story:** As a developer, I want minimal performance impact from the extension, so that my VS Code experience remains smooth and responsive.

#### Acceptance Criteria

1. WHEN parsing markdown files THEN the extension SHALL use efficient parsing that only processes when needed
2. WHEN rendering buttons THEN the extension SHALL minimize DOM manipulation and use lightweight UI components
3. WHEN multiple task files are open THEN the extension SHALL handle each file independently without performance degradation
4. WHEN the extension is inactive THEN it SHALL consume minimal system resources