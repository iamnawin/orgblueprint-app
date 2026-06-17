```markdown
# orgblueprint-app Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill provides guidance on contributing to the `orgblueprint-app` TypeScript codebase. It covers established coding conventions, file organization, import/export patterns, and testing practices. While no specific frameworks or automated workflows were detected, this guide will help maintain consistency and quality in your contributions.

## Coding Conventions

### File Naming
- Use **camelCase** for file names.
  - Example:  
    ```
    userProfile.ts
    organizationSettings.ts
    ```

### Import Style
- Use **alias imports** to reference modules.
  - Example:
    ```typescript
    import { UserService as OrgUserService } from './services/userService';
    ```

### Export Style
- Use **named exports** for modules and functions.
  - Example:
    ```typescript
    // In userProfile.ts
    export function getUserProfile(id: string) { ... }

    // In another file
    import { getUserProfile } from './userProfile';
    ```

### Commit Patterns
- Commit messages are freeform, sometimes with prefixes, and average around 60 characters.
  - Example:
    ```
    Add user onboarding flow with email verification
    Fix: resolve issue with org settings update
    ```

## Workflows

_No automated workflows detected in this repository. Below are suggested manual workflows for common development tasks._

### Development Workflow
**Trigger:** When starting new features or bug fixes  
**Command:** `/dev-start`

1. Create a new branch using camelCase for the branch name.
2. Implement your feature or fix, following coding conventions.
3. Write or update tests as needed.
4. Commit changes with a clear, concise message.
5. Open a pull request for review.

### Testing Workflow
**Trigger:** Before pushing or merging changes  
**Command:** `/run-tests`

1. Identify all `*.test.*` files related to your changes.
2. Run tests using the project's preferred test runner (framework not specified; check project documentation or package.json).
3. Ensure all tests pass before submitting your code.

### Code Review Workflow
**Trigger:** After opening a pull request  
**Command:** `/request-review`

1. Assign reviewers familiar with the affected code area.
2. Respond to feedback and make necessary changes.
3. Ensure all tests pass after updates.

## Testing Patterns

- Test files follow the `*.test.*` naming convention.
  - Example:  
    ```
    userProfile.test.ts
    organizationSettings.test.ts
    ```
- The specific testing framework is not detected; check for documentation or scripts in `package.json` for details.
- Place test files alongside the modules they test or in a dedicated `tests/` directory.

**Example test file:**
```typescript
// userProfile.test.ts
import { getUserProfile } from './userProfile';

describe('getUserProfile', () => {
  it('returns user data for a valid ID', () => {
    // test implementation
  });
});
```

## Commands
| Command         | Purpose                                        |
|-----------------|------------------------------------------------|
| /dev-start      | Start a new feature or bugfix branch           |
| /run-tests      | Run all tests before pushing or merging        |
| /request-review | Request code review on your pull request       |
```
