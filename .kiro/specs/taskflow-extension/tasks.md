# Implementation Plan - SIMPLIFIED ✂️

## ✅ COMPLETED (Weekend Sprint Phase 1)

- [x] 1. Set up extension scaffolding and project structure
  - Create directory structure following technical architecture
  - Set up package.json with minimal dependencies
  - Configure TypeScript settings

- [x] 2. Implement markdown task parsing
- [x] 2.1 Create task parser module
  - Implement detection of tasks.md files
  - Create parser for markdown task items
  - Add support for detecting task completion state

- [x] 2.2 Implement efficient parsing logic
  - Add caching for parsed results
  - Implement parsing only when document changes
  - Create TaskItem interface and data model

- [x] 3. Create button rendering system
- [x] 3.1 Implement button UI components
  - Create decorations for "Start Task" buttons
  - Create decorations for "Retry" buttons
  - Position buttons above task items

- [x] 3.2 Implement button state management
  - Add loading state for buttons during execution
  - Implement button disabling during task execution
  - Create visual feedback for execution states

## 🎯 CORE MISSION (Weekend Sprint Phase 2) - SIMPLIFIED

- [ ] 4. Implement chat integration (THE ACTUAL GOAL)
- [ ] 4.1 Add VS Code chat integration
  - Connect button clicks to VS Code chat panel
  - Implement steering docs inclusion in prompts
  - Create simple prompt construction
  - _This is the ONLY thing we actually need!_

- [ ] 4.2 Add steering docs prompt system
  - Read steering docs from .kiro/steering folder
  - Include context in chat prompts
  - Format prompts for agent execution

- [ ] 5. Package and test
- [ ] 5.1 Basic testing and packaging
  - Test button → chat workflow
  - Package extension for distribution
  - Create simple README

## ❌ REMOVED (Over-engineered / Unnecessary)

~~- 4. Develop agent communication system~~ 
  - ❌ REMOVED: VS Code agent can handle this natively
  
~~- 5. Build task state management~~
  - ❌ REMOVED: Agent can modify files directly
  
~~- 6. Create extension activation and lifecycle management~~
  - ❌ REMOVED: Basic activation is sufficient
  
~~- 7. Implement end-to-end task execution flow~~
  - ❌ REMOVED: Chat handles execution
  
~~- 8. Perform testing and packaging~~
  - ❌ SIMPLIFIED: Basic testing only

## 📝 SCOPE REALITY CHECK

**What we thought we needed:** Complex agent API, state management, error handling, retry logic, document modification, lifecycle management...

**What we actually need:** Button click → Open chat → Send prompt with steering docs

**Estimated remaining work:** 2-3 hours (not 2-3 days!)

---

*Note: This reflects the #scope-discipline principle of "simplest implementation possible" and aligns with the weekend MVP timeline. The VS Code agent already handles file reading, editing, and saving - we just need to connect our buttons to the chat interface.*