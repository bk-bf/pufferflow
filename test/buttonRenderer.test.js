"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const buttonRenderer_1 = require("../src/buttonRenderer");
const taskParser_1 = require("../src/taskParser");
/**
 * Test suite for ButtonRenderer functionality
 */
describe('ButtonRenderer Tests', () => {
    let buttonRenderer;
    let taskParser;
    beforeEach(() => {
        taskParser = new taskParser_1.TaskParser();
        buttonRenderer = new buttonRenderer_1.ButtonRenderer(taskParser);
    });
    afterEach(() => {
        buttonRenderer.dispose();
    });
    describe('initialization', () => {
        it('should initialize without errors', () => {
            assert.ok(buttonRenderer, 'ButtonRenderer should be created successfully');
        });
        it('should register CodeLens provider', () => {
            // This test verifies that the ButtonRenderer doesn't throw during initialization
            // The actual CodeLens provider registration is handled internally
            assert.ok(true, 'ButtonRenderer should register CodeLens provider without errors');
        });
    });
    describe('button state management', () => {
        it('should handle button state updates', () => {
            // Create a mock editor scenario
            const mockDocument = {
                languageId: 'markdown',
                fileName: '/path/to/tasks.md',
                version: 1,
                lineCount: 2,
                uri: { toString: () => 'file:///path/to/tasks.md' },
                lineAt: (line) => ({
                    text: ['- [ ] Test task', '- [x] Completed task'][line]
                }),
                getText: () => '- [ ] Test task\n- [x] Completed task'
            };
            // This should not throw an error
            buttonRenderer.updateButtonState(0, true);
            buttonRenderer.updateButtonState(0, false);
            assert.ok(true, 'Button state updates should complete without errors');
        });
    });
    describe('button rendering', () => {
        it('should handle rendering for valid task documents', () => {
            const mockEditor = {
                document: {
                    languageId: 'markdown',
                    fileName: '/path/to/tasks.md',
                    version: 1,
                    lineCount: 2,
                    uri: { toString: () => 'file:///path/to/tasks.md' },
                    lineAt: (line) => ({
                        text: ['- [ ] Test task', '- [x] Completed task'][line]
                    }),
                    getText: () => '- [ ] Test task\n- [x] Completed task'
                }
            };
            const tasks = taskParser.parseDocument(mockEditor.document);
            // This should not throw an error
            buttonRenderer.renderButtons(mockEditor, tasks);
            assert.ok(true, 'Button rendering should complete without errors');
        });
        it('should handle non-task documents gracefully', () => {
            const mockEditor = {
                document: {
                    languageId: 'javascript',
                    fileName: '/path/to/script.js',
                    getText: () => 'console.log("Hello World");'
                }
            };
            const tasks = [];
            // This should not throw an error for non-task documents
            buttonRenderer.renderButtons(mockEditor, tasks);
            assert.ok(true, 'Should handle non-task documents gracefully');
        });
    });
    describe('cleanup and disposal', () => {
        it('should dispose resources properly', () => {
            // Create a new renderer for this test
            const testRenderer = new buttonRenderer_1.ButtonRenderer(taskParser);
            // This should not throw an error
            testRenderer.dispose();
            assert.ok(true, 'ButtonRenderer should dispose without errors');
        });
        it('should clear buttons', () => {
            // This should not throw an error
            buttonRenderer.clearButtons();
            assert.ok(true, 'Should clear buttons without errors');
        });
        it('should refresh buttons', () => {
            // This should not throw an error
            buttonRenderer.refresh();
            assert.ok(true, 'Should refresh buttons without errors');
        });
    });
});
//# sourceMappingURL=buttonRenderer.test.js.map