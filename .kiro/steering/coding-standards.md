# Coding Standards & Best Practices

## Code Quality Guidelines

### TypeScript Standards
- Use strict TypeScript configuration
- Explicit type annotations for public APIs
- Prefer interfaces over types for extensibility
- Use meaningful variable and function names

### VS Code Extension Patterns
- Follow VS Code extension best practices
- Use proper activation events
- Implement proper disposal patterns
- Handle extension lifecycle correctly

### Error Handling
- Basic try/catch for MVP
- Log errors to VS Code output channel
- Graceful degradation when possible
- User-friendly error messages

### Performance Considerations
- Lazy load components when possible
- Efficient markdown parsing (parse only when needed)
- Minimal DOM manipulation
- Cache parsed results when appropriate

## File Organization
- One responsibility per file
- Clear separation of concerns
- Consistent naming conventions
- Minimal file interdependencies

## Testing Strategy
- Focus on core functionality testing
- Mock VS Code API for unit tests
- Integration tests for critical paths
- Manual testing for UI components

## Code Review Checklist
1. Does this serve the core zero-friction goal?
2. Is this the simplest implementation possible?
3. Are we staying within scope constraints?
4. Is error handling adequate for MVP?
5. Will this work reliably in VS Code environment?