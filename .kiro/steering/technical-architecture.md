# Technical Architecture Guidelines

## File Structure
```
PufferFlow/
├── src/
│   ├── extension.ts (main entry point)
│   ├── taskParser.ts (markdown parsing)
│   ├── buttonRenderer.ts (UI components)
│   ├── agentCommunicator.ts (VS Code API)
│   └── stateManager.ts (task completion)
├── package.json
└── README.md
```

## Core Components

### PufferFlow Extension Architecture
```
PufferFlow Extension
├── Markdown Parser (tasks.md detection)
├── Button Renderer (UI overlay)
├── Agent Communicator (VS Code API)
└── Task State Manager (completion tracking)
```

## Key Dependencies
- **vscode**: Core VS Code API
- **markdown-it**: Markdown parsing (lightweight)
- **No additional dependencies** to minimize complexity

## Button Behavior Specifications
- **Start Task**: Appears above uncompleted tasks `- [ ]`
- **Retry**: Appears above completed tasks `- [x]` for re-execution
- **Visual Feedback**: Loading state during agent execution
- **State Persistence**: Automatic markdown file updates

## Implementation Principles
1. **Minimal Dependencies**: Only essential packages
2. **Native Integration**: Leverage VS Code API fully
3. **Performance First**: Lightweight parsing and rendering
4. **State Simplicity**: Direct markdown file manipulation