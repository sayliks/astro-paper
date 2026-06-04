```markdown
# astro-paper Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development patterns and conventions used in the `astro-paper` repository, a TypeScript project built with the Astro framework. You'll learn about file naming, import/export styles, commit message habits, and how to structure and run tests. This guide also provides suggested commands for common workflows.

## Coding Conventions

### File Naming
- Use **camelCase** for file names.
  - Example: `myComponent.ts`, `userProfile.astro`

### Import Style
- Use **relative imports** for modules within the project.
  - Example:
    ```typescript
    import { fetchData } from './utils/fetchData';
    ```

### Export Style
- Use **named exports** for all modules.
  - Example:
    ```typescript
    // utils/fetchData.ts
    export function fetchData() { /* ... */ }
    ```

### Commit Messages
- Commit messages are **freeform** (no strict prefixes).
- Average length: ~43 characters.
  - Example:  
    ```
    Add dark mode toggle to header component
    ```

## Workflows

### Adding a New Component
**Trigger:** When you need to create a new UI component.
**Command:** `/add-component`

1. Create a new file in the appropriate directory using camelCase (e.g., `userCard.astro`).
2. Use relative imports for dependencies.
3. Export any helper functions or constants using named exports.
4. Write a corresponding test file if applicable (e.g., `userCard.test.ts`).

### Refactoring Code
**Trigger:** When improving or restructuring existing code.
**Command:** `/refactor`

1. Rename files using camelCase if needed.
2. Update all relative imports to match new file names.
3. Ensure all exports remain named.
4. Run tests to verify nothing is broken.

### Writing Tests
**Trigger:** When adding new features or fixing bugs.
**Command:** `/write-test`

1. Create a test file alongside the source file, following the `*.test.*` pattern (e.g., `fetchData.test.ts`).
2. Write test cases for all exported functions/components.
3. Run the test suite to ensure correctness.

## Testing Patterns

- **Test files** use the `*.test.*` naming convention (e.g., `myFunction.test.ts`).
- **Testing framework** is not specified; check project dependencies or scripts for details.
- Place test files near the code they test for easier maintenance.

**Example:**
```typescript
// fetchData.test.ts
import { fetchData } from './fetchData';

describe('fetchData', () => {
  it('should return expected data', async () => {
    const data = await fetchData();
    expect(data).toBeDefined();
  });
});
```

## Commands
| Command         | Purpose                                      |
|-----------------|----------------------------------------------|
| /add-component  | Scaffold a new component following conventions|
| /refactor       | Refactor code and update imports/exports     |
| /write-test     | Create and run tests for code changes        |
```
