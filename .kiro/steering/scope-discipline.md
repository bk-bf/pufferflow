# Scope Discipline Rules

## Absolute Feature Lock
**NO FEATURE CREEP BEYOND THESE REQUIREMENTS:**

### Core Features Only
1. **Button Placement**: "Start Task" and "Retry" buttons above `- [ ]` elements in tasks.md files
2. **Prompt Flow**: Steering docs → Task content → Agent execution → Summary → Mark complete `- [x]`
3. **State Management**: Toggle between `[ ]` and `[x]` based on completion

### Explicitly Forbidden During Development
- No additional features during development
- No UI customization beyond basic buttons
- No configuration options initially
- No advanced error handling beyond basic functionality
- No additional dependencies beyond core requirements

## Decision Framework
When tempted to add features, ask:
1. Is this in the original scope lock?
2. Does this directly serve the zero-friction goal?
3. Can this wait until post-MVP?

**If any answer is no, reject the feature immediately.**

## Scope Reduction Protocol
If weekend timeline is at risk:
1. Remove retry functionality first
2. Simplify button styling to absolute minimum
3. Reduce error handling to basic try/catch
4. Focus only on happy path execution