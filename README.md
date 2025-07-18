# PufferFlow 🐡 
**Beta Release - Fresh from the Deep! 🌊**

**Turn your tasks.md into a sea of possibilities with one-click execution.**

PufferFlow is a whimsical VS Code extension that adds magical "Start Task" and "Retry" buttons above your markdown task items. Watch your tasks come to life as our friendly pufferfish guides transform your to-do lists into executable workflows with zero friction!

> **🚧 Beta Notice**: PufferFlow is fresh from the development depths! While our pufferfish is eager to help, you might encounter some rough waters. The code is still getting optimized and bugs are being squashed daily. Dive in with a spirit of adventure! 🐡

## 🐡 What Makes PufferFlow Special?

### Instant Task Activation
- **Puff & Go**: Click "Start Task" and watch the magic happen
- **Second Chances**: "Retry" buttons for when tasks need another swim
- **Smart Detection**: Automatically spots `- [ ]` and `- [x]` tasks in your `tasks.md`
- **Agent-Powered**: Works beautifully with VS Code's agent mode (GitHub Copilot recommended)

### Zero-Friction Workflow
- No context switching required
- Direct execution from markdown files
- Automatic task completion marking (`- [ ]` → `- [x]`)
- Seamless integration with your existing workflow

## 🌊 How It Works

1. **Open your `tasks.md`** - PufferFlow automatically detects your tasks
2. **Click the shiny buttons** - CodeLens buttons appear above each task
3. **Watch the magic** - Your task gets sent to the agent with steering file context
4. **Automatic completion** - Tasks puff up to completed state when done!

### Example in Action

```markdown
# My Underwater Project 🐠

- [ ] Set up the coral reef structure
- [ ] Implement the fish authentication system  
- [ ] Create the seaweed database migrations
- [x] Write comprehensive bubble tests
- [ ] Deploy to the deep sea environment
```

Each uncompleted task gets a friendly "🐡 Start Task" button, while completed ones show "🔄 Retry" buttons!

## 🚀 Installation

1. Open VS Code Extensions (`Ctrl+Shift+X`)
2. Search for "PufferFlow"
3. Click Install
4. Open any `tasks.md` file and watch the pufferfish magic begin!

**Beta Disclaimer**: Expect some splashing as we refine the experience!

## 🎯 Perfect For

- **Project Planning**: Turn your ideas into action
- **Development Workflows**: Automate your coding tasks
- **Documentation**: Make your docs executable
- **Team Collaboration**: Share actionable task lists
- **Learning**: Practice with guided, contextual assistance
- **Beta Testing**: Help us make PufferFlow even better!

## 🛠️ Technical Details

PufferFlow uses VS Code's CodeLens API to create lightweight, non-intrusive buttons above your task items. When clicked, tasks are sent to your configured agent along with steering file context for intelligent execution.

### Requirements
- VS Code 1.74.0 or higher
- Agent mode enabled (GitHub Copilot or compatible)
- A sense of whimsy 🐡
- Patience for beta quirks 😊

### Under the Hood
- **CodeLens Integration**: Lightweight UI that doesn't interfere with your editing
- **Markdown Parser**: Intelligently detects task patterns
- **Agent Communication**: Constructs context-aware prompts with steering files
- **State Management**: Automatically toggles task completion states

*Note: The code is still swimming through optimization waters - performance improvements and bug fixes are ongoing!*

## 🎨 Why PufferFlow?

Because your tasks deserve more than just sitting there looking sad! PufferFlow brings personality and power to your productivity workflow. Like a pufferfish that transforms when needed, your static task lists become dynamic, executable workflows.

**Features that make you smile:**
- 🐡 Whimsical button text and interactions
- 🌊 Smooth, bubble-like execution flow
- 🎯 Intelligent context inclusion from steering files
- 🔄 Effortless retry capabilities
- 📝 Automatic progress tracking

## 🐛 Known Beta Limitations

- Code optimization is ongoing
- Some edge cases may cause unexpected behavior
- Performance improvements are in progress
- Error handling is being refined

## 🤝 Contributing

Want to help make PufferFlow even more magical? We welcome contributions! The codebase is designed to be as friendly as our pufferfish mascot, though it's still getting its fins organized.

**Beta Contributors Welcome!**
- Bug reports and feedback
- Code optimizations
- Feature suggestions
- Testing across different setups

## 📄 License

MIT License - As free as fish in the sea!

## 🗺️ Roadmap

- **Immediate**: Code optimization and bug fixes
- Enhanced task templating (different fish for different tasks?)
- Team collaboration features
- Custom agent integration options
- More aquatic-themed delights
- Performance optimizations

**Ready to dive into effortless task execution? Install PufferFlow and let your tasks swim to completion! 🐡✨**

*PufferFlow Beta: Where productivity meets personality in the vast ocean of VS Code extensions. Expect some waves as we navigate to version 1.0!*