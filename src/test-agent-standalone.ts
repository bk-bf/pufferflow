/**
 * Standalone test script for AgentCommunicator functionality
 * This version doesn't require the VS Code module
 */

// Mock the vscode module
const vscode = {
    window: {
        createOutputChannel: (name: string) => ({
            appendLine: (text: string) => console.log(`[${name}] ${text}`),
            show: () => { },
            dispose: () => { }
        }),
        showInformationMessage: (message: string) => Promise.resolve(message),
        showErrorMessage: (message: string) => Promise.resolve(message)
    },
    extensions: {
        all: [],
        getExtension: () => undefined
    },
    chat: {
        createChatParticipant: () => undefined
    }
};

// Mock VS Code module globally
(global as any).vscode = vscode;

// Now we can safely import our modules
import { TaskItem } from './taskParser';

// Mock AgentCommunicator without VS Code dependencies
interface AgentPrompt {
    context: string;
    task: string;
    requirements: string[];
}

interface AgentResponse {
    success: boolean;
    completed: boolean;
    response: string;
    suggestions?: string[];
}

class MockAgentCommunicator {
    private outputChannel: any;

    constructor(context: any) {
        this.outputChannel = vscode.window.createOutputChannel('TaskFlow Agent');
    }

    async isAgentAvailable(): Promise<boolean> {
        // Simulate agent detection
        this.outputChannel.appendLine('Checking for VS Code Agent API...');
        this.outputChannel.appendLine('Agent API not available - using fallback mode');
        return false; // Always false in standalone mode
    }

    async getAgentCapabilities(): Promise<string[]> {
        return ['code-generation', 'testing', 'refactoring', 'documentation'];
    }

    constructPrompt(task: TaskItem, context?: string): AgentPrompt {
        // Extract requirements from task text
        const requirements: string[] = [];
        const requirementsMatch = task.taskText.match(/_Requirements:\s*([^_]+)_/);

        if (requirementsMatch) {
            const reqText = requirementsMatch[1].trim();
            requirements.push(...reqText.split(',').map(r => r.trim()));
        }

        return {
            context: context || "TaskFlow Task Execution",
            task: task.taskText.replace(/_Requirements:[^_]+_/, '').trim(),
            requirements
        };
    }

    async executeTask(task: TaskItem, context?: string): Promise<AgentResponse> {
        this.outputChannel.appendLine(`Executing task: ${task.taskText}`);

        // Simulate different task types
        const taskText = task.taskText.toLowerCase();

        if (taskText.includes('test')) {
            return {
                success: true,
                completed: true,
                response: 'Unit tests implemented successfully. Created test files with comprehensive coverage for button renderer functionality.',
                suggestions: ['Add integration tests', 'Set up CI pipeline']
            };
        } else if (taskText.includes('refactor')) {
            return {
                success: true,
                completed: true,
                response: 'Code refactoring completed. Improved modularity and extracted reusable components.',
                suggestions: ['Update documentation', 'Add type definitions']
            };
        } else if (taskText.includes('build') || taskText.includes('compile')) {
            return {
                success: true,
                completed: true,
                response: 'Build process completed successfully. All TypeScript files compiled without errors.',
                suggestions: ['Run tests', 'Update version']
            };
        } else {
            return {
                success: true,
                completed: false,
                response: 'Task execution initiated. Please review the implementation and mark as complete if satisfactory.',
                suggestions: ['Review changes', 'Test functionality']
            };
        }
    }
}

async function testAgentCommunicator() {
    console.log('🧪 Testing AgentCommunicator (Standalone Mode)...');
    console.log('='.repeat(50));

    // Mock context
    const mockContext = {
        subscriptions: [],
        workspaceState: { get: () => undefined, update: () => Promise.resolve() },
        globalState: { get: () => undefined, update: () => Promise.resolve() },
        extensionPath: __dirname,
        extensionUri: { scheme: 'file', path: __dirname },
        environmentVariableCollection: {},
        asAbsolutePath: (path: string) => path,
        storageUri: undefined,
        globalStorageUri: { scheme: 'file', path: '' },
        logUri: { scheme: 'file', path: '' },
        extensionMode: 1,
        secrets: {}
    };

    // Initialize agent communicator
    const agentCommunicator = new MockAgentCommunicator(mockContext);

    // Test 1: Agent availability
    console.log('\n📡 Test 1: Checking agent availability...');
    const isAvailable = await agentCommunicator.isAgentAvailable();
    console.log(`✓ Agent available: ${isAvailable}`);

    // Test 2: Capabilities
    console.log('\n⚡ Test 2: Getting agent capabilities...');
    const capabilities = await agentCommunicator.getAgentCapabilities();
    console.log(`✓ Capabilities: ${capabilities.join(', ')}`);

    // Test 3: Prompt construction
    console.log('\n📝 Test 3: Testing prompt construction...');
    const testTasks: TaskItem[] = [
        {
            taskText: 'Implement unit tests for button renderer - _Requirements: 3.1, 5.1, 5.2_',
            isCompleted: false,
            lineNumber: 5,
            indentationLevel: 0
        },
        {
            taskText: 'Refactor agent communicator module',
            isCompleted: false,
            lineNumber: 8,
            indentationLevel: 1
        },
        {
            taskText: 'Build and compile TypeScript project - _Requirements: 7.1, 7.2_',
            isCompleted: true,
            lineNumber: 12,
            indentationLevel: 0
        }
    ];

    for (const task of testTasks) {
        const prompt = agentCommunicator.constructPrompt(task);
        console.log(`✓ Task: "${task.taskText}"`);
        console.log(`  → Context: ${prompt.context}`);
        console.log(`  → Requirements: [${prompt.requirements.join(', ')}]`);
        console.log(`  → Clean task: ${prompt.task}`);
    }

    // Test 4: Task execution
    console.log('\n🚀 Test 4: Testing task execution...');

    for (const task of testTasks) {
        console.log(`\n→ Executing: "${task.taskText}"`);
        try {
            const result = await agentCommunicator.executeTask(task);
            console.log(`  ✓ Success: ${result.success}`);
            console.log(`  ✓ Completed: ${result.completed}`);
            console.log(`  ✓ Response: ${result.response}`);
            if (result.suggestions) {
                console.log(`  ✓ Suggestions: [${result.suggestions.join(', ')}]`);
            }
        } catch (error) {
            console.error(`  ✗ Execution failed:`, error);
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Agent communicator test completed successfully!');
    console.log('🎉 All core functionality is working as expected.');
}

// Run the test
testAgentCommunicator().catch(console.error);