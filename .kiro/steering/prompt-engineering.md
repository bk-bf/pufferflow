# Prompt Engineering Strategy

## Agent Communication Flow
```
Steering docs → Task content → Agent execution → Summary → Mark complete [x]
```

## Prompt Construction Pattern
When executing tasks, construct prompts in this order:

1. **Context Setting**: Include relevant steering documentation
2. **Task Definition**: Clear task description from markdown
3. **Execution Request**: Specific action to be performed
4. **Success Criteria**: How to determine task completion

## Prompt Template Structure
```
Context: [Steering docs content]

Task: [Task description from markdown]

Requirements:
- [Specific requirements from task]
- [Any constraints or guidelines]

Please execute this task and provide a summary of what was accomplished.
```

## Agent Integration Points
- Use VS Code's built-in agent API when available
- Fallback to external agent communication if needed
- Handle agent response parsing and error states
- Provide user feedback during execution

## Response Processing
- Parse agent responses for completion status
- Extract summary information for user display
- Update task state based on execution results
- Handle partial completions and errors gracefully

## Communication Best Practices
- Keep prompts concise and focused
- Include only necessary context
- Provide clear success/failure criteria
- Handle timeouts and connection issues