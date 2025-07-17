# TaskFlow

**Bring intelligent task execution to VS Code with zero friction.**

TaskFlow is a VS Code extension that transforms your markdown task lists into powerful, executable workflows. With intelligent agent integration and one-click task execution, TaskFlow brings advanced automation capabilities directly into your development environment.

## 🚀 Key Features

### Intelligent Task Detection
- Automatically detects task items in your markdown files
- Seamlessly integrates with existing `tasks.md` workflows
- Support for both completed `- [x]` and pending `- [ ]` tasks

### One-Click Execution
- **Start Task** buttons appear above uncompleted tasks
- **Retry** buttons for re-executing completed tasks
- Real-time visual feedback during task execution
- Automatic state management and progress tracking

### Advanced Agent Integration
- Leverages VS Code's built-in agent capabilities
- Intelligent prompt construction with context awareness
- Includes steering documentation and project context
- Robust error handling and fallback mechanisms

### Zero-Friction Workflow
- No context switching required
- Direct execution from markdown files
- Automatic task completion marking
- Seamless state persistence

## 🎯 Why TaskFlow?

TaskFlow bridges the gap between planning and execution by making your task lists actionable. Instead of manually copying tasks and switching contexts, execute complex workflows directly from your markdown files with intelligent agent assistance.

**Perfect for:**
- Project planning and execution
- Development workflows
- Documentation tasks
- Automated development processes
- Team collaboration workflows

## 🛠️ How It Works

1. **Open your `tasks.md` file** - TaskFlow automatically detects task items
2. **Click "Start Task"** - The extension constructs an intelligent prompt with full context
3. **Agent executes** - VS Code's agent system handles the task execution
4. **Automatic completion** - Tasks are marked complete and state is persisted

### Example Workflow

```markdown
# My Project Tasks

- [ ] Set up project structure and dependencies
- [ ] Implement user authentication system  
- [ ] Create database schema and migrations
- [x] Write comprehensive test suite
- [ ] Deploy to staging environment
```

Each uncompleted task gets a "Start Task" button, while completed tasks show "Retry" buttons for re-execution.

## 🏗️ Technical Architecture

TaskFlow is built with a modular, efficient architecture:

- **Markdown Parser**: Intelligent task detection and parsing
- **Button Renderer**: Lightweight UI overlay system
- **Agent Communicator**: VS Code API integration with fallback support
- **State Manager**: Automatic completion tracking and persistence

### Core Technologies
- **VS Code Extension API**: Native platform integration
- **TypeScript**: Type-safe development
- **Markdown-it**: Efficient parsing engine
- **Minimal Dependencies**: Performance-focused approach

## 📋 Requirements

- VS Code 1.74.0 or higher
- VS Code agent capabilities (GitHub Copilot or compatible agent)

## 🚀 Installation

1. Open VS Code Extensions panel (`Ctrl+Shift+X`)
2. Search for "TaskFlow"
3. Click Install
4. Open any `tasks.md` file to start using TaskFlow

## 🎨 Usage

### Basic Task Execution
1. Create or open a `tasks.md` file
2. Add tasks using markdown checkbox syntax: `- [ ] Your task here`
3. Click the "Start Task" button that appears above the task
4. Watch as the agent executes your task and automatically marks it complete

### Advanced Features
- **Context-Aware Execution**: TaskFlow includes project context and steering documentation in agent prompts
- **State Persistence**: Task completion state is automatically saved
- **Visual Feedback**: Real-time loading indicators during execution
- **Error Recovery**: Robust error handling with retry capabilities

### Configuration
TaskFlow works out of the box with sensible defaults. The extension automatically:
- Detects `tasks.md` files and similar markdown task lists
- Integrates with your configured VS Code agent
- Manages task state and file persistence

## 🤝 Contributing

We welcome contributions! TaskFlow is designed with:
- Clean, modular architecture
- Comprehensive TypeScript types
- Minimal dependencies
- Performance-first approach

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🎯 Roadmap

- Enhanced task templating and patterns
- Team collaboration features
- Custom agent integration options
- Advanced workflow automation
- Performance optimizations

---

**Ready to supercharge your task workflows? Install TaskFlow and experience the future of executable documentation.**
